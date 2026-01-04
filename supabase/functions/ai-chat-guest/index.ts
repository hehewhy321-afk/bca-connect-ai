import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GUEST_SYSTEM_PROMPT = `You are the BCA AI Study Assistant for MMAMC College, Nepal. You are knowledgeable, friendly, and helpful.

Your expertise includes:
- BCA curriculum subjects: Programming (C, C++, Java, Python), Data Structures, Algorithms, Database Management, Web Development, Networking, Operating Systems, Software Engineering
- Explaining complex computer science concepts in simple terms
- Helping with programming questions

Guidelines:
- Be encouraging and supportive
- Use examples when explaining concepts
- Format code blocks properly
- Keep responses concise but helpful
- This is a trial chat - encourage users to sign up for full access`;

async function getAISettings(supabaseClient: any) {
  try {
    const { data, error } = await supabaseClient
      .from("ai_settings")
      .select("setting_key, setting_value");
    
    if (error) {
      console.error("Error fetching AI settings:", error);
      return null;
    }

    const settings: Record<string, string> = {};
    data?.forEach((row: any) => {
      settings[row.setting_key] = row.setting_value || "";
    });

    return settings;
  } catch (error) {
    console.error("Error in getAISettings:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // Limit messages for guest users
    if (messages.length > 4) {
      return new Response(
        JSON.stringify({ error: "Guest chat limit reached. Please sign up for unlimited access." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get AI settings from database
    const settings = await getAISettings(supabaseClient);
    const provider = settings?.ai_provider || "lovable";

    console.log("Guest chat - Using provider:", provider, "Messages:", messages.length);

    let response: Response;

    if (provider === "openrouter") {
      const apiKey = settings?.openrouter_api_key;
      const model = settings?.openrouter_model || "meta-llama/llama-3.2-3b-instruct:free";

      if (!apiKey) {
        // Fall back to Lovable AI
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
          return new Response(
            JSON.stringify({ error: "AI service not configured" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: GUEST_SYSTEM_PROMPT },
              ...messages,
            ],
            stream: true,
          }),
        });
      } else {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": supabaseUrl || "https://lovable.dev",
            "X-Title": "BCA Study Assistant - Guest",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: GUEST_SYSTEM_PROMPT },
              ...messages,
            ],
            stream: true,
          }),
        });
      }
    } else {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: "AI service not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: GUEST_SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Guest chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
