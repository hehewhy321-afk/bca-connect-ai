import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_SYSTEM_PROMPT = `You are the BCA AI Study Assistant for MMAMC College, Nepal. You are knowledgeable, friendly, and helpful.

Your expertise includes:
- BCA curriculum subjects: Programming (C, C++, Java, Python), Data Structures, Algorithms, Database Management, Web Development, Networking, Operating Systems, Software Engineering, and more
- Explaining complex computer science concepts in simple terms
- Helping debug code and fix programming errors
- Generating practice problems and quiz questions
- Summarizing study materials
- Providing exam preparation tips
- Career guidance for BCA students

Guidelines:
- Be encouraging and supportive
- Use examples when explaining concepts
- Format code blocks properly with syntax highlighting
- Keep responses concise but thorough
- If you don't know something, say so honestly
- Reference relevant resources when appropriate
- Use Nepali context when relevant (local companies, opportunities, etc.)

For image generation requests:
- When users ask to generate, create, or draw an image, respond with: [IMAGE_GEN: <description>]
- Extract the key visual elements from their request`;

interface AISettings {
  ai_provider?: string;
  openrouter_api_key?: string;
  openrouter_model?: string;
  bytez_api_key?: string;
  bytez_chat_model?: string;
  bytez_image_model?: string;
  custom_system_prompt?: string;
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

async function callLovableAI(messages: any[], systemPrompt: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    }),
  });

  return response;
}

async function callOpenRouter(messages: any[], systemPrompt: string, apiKey: string, model: string) {
  console.log("Calling OpenRouter with model:", model);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "https://lovable.dev",
      "X-Title": "BCA Study Assistant",
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    }),
  });

  return response;
}

async function callBytezChat(messages: any[], systemPrompt: string, apiKey: string, model: string) {
  console.log("Calling Bytez with model:", model);

  const response = await fetch(`https://api.bytez.com/models/v2/${model}`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
      params: {
        max_length: 2048,
        temperature: 0.7,
      },
    }),
  });

  return response;
}

async function callBytezImageGen(prompt: string, apiKey: string, model: string) {
  console.log("Calling Bytez Image Generation with model:", model);

  const response = await fetch(`https://api.bytez.com/models/v2/${model}`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: prompt,
    }),
  });

  return response;
}

function detectImageGenRequest(content: string): string | null {
  const imagePatterns = [
    /generate\s+(?:an?\s+)?image\s+(?:of\s+)?(.+)/i,
    /create\s+(?:an?\s+)?image\s+(?:of\s+)?(.+)/i,
    /draw\s+(?:an?\s+)?(?:image\s+(?:of\s+)?)?(.+)/i,
    /make\s+(?:an?\s+)?image\s+(?:of\s+)?(.+)/i,
    /show\s+(?:me\s+)?(?:an?\s+)?image\s+(?:of\s+)?(.+)/i,
    /visualize\s+(.+)/i,
  ];

  for (const pattern of imagePatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // VALIDATE AUTHENTICATION - Prevent unauthenticated access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: 'Unauthorized - please log in to use the AI assistant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify JWT and get user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create client with user's auth token
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

    const { messages, mode } = await req.json();
    
    // Create admin client to fetch settings
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get AI settings from database
    const settings = await getAISettings(supabaseClient);
    
    const provider = settings?.ai_provider || "lovable";
    const systemPrompt = settings?.custom_system_prompt || DEFAULT_SYSTEM_PROMPT;
    
    console.log("Using AI provider:", provider);
    console.log("Processing chat request for user:", user.id, "with", messages.length, "messages");

    // Check for image generation request (only for Bytez)
    const lastMessage = messages[messages.length - 1];
    if (provider === "bytez" && lastMessage?.role === "user") {
      const imagePrompt = detectImageGenRequest(lastMessage.content);
      
      if (imagePrompt || mode === "image") {
        const apiKey = settings?.bytez_api_key;
        const imageModel = settings?.bytez_image_model || "dreamlike-art/dreamlike-photoreal-2.0";

        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Bytez API key not configured. Please set it in Admin > AI Settings." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        try {
          const imageResponse = await callBytezImageGen(imagePrompt || lastMessage.content, apiKey, imageModel);
          
          if (!imageResponse.ok) {
            const errorText = await imageResponse.text();
            console.error("Bytez image generation error:", imageResponse.status, errorText);
            throw new Error("Failed to generate image");
          }

          const imageData = await imageResponse.json();
          
          // Return image as a special response
          return new Response(
            JSON.stringify({ 
              type: "image",
              output: imageData.output,
              prompt: imagePrompt || lastMessage.content
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.error("Image generation error:", error);
          // Fall back to chat response about the image
        }
      }
    }

    let response: Response;

    if (provider === "bytez") {
      const apiKey = settings?.bytez_api_key;
      const model = settings?.bytez_chat_model || "Qwen/Qwen3-4B";

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Bytez API key not configured. Please set it in Admin > AI Settings." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      response = await callBytezChat(messages, systemPrompt, apiKey, model);
    } else if (provider === "openrouter") {
      // Get API key from database settings
      const apiKey = settings?.openrouter_api_key;
      const model = settings?.openrouter_model || "meta-llama/llama-3.2-3b-instruct:free";

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "OpenRouter API key not configured. Please set it in Admin > AI Settings." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      response = await callOpenRouter(messages, systemPrompt, apiKey, model);
    } else {
      response = await callLovableAI(messages, systemPrompt);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI provider error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits or switch to a free model." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid API key. Please check your API key in Admin > AI Settings." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response from AI provider");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
