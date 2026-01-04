import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  event_id?: string;
  email?: string;
  user_id?: string;
  time?: string; // For cron job trigger
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const body: ReminderRequest = await req.json();

    // Check if this is a cron job trigger (automated 24-hour reminders)
    if (body.time) {
      console.log("Cron job triggered at:", body.time);
      return await sendAutomatedReminders(supabase);
    }

    // Otherwise, handle manual reminder subscription
    const { event_id, email, user_id } = body;

    if (!event_id || !email) {
      return new Response(
        JSON.stringify({ error: "event_id and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("event_reminders")
      .select("id")
      .eq("event_id", event_id)
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ message: "Already subscribed to reminders for this event" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Subscribe to reminder
    const { error: insertError } = await supabase
      .from("event_reminders")
      .insert({
        event_id,
        email,
        user_id: user_id || null,
      });

    if (insertError) {
      console.error("Error inserting reminder:", insertError);
      throw insertError;
    }

    // Send confirmation email
    await sendConfirmationEmail(email, event);

    return new Response(
      JSON.stringify({ 
        message: "Reminder subscription successful",
        reminder_set: true 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-event-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

async function sendAutomatedReminders(supabase: any): Promise<Response> {
  try {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find events starting in the next 24-25 hours
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .gte("start_date", twentyFourHoursFromNow.toISOString())
      .lt("start_date", twentyFiveHoursFromNow.toISOString())
      .eq("status", "upcoming");

    if (eventsError) {
      console.error("Error fetching upcoming events:", eventsError);
      throw eventsError;
    }

    if (!upcomingEvents || upcomingEvents.length === 0) {
      console.log("No events starting in 24 hours");
      return new Response(
        JSON.stringify({ message: "No events to remind about" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${upcomingEvents.length} events starting in 24 hours`);

    let totalRemindersSent = 0;

    for (const event of upcomingEvents) {
      // Get all reminders for this event that haven't been sent yet
      const { data: reminders, error: remindersError } = await supabase
        .from("event_reminders")
        .select("*")
        .eq("event_id", event.id)
        .eq("reminder_sent", false);

      if (remindersError) {
        console.error(`Error fetching reminders for event ${event.id}:`, remindersError);
        continue;
      }

      if (!reminders || reminders.length === 0) {
        console.log(`No pending reminders for event: ${event.title}`);
        continue;
      }

      console.log(`Sending ${reminders.length} reminders for event: ${event.title}`);

      for (const reminder of reminders) {
        try {
          await sendReminderEmail(reminder.email, event);
          
          // Mark reminder as sent
          await supabase
            .from("event_reminders")
            .update({ reminder_sent: true })
            .eq("id", reminder.id);
          
          totalRemindersSent++;
          console.log(`Reminder sent to: ${reminder.email}`);
        } catch (emailError) {
          console.error(`Failed to send reminder to ${reminder.email}:`, emailError);
        }
      }
    }

    console.log(`Total reminders sent: ${totalRemindersSent}`);

    return new Response(
      JSON.stringify({ 
        message: `Sent ${totalRemindersSent} reminder(s)`,
        reminders_sent: totalRemindersSent 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in sendAutomatedReminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

async function sendConfirmationEmail(email: string, event: any) {
  const eventDate = new Date(event.start_date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const eventTime = new Date(event.start_date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  await resend.emails.send({
    from: "BCA Association <onboarding@resend.dev>",
    to: [email],
    subject: `Reminder Set: ${event.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0b; color: #e5e5e5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1a1a1d 0%, #0d0d0f 100%); border-radius: 16px; overflow: hidden; border: 1px solid #27272a; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; }
          .header h1 { margin: 0; color: #0a0a0b; font-size: 24px; }
          .content { padding: 30px; }
          .event-card { background: #18181b; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #27272a; }
          .event-title { font-size: 20px; font-weight: bold; color: #f59e0b; margin-bottom: 15px; }
          .detail { display: flex; align-items: center; margin: 10px 0; color: #a1a1aa; }
          .detail strong { color: #e5e5e5; margin-left: 10px; }
          .footer { text-align: center; padding: 20px; color: #71717a; font-size: 12px; border-top: 1px solid #27272a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Reminder Set!</h1>
          </div>
          <div class="content">
            <p>You've successfully subscribed to receive a reminder for:</p>
            <div class="event-card">
              <div class="event-title">${event.title}</div>
              <div class="detail">📅 <strong>${eventDate}</strong></div>
              <div class="detail">⏰ <strong>${eventTime}</strong></div>
              ${event.location ? `<div class="detail">📍 <strong>${event.location}</strong></div>` : ''}
            </div>
            <p>We'll send you a reminder email 24 hours before the event starts. Don't forget to mark your calendar!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} BCA Association. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  console.log("Confirmation email sent to:", email);
}

async function sendReminderEmail(email: string, event: any) {
  const eventDate = new Date(event.start_date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const eventTime = new Date(event.start_date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  await resend.emails.send({
    from: "BCA Association <onboarding@resend.dev>",
    to: [email],
    subject: `Reminder: ${event.title} starts tomorrow!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0b; color: #e5e5e5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1a1a1d 0%, #0d0d0f 100%); border-radius: 16px; overflow: hidden; border: 1px solid #27272a; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 24px; }
          .countdown { background: #18181b; text-align: center; padding: 20px; }
          .countdown-text { font-size: 32px; font-weight: bold; color: #f59e0b; }
          .countdown-label { font-size: 14px; color: #a1a1aa; }
          .content { padding: 30px; }
          .event-card { background: #18181b; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #27272a; }
          .event-title { font-size: 20px; font-weight: bold; color: #f59e0b; margin-bottom: 15px; }
          .detail { display: flex; align-items: center; margin: 10px 0; color: #a1a1aa; }
          .detail strong { color: #e5e5e5; margin-left: 10px; }
          .footer { text-align: center; padding: 20px; color: #71717a; font-size: 12px; border-top: 1px solid #27272a; }
          .cta { text-align: center; margin-top: 20px; }
          .button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0a0a0b; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Event Tomorrow!</h1>
          </div>
          <div class="countdown">
            <div class="countdown-text">24 HOURS</div>
            <div class="countdown-label">until the event starts</div>
          </div>
          <div class="content">
            <p>This is your reminder that the following event is starting tomorrow:</p>
            <div class="event-card">
              <div class="event-title">${event.title}</div>
              <div class="detail">📅 <strong>${eventDate}</strong></div>
              <div class="detail">⏰ <strong>${eventTime}</strong></div>
              ${event.location ? `<div class="detail">📍 <strong>${event.location}</strong></div>` : ''}
            </div>
            ${event.description ? `<p style="color: #a1a1aa;">${event.description.substring(0, 200)}${event.description.length > 200 ? '...' : ''}</p>` : ''}
            <p>Don't miss it! Make sure you have everything ready.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} BCA Association. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  console.log("Reminder email sent to:", email);
}

serve(handler);
