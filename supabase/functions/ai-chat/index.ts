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

// Free image generation using Pollinations.ai (completely free, no API key needed)
// Fetches the image and converts to base64 to avoid CORS issues
async function callPollinationsImageGen(prompt: string, model: string = "flux") {
  console.log("Calling Pollinations.ai for image generation with model:", model);
  
  // Pollinations.ai supports: flux, flux-realism, flux-anime, flux-3d, turbo
  const encodedPrompt = encodeURIComponent(prompt);
  
  // Generate the Pollinations URL
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${model}&width=1024&height=1024&nologo=true&enhance=true`;
  
  console.log("Generated Pollinations URL:", imageUrl);
  
  try {
    // Fetch the image from Pollinations
    console.log("Fetching image from Pollinations...");
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Pollinations returned ${response.status}`);
    }
    
    // Convert to base64 to avoid CORS issues in frontend
    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64 = btoa(binary);
    const dataUrl = `data:image/png;base64,${base64}`;
    
    console.log("Pollinations image converted to base64, length:", dataUrl.length);
    return dataUrl;
  } catch (error) {
    console.error("Failed to fetch/convert Pollinations image:", error);
    // Return the direct URL as fallback (may have CORS issues)
    return imageUrl;
  }
}

// Get Pollinations model from settings
async function getPollinationsModel(supabaseClient: any): Promise<string> {
  try {
    const { data, error } = await supabaseClient
      .from("ai_settings")
      .select("setting_value")
      .eq("setting_key", "pollinations_model")
      .single();
    
    if (error || !data) {
      return "flux"; // Default model
    }
    
    return data.setting_value || "flux";
  } catch (error) {
    console.error("Error fetching Pollinations model:", error);
    return "flux";
  }
}

