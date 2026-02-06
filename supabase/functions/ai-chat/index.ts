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
  groq_api_key?: string;
  groq_model?: string;
  cerebras_api_key?: string;
  cerebras_model?: string;
  bytez_api_key?: string;
  bytez_chat_model?: string;
  bytez_image_model?: string;
  krea_api_key?: string;
  krea_model?: string;
  airforce_api_key?: string;
  airforce_model?: string;
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

async function callGroq(messages: any[], systemPrompt: string, apiKey: string, model: string) {
  console.log("Calling Groq with model:", model);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
      temperature: 0.6,
      max_completion_tokens: 4096,
    }),
  });

  return response;
}

async function callCerebras(messages: any[], systemPrompt: string, apiKey: string, model: string) {
  console.log("Calling Cerebras with model:", model);

  const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
      temperature: 0.2,
      max_completion_tokens: 2048,
    }),
  });

  return response;
}

// Free image generation using Pollinations.ai (completely free, no API key needed)
// Fetches the image and converts to base64 to avoid CORS issues
async function callPollinationsImageGen(prompt: string, model: string = "flux") {
  console.log("Calling Pollinations.ai for image generation with model:", model);

  // Pollinations.ai supports various models like flux, flux-realism, etc.
  const encodedPrompt = encodeURIComponent(prompt);

  // Generate the Pollinations URL - using gen.pollinations.ai for better stability if needed
  // but image.pollinations.ai is the standard for direct image links
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${model}&width=1024&height=1024&nologo=true&enhance=true&seed=${Math.floor(Math.random() * 1000000)}`;

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

async function callKreaImageGen(prompt: string, apiKey: string, model: string = "flux") {
  console.log("Calling Krea.ai for image generation with model:", model);

  try {
    const response = await fetch("https://api.krea.ai/v1/image-gen", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        providers: [model],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Krea.ai request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const jobId = data.id;
    console.log("Krea.ai job started, ID:", jobId);

    // Polling for the result
    let result = null;
    let attempts = 0;
    const maxAttempts = 40; // ~40 seconds timeout

    while (attempts < maxAttempts) {
      // Wait 1 second between polls
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;

      const pollResponse = await fetch(`https://api.krea.ai/v1/image-gen/${jobId}`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (pollResponse.ok) {
        const pollData = await pollResponse.json();
        if (pollData.status === "completed") {
          result = pollData.uri || (pollData.images && pollData.images[0]?.uri);
          break;
        } else if (pollData.status === "error" || pollData.status === "failed") {
          throw new Error(`Krea.ai generation failed: ${pollData.error || "Unknown error"}`);
        }
      }
    }

    if (!result) {
      throw new Error("Krea.ai generation timed out");
    }

    return result;
  } catch (error) {
    console.error("Krea.ai implementation error:", error);
    throw error;
  }
}

async function callAirforceImageGen(prompt: string, apiKey: string, model: string = "plutogen-o1") {
  console.log("Calling API Airforce for image generation with model:", model);

  // Default API key from user if none provided in settings
  const finalApiKey = apiKey || "sk-air-qGzkGvPKeulFnozFsw3nbIvFyZpZSBvxiXhrLkKWgUnJ0d1sJ8U7ssM8ajuWTc19";

  try {
    const response = await fetch("https://api.airforce/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${finalApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        response_format: "url",
        sse: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Airforce request failed: ${response.status} ${errorText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let accumulatedData = '';
    let resultUrl = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      accumulatedData += decoder.decode(value, { stream: true });
      const lines = accumulatedData.split('\n\n');
      accumulatedData = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          if (dataStr === ': keepalive') continue;

          try {
            const data = JSON.parse(dataStr);
            console.log("Airforce SSE Data:", data);
            // Check for potential URL locations
            if (data.data && Array.isArray(data.data) && data.data[0]?.url) {
              resultUrl = data.data[0].url;
              break;
            } else if (data.url) {
              resultUrl = data.url;
              break;
            }
          } catch (e) {
            // Ignore parse errors for non-json data
          }
        }
      }
      if (resultUrl) break;
    }

    if (!resultUrl) {
      throw new Error("API Airforce generation failed: No image URL found in response");
    }

    return resultUrl;
  } catch (error) {
    console.error("API Airforce implementation error:", error);
    throw error;
  }
}

