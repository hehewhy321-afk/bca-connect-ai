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
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    }),
  });

  return response;
}

async function callLovableImageGen(prompt: string) {
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
      model: "google/gemini-3-pro-image-preview",
      messages: [
        {
          role: "user",
          content: `Generate an image: ${prompt}`,
        },
      ],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lovable image generation failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

  if (!imageUrl) {
    throw new Error("Lovable image generation returned no image");
  }

  return imageUrl as string;
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
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    }),
  });

  return response;
}

async function callBytezChat(messages: any[], systemPrompt: string, apiKey: string, model: string) {
  // Ensure model has proper format - if it doesn't have a slash, use a default known working model
  const modelId = model.includes('/') ? model : `Qwen/Qwen3-4B`;
  console.log("Calling Bytez with model:", modelId);

  // Use OpenAI-compatible endpoint for proper streaming format
  const response = await fetch(`https://api.bytez.com/models/v2/openai/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 2048,
      temperature: 0.7,
      stream: true,
    }),
  });

  return response;
}

async function callBytezImageGen(prompt: string, apiKey: string, model: string) {
  // Ensure model has proper format for image generation
  const modelId = model.includes('/') ? model : `black-forest-labs/FLUX.1-schnell`;
  console.log("Calling Bytez Image Generation with model:", modelId);

  const response = await fetch(`https://api.bytez.com/models/v2/${modelId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: prompt,
      num_inference_steps: 4,
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
        const imageModel = settings?.bytez_image_model || "black-forest-labs/FLUX.1-schnell";

        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Bytez API key not configured. Please set it in Admin > AI Settings." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        try {
          const requestedPrompt = imagePrompt || lastMessage.content;

          // 1) Try Bytez image generation first
          const imageResponse = await callBytezImageGen(requestedPrompt, apiKey, imageModel);

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();

            // Extract image URL from response (Bytez returns base64 or URL)
            let imageUrl = "";
            if (imageData.output) {
              if (typeof imageData.output === "string") {
                if (imageData.output.startsWith("http")) {
                  imageUrl = imageData.output;
                } else if (imageData.output.startsWith("data:")) {
                  imageUrl = imageData.output;
                } else {
                  imageUrl = `data:image/png;base64,${imageData.output}`;
                }
              } else if (Array.isArray(imageData.output) && imageData.output[0]) {
                const first = imageData.output[0];
                if (typeof first === "string") {
                  imageUrl = first.startsWith("http") ? first : `data:image/png;base64,${first}`;
                } else if (first.url) {
                  imageUrl = first.url;
                } else if (first.b64_json) {
                  imageUrl = `data:image/png;base64,${first.b64_json}`;
                }
              }
            }

            if (imageUrl) {
              await supabaseClient.from("ai_generated_images").insert({
                user_id: user.id,
                prompt: requestedPrompt,
                image_url: imageUrl,
                model_used: imageModel,
              });

              return new Response(
                JSON.stringify({
                  type: "image",
                  output: imageUrl,
                  prompt: requestedPrompt,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            console.error("Bytez image generation returned no image output");
          } else {
            const errorText = await imageResponse.text();
            console.error("Bytez image generation error:", imageResponse.status, errorText);
          }

          // 2) Fallback to Lovable image generation (works without Bytez plan limits)
          console.log("Falling back to Lovable image generation");
          const fallbackImageUrl = await callLovableImageGen(requestedPrompt);

          await supabaseClient.from("ai_generated_images").insert({
            user_id: user.id,
            prompt: requestedPrompt,
            image_url: fallbackImageUrl,
            model_used: "lovable:google/gemini-3-pro-image-preview",
          });

          return new Response(
            JSON.stringify({
              type: "image",
              output: fallbackImageUrl,
              prompt: requestedPrompt,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.error("Image generation error:", error);
          return new Response(
            JSON.stringify({
              error:
                "Image generation failed. Please try again, or switch image model/provider in AI Settings.",
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
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