// Free image generation using Hugging Face Inference API
async function callHuggingFaceImageGen(prompt: string, model: string = "black-forest-labs/FLUX.1-schnell") {
  console.log("Calling Hugging Face for image generation with model:", model);
  
  // Use Hugging Face's free inference API
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        num_inference_steps: 4,
        guidance_scale: 0,
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face image generation failed: ${response.status} ${errorText}`);
  }

  // Response is the image blob
  const imageBlob = await response.blob();
  
  // Convert blob to base64 data URL
  const arrayBuffer = await imageBlob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  const base64 = btoa(binary);
  return `data:image/png;base64,${base64}`;
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

    // Handle explicit image mode or image generation request
    const lastMessage = messages[messages.length - 1];
    const imagePrompt = lastMessage?.role === "user" ? detectImageGenRequest(lastMessage.content) : null;
    
    // If mode is "image" or image prompt detected, generate image
    if (mode === "image" || imagePrompt) {
      const requestedPrompt = imagePrompt || lastMessage.content;
      
      // Determine which provider to use for image generation
      if (provider === "bytez") {
        const apiKey = settings?.bytez_api_key;
        const imageModel = settings?.bytez_image_model || "black-forest-labs/FLUX.1-schnell";

        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Bytez API key not configured. Please set it in Admin > AI Settings." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        try {
          console.log("Calling Bytez Image Generation with model:", imageModel);
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
                model_used: `bytez:${imageModel}`,
              });

              return new Response(
                JSON.stringify({
                  type: "image",
                  output: imageUrl,
                  prompt: requestedPrompt,
                  model: imageModel,
                  provider: "bytez",
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            console.error("Bytez image generation returned no image output");
          } else {
            const errorText = await imageResponse.text();
            console.error("Bytez image generation error:", imageResponse.status, errorText);
            
            // Check if it's a plan limitation error
            if (imageResponse.status === 403 && errorText.includes("upgrade")) {
              console.log("Bytez plan limitation - falling back to Lovable");
            }
          }

          // Fallback chain: Try Hugging Face (free) → Pollinations (free) → Lovable
          console.log("Bytez failed, trying free alternatives...");
          
          let fallbackImageUrl = "";
          let fallbackProvider = "";
          let fallbackModel = "";
          
          try {
            // Try Hugging Face first (more reliable, no promotional images)
            console.log("Trying Hugging Face (free)...");
            fallbackImageUrl = await callHuggingFaceImageGen(requestedPrompt, "black-forest-labs/FLUX.1-schnell");
            fallbackProvider = "huggingface";
            fallbackModel = "FLUX.1-schnell";
          } catch (hfError) {
            console.error("Hugging Face failed:", hfError);
            
            try {
              // Try Pollinations as backup
              console.log("Trying Pollinations.ai (free)...");
              const pollinationsModel = await getPollinationsModel(supabaseClient);
              fallbackImageUrl = await callPollinationsImageGen(requestedPrompt, pollinationsModel);
              fallbackProvider = "pollinations";
              fallbackModel = pollinationsModel;
            } catch (pollinationsError) {
              console.error("Pollinations failed:", pollinationsError);
              
              // Last resort: Lovable
              console.log("Trying Lovable as last resort...");
              fallbackImageUrl = await callLovableImageGen(requestedPrompt);
              fallbackProvider = "lovable";
              fallbackModel = "gemini-3-pro-image";
            }
          }

          await supabaseClient.from("ai_generated_images").insert({
            user_id: user.id,
            prompt: requestedPrompt,
            image_url: fallbackImageUrl,
            model_used: `${fallbackProvider}:${fallbackModel}`,
          });

          return new Response(
            JSON.stringify({
              type: "image",
              output: fallbackImageUrl,
              prompt: requestedPrompt,
              model: fallbackModel,
              provider: fallbackProvider,
              fallback: true,
              fallbackReason: `Bytez unavailable - using ${fallbackProvider} (free alternative)`,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.error("Image generation error:", error);
          return new Response(
            JSON.stringify({
              error: "Image generation failed. Please try again, or switch image model/provider in AI Settings.",
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Use free alternatives first (Hugging Face → Pollinations → Lovable)
        try {
          let imageUrl = "";
          let provider = "";
          let model = "";
          
          try {
            // Try Hugging Face first (free, more reliable)
            console.log("Using Hugging Face for image generation (free)...");
            imageUrl = await callHuggingFaceImageGen(requestedPrompt, "black-forest-labs/FLUX.1-schnell");
            provider = "huggingface";
            model = "FLUX.1-schnell";
            console.log("Hugging Face succeeded, image URL length:", imageUrl.length);
          } catch (hfError) {
            console.error("Hugging Face failed with error:", hfError);
            console.error("HF Error details:", hfError instanceof Error ? hfError.message : String(hfError));
            
            try {
              // Try Pollinations as backup (free, but may show promotional images)
              console.log("Trying Pollinations.ai (free)...");
              const pollinationsModel = await getPollinationsModel(supabaseClient);
              imageUrl = await callPollinationsImageGen(requestedPrompt, pollinationsModel);
              provider = "pollinations";
              model = pollinationsModel;
            } catch (pollinationsError) {
              console.error("Pollinations failed:", pollinationsError);
              
              // Last resort: Lovable
              console.log("Using Lovable for image generation...");
              imageUrl = await callLovableImageGen(requestedPrompt);
              provider = "lovable";
              model = "gemini-3-pro-image";
            }
          }

          await supabaseClient.from("ai_generated_images").insert({
            user_id: user.id,
            prompt: requestedPrompt,
            image_url: imageUrl,
            model_used: `${provider}:${model}`,
          });

          return new Response(
            JSON.stringify({
              type: "image",
              output: imageUrl,
              prompt: requestedPrompt,
              model: model,
              provider: provider,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (error) {
          console.error("Image generation error:", error);
          return new Response(
            JSON.stringify({
              error: "Image generation failed. Please try again.",
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Regular chat mode
    let response: Response;
    let providerInfo = { provider: provider, model: "" };

    if (provider === "bytez") {
      const apiKey = settings?.bytez_api_key;
      const model = settings?.bytez_chat_model || "Qwen/Qwen3-4B";
      providerInfo.model = model;

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
      providerInfo.model = model;

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "OpenRouter API key not configured. Please set it in Admin > AI Settings." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      response = await callOpenRouter(messages, systemPrompt, apiKey, model);
    } else {
      providerInfo.provider = "lovable";
      providerInfo.model = "google/gemini-2.5-flash";
      response = await callLovableAI(messages, systemPrompt);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI provider error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment.", code: "RATE_LIMITED" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits or switch to a free model.", code: "CREDITS_EXHAUSTED" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid API key. Please check your API key in Admin > AI Settings.", code: "INVALID_API_KEY" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable", code: "SERVICE_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response from AI provider:", providerInfo.provider, providerInfo.model);

    // Add provider info header to response
    const headers = new Headers(corsHeaders);
    headers.set("Content-Type", "text/event-stream");
    headers.set("X-AI-Provider", providerInfo.provider);
    headers.set("X-AI-Model", providerInfo.model);

    return new Response(response.body, { headers });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