async function callOpenRouter(messages: any[], systemPrompt: string, apiKey: string, model: string) {
  console.log("Calling OpenRouter with model:", model);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "https://bca-connect-ai.vercel.app",
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
  const modelId = model.includes('/') ? model : `Qwen/Qwen2.5-1.5B-Instruct`;
  console.log("Calling Bytez with model:", modelId);

  // Use OpenAI-compatible endpoint for proper streaming format
  const response = await fetch(`https://api.bytez.com/models/v2/openai/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Model": modelId, // Some OpenAI proxies use this
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

    const provider = settings?.ai_provider || "openrouter";
    const systemPrompt = settings?.custom_system_prompt || DEFAULT_SYSTEM_PROMPT;

    console.log("Using AI provider:", provider);
    console.log("Processing chat request for user:", user.id, "with", messages.length, "messages");

    // Handle explicit image mode or image generation request
    const lastMessage = messages[messages.length - 1];
    const imagePrompt = lastMessage?.role === "user" ? detectImageGenRequest(lastMessage.content) : null;

    // If mode is "image" or image prompt detected, generate image
    if (mode === "image" || imagePrompt) {
      const requestedPrompt = imagePrompt || lastMessage.content;

      // Determine which provider to use for image generation - Prioritize API Airforce then Krea.ai
      const airforceApiKey = settings?.airforce_api_key || "";
      try {
        const airforceModel = settings?.airforce_model || "plutogen-o1";
        const imageUrl = await callAirforceImageGen(requestedPrompt, airforceApiKey, airforceModel);

        if (imageUrl) {
          await supabaseClient.from("ai_generated_images").insert({
            user_id: user.id,
            prompt: requestedPrompt,
            image_url: imageUrl,
            model_used: `airforce:${airforceModel}`,
          });

          return new Response(
            JSON.stringify({
              type: "image",
              output: imageUrl,
              prompt: requestedPrompt,
              model: airforceModel,
              provider: "airforce",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        console.error("API Airforce failed, falling back to Krea.ai...", error);
      }

      const kreaApiKey = settings?.krea_api_key;
      if (kreaApiKey) {
        try {
          const kreaModel = settings?.krea_model || "flux";
          const imageUrl = await callKreaImageGen(requestedPrompt, kreaApiKey, kreaModel);

          if (imageUrl) {
            await supabaseClient.from("ai_generated_images").insert({
              user_id: user.id,
              prompt: requestedPrompt,
              image_url: imageUrl,
              model_used: `krea:${kreaModel}`,
            });

            return new Response(
              JSON.stringify({
                type: "image",
                output: imageUrl,
                prompt: requestedPrompt,
                model: kreaModel,
                provider: "krea",
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch (error) {
          console.error("Krea.ai failed, falling back...", error);
        }
      }

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
              console.log("Bytez plan limitation - falling back to Pollinations");
            }
          }

          // Fallback chain: Try Hugging Face (free) → Pollinations (free)
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
              throw new Error("All image generation providers failed");
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
        // Use free alternatives first (Hugging Face → Pollinations)
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
              throw new Error("All image generation providers failed");
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
      const model = settings?.bytez_chat_model || "Qwen/Qwen2.5-1.5B-Instruct";
      providerInfo.model = model;

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Bytez API key not configured. Please set it in Admin > AI Settings." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      response = await callBytezChat(messages, systemPrompt, apiKey, model);
    } else if (provider === "groq") {
      const apiKey = settings?.groq_api_key;
      const model = settings?.groq_model || "llama-3.3-70b-versatile";
      providerInfo.model = model;

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Groq API key not configured. Please set it in Admin > AI Settings." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      response = await callGroq(messages, systemPrompt, apiKey, model);
    } else if (provider === "cerebras") {
      const apiKey = settings?.cerebras_api_key;
      const model = settings?.cerebras_model || "llama-3.3-70b";
      providerInfo.model = model;

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Cerebras API key not configured. Please set it in Admin > AI Settings." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      response = await callCerebras(messages, systemPrompt, apiKey, model);
    } else {
      // Default to OpenRouter if provider is unknown or was lovable
      const apiKey = settings?.openrouter_api_key;
      const model = settings?.openrouter_model || "meta-llama/llama-3.2-3b-instruct:free";
      providerInfo.provider = "openrouter";
      providerInfo.model = model;

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "AI provider not correctly configured. Please check Admin > AI Settings." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      response = await callOpenRouter(messages, systemPrompt, apiKey, model);
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

      if (provider === "bytez" && (response.status === 503 || response.status === 504 || (response.status === 500 && errorText.includes("deploying")))) {
        return new Response(
          JSON.stringify({
            error: "The AI model is currently waking up. This usually takes 15-30 seconds on the first use. Please try sending your message again in a few moments.",
            code: "MODEL_WAKING_UP"
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If it's a Specific Bytez error, pass it through to help debugging
      if (provider === "bytez") {
        return new Response(
          JSON.stringify({
            error: `Bytez Error (${response.status}): ${errorText.length > 100 ? errorText.substring(0, 100) + "..." : errorText}`,
            code: "BYTEZ_ERROR",
            details: errorText
          }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
