import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AISettings {
  bytez_api_key?: string;
}

async function getAISettings(supabaseClient: any): Promise<AISettings | null> {
  try {
    const { data, error } = await supabaseClient
      .from("ai_settings")
      .select("setting_key, setting_value");
    
    if (error) {
      console.error("Error fetching AI settings:", error);
      return null;
    }

    const settings: AISettings = {};
    data?.forEach((row: any) => {
      settings[row.setting_key as keyof AISettings] = row.setting_value || "";
    });

    return settings;
  } catch (error) {
    console.error("Error in getAISettings:", error);
    return null;
  }
}

// Speech-to-Text using Bytez Whisper
async function speechToText(audioData: string, apiKey: string): Promise<string> {
  console.log("Processing speech-to-text with Bytez Whisper");
  console.log("Audio data length:", audioData.length);
  
  try {
    // Bytez expects base64 audio directly in the request body
    console.log("Sending to Bytez Whisper API with base64 audio...");
    
    const response = await fetch("https://api.bytez.com/models/v2/openai/whisper-large-v3", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base64: audioData,
      }),
    });

    console.log("Bytez STT response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Bytez STT error:", response.status, errorText);
      throw new Error(`Failed to transcribe audio: ${errorText}`);
    }

    const result = await response.json();
    console.log("STT result:", result);
    
    // Bytez returns the transcription in the output field
    return result.output || result.text || "";
  } catch (error) {
    console.error("STT processing error:", error);
    throw error;
  }
}

// Text-to-Speech using Bytez
async function textToSpeech(text: string, apiKey: string, voice = "alloy"): Promise<ArrayBuffer> {
  console.log("Processing text-to-speech with Bytez, voice:", voice);
  
  const response = await fetch("https://api.bytez.com/models/v2/openai/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      voice: voice,
      model: "tts-1",
      response_format: "mp3",
    }),
  });

  console.log("TTS response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Bytez TTS error:", response.status, errorText);
    throw new Error(`Failed to generate speech: ${errorText}`);
  }

  return await response.arrayBuffer();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // VALIDATE AUTHENTICATION
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: 'Unauthorized - please log in to use voice features' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify JWT and get user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session - please log in again' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { action, audio, text, voice } = await req.json();
    console.log("Voice action:", action, "audio length:", audio?.length || 0);
    
    // Create admin client to fetch settings
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get AI settings from database
    const settings = await getAISettings(supabaseClient);
    const apiKey = settings?.bytez_api_key;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Bytez API key not configured. Please set it in Admin > AI Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "stt") {
      // Speech-to-Text
      if (!audio) {
        return new Response(
          JSON.stringify({ error: "No audio data provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (audio.length < 100) {
        return new Response(
          JSON.stringify({ error: "Audio data is too short. Please record a longer message." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const transcription = await speechToText(audio, apiKey);
      
      if (!transcription || transcription.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Could not detect speech. Please try speaking more clearly." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ text: transcription }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "tts") {
      // Text-to-Speech
      if (!text) {
        return new Response(
          JSON.stringify({ error: "No text provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const audioBuffer = await textToSpeech(text, apiKey, voice || "alloy");
      
      // Convert to base64 for easy handling in frontend
      const uint8Array = new Uint8Array(audioBuffer);
      let binary = '';
      const chunkSize = 0x8000;
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64Audio = btoa(binary);
      
      return new Response(
        JSON.stringify({ audioContent: base64Audio }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'stt' or 'tts'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Voice function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
