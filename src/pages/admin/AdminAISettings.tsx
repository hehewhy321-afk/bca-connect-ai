import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Bot, Key, Sparkles, ExternalLink, Image, Zap, Plus, X, Eye, Mic, Volume2, ImageIcon, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AISettingsMap {
  ai_provider: string;
  openrouter_api_key: string;
  openrouter_model: string;
  openrouter_custom_models: string;
  groq_api_key: string;
  groq_model: string;
  groq_custom_models: string;
  cerebras_api_key: string;
  cerebras_model: string;
  cerebras_custom_models: string;
  bytez_api_key: string;
  bytez_chat_model: string;
  bytez_image_model: string;
  bytez_custom_models: string;
  pollinations_model: string;
  puter_chat_model: string;
  puter_custom_models: string;
  krea_api_key: string;
  krea_model: string;
  airforce_api_key: string;
  airforce_model: string;
  custom_system_prompt: string;
}

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  tier: string;
  category: string;
}

// Free and low-cost models available on OpenRouter
const FREE_MODELS: ModelInfo[] = [
  { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Llama 3.2 3B Instruct", provider: "Meta", tier: "free", category: "LLM" },
  { id: "meta-llama/llama-3.2-1b-instruct:free", name: "Llama 3.2 1B Instruct", provider: "Meta", tier: "free", category: "LLM" },
  { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B Instruct", provider: "Meta", tier: "free", category: "LLM" },
  { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B", provider: "Google", tier: "free", category: "LLM" },
  { id: "microsoft/phi-3-mini-128k-instruct:free", name: "Phi-3 Mini 128K", provider: "Microsoft", tier: "free", category: "LLM" },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B Instruct", provider: "Mistral AI", tier: "free", category: "LLM" },
  { id: "openchat/openchat-7b:free", name: "OpenChat 7B", provider: "OpenChat", tier: "free", category: "LLM" },
  { id: "huggingfaceh4/zephyr-7b-beta:free", name: "Zephyr 7B Beta", provider: "HuggingFace", tier: "free", category: "LLM" },
  { id: "nousresearch/nous-capybara-7b:free", name: "Nous Capybara 7B", provider: "Nous Research", tier: "free", category: "LLM" },
  { id: "qwen/qwen-2-7b-instruct:free", name: "Qwen 2 7B Instruct", provider: "Alibaba", tier: "free", category: "LLM" },
];

const PAID_MODELS: ModelInfo[] = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", tier: "paid", category: "LLM" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI", tier: "paid", category: "LLM" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", tier: "paid", category: "LLM" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", provider: "Anthropic", tier: "paid", category: "LLM" },
  { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5", provider: "Google", tier: "paid", category: "LLM" },
  { id: "google/gemini-flash-1.5", name: "Gemini Flash 1.5", provider: "Google", tier: "paid", category: "LLM" },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B", provider: "Meta", tier: "paid", category: "LLM" },
  { id: "mistralai/mixtral-8x7b-instruct", name: "Mixtral 8x7B", provider: "Mistral AI", tier: "paid", category: "LLM" },
];

const ALL_OPENROUTER_MODELS = [...FREE_MODELS, ...PAID_MODELS];

// Bytez models organized by category - using verified working model IDs
const BYTEZ_LLM_MODELS: ModelInfo[] = [
  // General-purpose LLMs - verified working models
  { id: "Qwen/Qwen2.5-0.5B-Instruct", name: "Qwen2.5 0.5B (Lite/Free)", provider: "Qwen", tier: "free", category: "LLM" },
  { id: "Qwen/Qwen2.5-1.5B-Instruct", name: "Qwen2.5 1.5B (Fast/Free)", provider: "Qwen", tier: "free", category: "LLM" },
  { id: "Qwen/Qwen2.5-7B-Instruct", name: "Qwen2.5 7B Instruct", provider: "Qwen", tier: "free", category: "LLM" },
  { id: "Qwen/Qwen2.5-14B-Instruct", name: "Qwen2.5 14B Instruct", provider: "Qwen", tier: "free", category: "LLM" },
  { id: "meta-llama/Llama-3.2-3B-Instruct", name: "Llama 3.2 3B Instruct", provider: "Meta", tier: "free", category: "LLM" },
  { id: "meta-llama/Llama-3.1-8B-Instruct", name: "Llama 3.1 8B Instruct", provider: "Meta", tier: "free", category: "LLM" },
  { id: "meta-llama/Llama-2-7b-chat-hf", name: "Llama 2 7B Chat", provider: "Meta", tier: "free", category: "LLM" },
  { id: "mistralai/Mistral-7B-Instruct-v0.3", name: "Mistral 7B Instruct v0.3", provider: "Mistral AI", tier: "free", category: "LLM" },
  { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", name: "Mixtral 8x7B Instruct", provider: "Mistral AI", tier: "free", category: "LLM" },
  { id: "microsoft/Phi-3-mini-4k-instruct", name: "Phi-3 Mini 4K", provider: "Microsoft", tier: "free", category: "LLM" },
  { id: "microsoft/Phi-3.5-mini-instruct", name: "Phi-3.5 Mini", provider: "Microsoft", tier: "free", category: "LLM" },
  { id: "google/gemma-2-9b-it", name: "Gemma 2 9B", provider: "Google", tier: "free", category: "LLM" },
  { id: "google/gemma-2-2b-it", name: "Gemma 2 2B", provider: "Google", tier: "free", category: "LLM" },
  { id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B", name: "DeepSeek R1 Distill 7B", provider: "DeepSeek", tier: "free", category: "LLM" },
];

const BYTEZ_VLM_MODELS: ModelInfo[] = [
  // Vision-Language Models
  { id: "Qwen/Qwen2-VL-7B-Instruct", name: "Qwen2 VL 7B", provider: "Qwen", tier: "free", category: "VLM" },
  { id: "llava-hf/llava-1.5-7b-hf", name: "LLaVA 1.5 7B", provider: "LLaVA", tier: "free", category: "VLM" },
  { id: "microsoft/Phi-3-vision-128k-instruct", name: "Phi-3 Vision 128K", provider: "Microsoft", tier: "free", category: "VLM" },
];

const BYTEZ_IMAGE_GEN_MODELS: ModelInfo[] = [
  // Image Generation / Diffusion Models - verified working models
  { id: "black-forest-labs/FLUX.1-schnell", name: "FLUX.1 Schnell (Fast)", provider: "Black Forest Labs", tier: "free", category: "Image Gen" },
  { id: "black-forest-labs/FLUX.1-dev", name: "FLUX.1 Dev (Quality)", provider: "Black Forest Labs", tier: "free", category: "Image Gen" },
  { id: "stabilityai/stable-diffusion-xl-base-1.0", name: "Stable Diffusion XL", provider: "Stability AI", tier: "free", category: "Image Gen" },
  { id: "stabilityai/stable-diffusion-2-1", name: "Stable Diffusion 2.1", provider: "Stability AI", tier: "free", category: "Image Gen" },
  { id: "runwayml/stable-diffusion-v1-5", name: "Stable Diffusion 1.5", provider: "RunwayML", tier: "free", category: "Image Gen" },
  { id: "CompVis/stable-diffusion-v1-4", name: "Stable Diffusion 1.4", provider: "CompVis", tier: "free", category: "Image Gen" },
];

const BYTEZ_IMAGE_LORA_MODELS: ModelInfo[] = [
  // Image LoRA / Fine-Tuned Models
  { id: "dot4kv4ep10-qwen-image-lora", name: "dot4kv4ep10-qwen-image-lora", provider: "Custom", tier: "free", category: "Image LoRA" },
  { id: "dot4kv4-qwen-image-lora", name: "dot4kv4-qwen-image-lora", provider: "Custom", tier: "free", category: "Image LoRA" },
  { id: "frankietrained-lora", name: "frankietrained-lora", provider: "Custom", tier: "free", category: "Image LoRA" },
  { id: "oxford-free-style-lora", name: "oxford-free-style-lora", provider: "Custom", tier: "free", category: "Image LoRA" },
  { id: "image_lora_image-005", name: "image_lora_image-005", provider: "Custom", tier: "free", category: "Image LoRA" },
  { id: "lora_fun", name: "lora_fun", provider: "Custom", tier: "free", category: "Image LoRA" },
  { id: "skinenhancer", name: "skinenhancer", provider: "Custom", tier: "free", category: "Image LoRA" },
  { id: "AWPortrait-Z", name: "AWPortrait-Z", provider: "Custom", tier: "free", category: "Image LoRA" },
];

const BYTEZ_DOMAIN_MODELS: ModelInfo[] = [
  // Domain-Specific Models
  { id: "amphibians-7886", name: "amphibians-7886", provider: "Domain", tier: "free", category: "Domain" },
  { id: "invertebrates-5709", name: "invertebrates-5709", provider: "Domain", tier: "free", category: "Domain" },
  { id: "invertebrates-1794", name: "invertebrates-1794", provider: "Domain", tier: "free", category: "Domain" },
  { id: "insects-6159", name: "insects-6159", provider: "Domain", tier: "free", category: "Domain" },
  { id: "cla1rec", name: "cla1rec", provider: "Domain", tier: "free", category: "Domain" },
];

const BYTEZ_AUDIO_MODELS: ModelInfo[] = [
  // Audio / Speech Models
  { id: "openai/whisper-large-v3", name: "Whisper Large v3", provider: "OpenAI", tier: "free", category: "Audio" },
  { id: "Kokoro-82M", name: "Kokoro-82M", provider: "Kokoro", tier: "free", category: "Audio" },
];

const ALL_BYTEZ_CHAT_MODELS = [...BYTEZ_LLM_MODELS, ...BYTEZ_VLM_MODELS];
const ALL_BYTEZ_IMAGE_MODELS = [...BYTEZ_IMAGE_GEN_MODELS, ...BYTEZ_IMAGE_LORA_MODELS];

// Pollinations.ai models (free, no API key needed)
const POLLINATIONS_MODELS: ModelInfo[] = [
  { id: "flux", name: "FLUX (Balanced)", provider: "Pollinations", tier: "free", category: "Image Gen" },
  { id: "flux-realism", name: "FLUX Realism (Photorealistic)", provider: "Pollinations", tier: "free", category: "Image Gen" },
  { id: "flux-anime", name: "FLUX Anime (Anime Style)", provider: "Pollinations", tier: "free", category: "Image Gen" },
  { id: "flux-3d", name: "FLUX 3D (3D Rendered)", provider: "Pollinations", tier: "free", category: "Image Gen" },
  { id: "turbo", name: "Turbo (Fastest)", provider: "Pollinations", tier: "free", category: "Image Gen" },
];

const PUTER_CHAT_MODELS: ModelInfo[] = [
  { id: "openrouter:meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 8B (via Puter)", provider: "Puter", tier: "free", category: "LLM" },
  { id: "openrouter:meta-llama/llama-3.1-405b-instruct", name: "Llama 3.1 405B (via Puter)", provider: "Puter", tier: "free", category: "LLM" },
  { id: "openrouter:anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (via Puter)", provider: "Puter", tier: "free", category: "LLM" },
  { id: "openrouter:google/gemini-pro-1.5", name: "Gemini Pro 1.5 (via Puter)", provider: "Puter", tier: "free", category: "LLM" },
  { id: "openrouter:openai/gpt-4o-mini", name: "GPT-4o Mini (via Puter)", provider: "Puter", tier: "free", category: "LLM" },
  { id: "openrouter:mistralai/mistral-7b-instruct", name: "Mistral 7B (via Puter)", provider: "Puter", tier: "free", category: "LLM" },
];

const GROQ_MODELS: ModelInfo[] = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", provider: "Meta", tier: "free", category: "LLM" },
  { id: "llama-3.1-70b-versatile", name: "Llama 3.1 70B Versatile", provider: "Meta", tier: "free", category: "LLM" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", provider: "Meta", tier: "free", category: "LLM" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: "Mistral AI", tier: "free", category: "LLM" },
  { id: "gemma2-9b-it", name: "Gemma 2 9B", provider: "Google", tier: "free", category: "LLM" },
  { id: "qwen-2.5-32b", name: "Qwen 2.5 32B", provider: "Alibaba", tier: "free", category: "LLM" },
];

const CEREBRAS_MODELS: ModelInfo[] = [
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", provider: "Meta", tier: "free", category: "LLM" },
  { id: "llama-3.1-70b", name: "Llama 3.1 70B", provider: "Meta", tier: "free", category: "LLM" },
  { id: "llama-3.1-8b", name: "Llama 3.1 8B", provider: "Meta", tier: "free", category: "LLM" },
];

interface CustomModel {
  id: string;
  name: string;
  category: string;
  provider?: string;
  tier?: string;
}

const AdminAISettings = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<AISettingsMap>({
    ai_provider: "openrouter",
    openrouter_api_key: "",
    openrouter_model: "meta-llama/llama-3.2-3b-instruct:free",
    openrouter_custom_models: "[]",
    groq_api_key: "",
    groq_model: "llama-3.3-70b-versatile",
    groq_custom_models: "[]",
    cerebras_api_key: "",
    cerebras_model: "llama-3.3-70b",
    cerebras_custom_models: "[]",
    bytez_api_key: "",
    bytez_chat_model: "Qwen/Qwen2.5-1.5B-Instruct",
    bytez_image_model: "black-forest-labs/FLUX.1-schnell",
    bytez_custom_models: "[]",
    pollinations_model: "flux",
    puter_chat_model: "openrouter:meta-llama/llama-3.1-8b-instruct",
    puter_custom_models: "[]",
    krea_api_key: "",
    krea_model: "flux",
    airforce_api_key: "",
    airforce_model: "plutogen-o1",
    custom_system_prompt: "",
  });

  const [newCustomModel, setNewCustomModel] = useState<CustomModel>({ id: "", name: "", category: "LLM" });
  const [customModelDialogOpen, setCustomModelDialogOpen] = useState(false);
  const [customModelProvider, setCustomModelProvider] = useState<"openrouter" | "bytez" | "puter" | "groq" | "cerebras">("bytez");

  const { data: aiSettings, isLoading } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_settings")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (aiSettings) {
      const settingsMap: AISettingsMap = {
        ai_provider: "openrouter",
        openrouter_api_key: "",
        openrouter_model: "meta-llama/llama-3.2-3b-instruct:free",
        openrouter_custom_models: "[]",
        groq_api_key: "",
        groq_model: "llama-3.3-70b-versatile",
        groq_custom_models: "[]",
        cerebras_api_key: "",
        cerebras_model: "llama-3.3-70b",
        cerebras_custom_models: "[]",
        bytez_api_key: "",
        bytez_chat_model: "Qwen/Qwen2.5-1.5B-Instruct",
        bytez_image_model: "black-forest-labs/FLUX.1-schnell",
        bytez_custom_models: "[]",
        pollinations_model: "flux",
        puter_chat_model: "openrouter:meta-llama/llama-3.1-8b-instruct",
        puter_custom_models: "[]",
        krea_api_key: "",
        krea_model: "flux",
        airforce_api_key: "",
        airforce_model: "plutogen-o1",
        custom_system_prompt: "",
      };

      if (Array.isArray(aiSettings)) {
        aiSettings.forEach((setting) => {
          if (setting.setting_key in settingsMap) {
            settingsMap[setting.setting_key as keyof AISettingsMap] = setting.setting_value || "";
          }
        });
      }
      setSettings(settingsMap);
    }
  }, [aiSettings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("ai_settings")
          .upsert(update, { onConflict: "setting_key" });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
      toast.success("AI settings saved successfully!");
    },
    onError: (error) => {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    },
  });

  const handleSave = () => {
    if (settings.ai_provider === "openrouter" && !settings.openrouter_api_key) {
      toast.error("Please enter your OpenRouter API key");
      return;
    }
    if (settings.ai_provider === "bytez" && !settings.bytez_api_key) {
      toast.error("Please enter your Bytez API key");
      return;
    }
    if (settings.ai_provider === "groq" && !settings.groq_api_key) {
      toast.error("Please enter your Groq API key");
      return;
    }
    if (settings.ai_provider === "cerebras" && !settings.cerebras_api_key) {
      toast.error("Please enter your Cerebras API key");
      return;
    }
    saveMutation.mutate();
  };

  const getOpenRouterCustomModels = (): CustomModel[] => {
    try {
      return JSON.parse(settings.openrouter_custom_models || "[]");
    } catch {
      return [];
    }
  };

  const getBytezCustomModels = (): CustomModel[] => {
    try {
      return JSON.parse(settings.bytez_custom_models || "[]");
    } catch {
      return [];
    }
  };

  const getPuterCustomModels = (): CustomModel[] => {
    try {
      return JSON.parse(settings.puter_custom_models || "[]");
    } catch {
      return [];
    }
  };

  const getGroqCustomModels = (): CustomModel[] => {
    try {
      return JSON.parse(settings.groq_custom_models || "[]");
    } catch {
      return [];
    }
  };

  const getCerebrasCustomModels = (): CustomModel[] => {
    try {
      return JSON.parse(settings.cerebras_custom_models || "[]");
    } catch {
      return [];
    }
  };

  const addCustomModel = () => {
    if (!newCustomModel.id.trim() || !newCustomModel.name.trim()) {
      toast.error("Please enter both model ID and name");
      return;
    }

    if (customModelProvider === "openrouter") {
      const current = getOpenRouterCustomModels();
      if (current.some(m => m.id === newCustomModel.id)) {
        toast.error("Model with this ID already exists");
        return;
      }
      const updated = [...current, newCustomModel];
      setSettings(s => ({ ...s, openrouter_custom_models: JSON.stringify(updated) }));
    } else if (customModelProvider === "bytez") {
      const current = getBytezCustomModels();
      if (current.some(m => m.id === newCustomModel.id)) {
        toast.error("Model with this ID already exists");
        return;
      }
      const updated = [...current, newCustomModel];
      setSettings(s => ({ ...s, bytez_custom_models: JSON.stringify(updated) }));
    } else if (customModelProvider === "groq") {
      const current = getGroqCustomModels();
      if (current.some(m => m.id === newCustomModel.id)) {
        toast.error("Model with this ID already exists");
        return;
      }
      const updated = [...current, newCustomModel];
      setSettings(s => ({ ...s, groq_custom_models: JSON.stringify(updated) }));
    } else if (customModelProvider === "cerebras") {
      const current = getCerebrasCustomModels();
      if (current.some(m => m.id === newCustomModel.id)) {
        toast.error("Model with this ID already exists");
        return;
      }
      const updated = [...current, newCustomModel];
      setSettings(s => ({ ...s, cerebras_custom_models: JSON.stringify(updated) }));
    } else {
      const current = getPuterCustomModels();
      if (current.some(m => m.id === newCustomModel.id)) {
        toast.error("Model with this ID already exists");
        return;
      }
      const updated = [...current, newCustomModel];
      setSettings(s => ({ ...s, puter_custom_models: JSON.stringify(updated) }));
    }

    setNewCustomModel({ id: "", name: "", category: "LLM" });
    setCustomModelDialogOpen(false);
    toast.success("Custom model added");
  };

  const removeCustomModel = (modelId: string, provider: "openrouter" | "bytez" | "puter" | "groq" | "cerebras") => {
    if (provider === "openrouter") {
      const current = getOpenRouterCustomModels();
      const updated = current.filter(m => m.id !== modelId);
      setSettings(s => ({ ...s, openrouter_custom_models: JSON.stringify(updated) }));
    } else if (provider === "bytez") {
      const current = getBytezCustomModels();
      const updated = current.filter(m => m.id !== modelId);
      setSettings(s => ({ ...s, bytez_custom_models: JSON.stringify(updated) }));
    } else if (provider === "groq") {
      const current = getGroqCustomModels();
      const updated = current.filter(m => m.id !== modelId);
      setSettings(s => ({ ...s, groq_custom_models: JSON.stringify(updated) }));
    } else if (provider === "cerebras") {
      const current = getCerebrasCustomModels();
      const updated = current.filter(m => m.id !== modelId);
      setSettings(s => ({ ...s, cerebras_custom_models: JSON.stringify(updated) }));
    } else {
      const current = getPuterCustomModels();
      const updated = current.filter(m => m.id !== modelId);
      setSettings(s => ({ ...s, puter_custom_models: JSON.stringify(updated) }));
    }
    toast.success("Custom model removed");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const openRouterCustomModels = getOpenRouterCustomModels();
  const bytezCustomModels = getBytezCustomModels();
  const puterCustomModels = getPuterCustomModels();
  const groqCustomModels = getGroqCustomModels();
  const cerebrasCustomModels = getCerebrasCustomModels();

  return (
    <AdminLayout>
      <div className="space-y-10 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight underline elevation-1 decoration-primary/30 decoration-4 underline-offset-8">
                Neural Nexus
              </h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                Calibrating artificial intelligence protocols and cognitive paths
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["ai-settings"] })}
              className="h-14 px-6 rounded-2xl border-white/10 hover:bg-white/5 font-black text-xs uppercase tracking-widest"
              title="Refresh Data"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              REFRESH
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.05] transition-all active:scale-95"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5 mr-3" />
              )}
              SYNC PROTOCOLS
            </Button>
          </div>
        </div>

        {/* AI Provider Matrix */}
        <div className="glass-card p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-black text-foreground uppercase tracking-widest">Provider Matrix</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: "openrouter", name: "OpenRouter", icon: Zap, badge: "Extensible", desc: "Access 100+ models via single API key." },
              { id: "groq", name: "Groq", icon: Zap, badge: "Ultra-Fast", desc: "World's fastest inference for Llama & Qwen." },
              { id: "cerebras", name: "Cerebras", icon: Sparkles, badge: "Inference", desc: "Specialized high-speed AI inference." },
              { id: "bytez", name: "Bytez", icon: Image, badge: "Multi-Modal", desc: "High-performance chat, image, & voice." },
              { id: "puter", name: "Puter.js", icon: Sparkles, badge: "Client-Side", desc: "Fastest response. Uses user's browser connection directly." }
            ].map((provider) => (
              <div
                key={provider.id}
                onClick={() => setSettings(s => ({ ...s, ai_provider: provider.id }))}
                className={`cursor-pointer glass-card p-6 rounded-[2rem] border transition-all duration-300 ${settings.ai_provider === provider.id
                  ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-2xl shadow-primary/20 scale-[1.02] ring-2 ring-primary/30"
                  : "border-white/5 hover:border-primary/20 hover:scale-[1.01]"
                  }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl transition-all duration-300 ${settings.ai_provider === provider.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110" : "bg-white/5 text-primary"}`}>
                    <provider.icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${settings.ai_provider === provider.id ? "bg-primary/20 text-primary border-primary/30 shadow-md" : "bg-white/5 text-muted-foreground border-white/10"}`}>{provider.badge}</span>
                </div>
                <h3 className={`text-base font-black mb-2 transition-colors ${settings.ai_provider === provider.id ? "text-primary" : "text-foreground"}`}>{provider.name}</h3>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed">{provider.desc}</p>
                {settings.ai_provider === provider.id && (
                  <div className="mt-4 pt-4 border-t border-primary/20">
                    <div className="flex items-center gap-2 text-primary">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">ACTIVE</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Tabs */}
        <Tabs defaultValue="config" className="space-y-8">
          <TabsList className="h-16 p-2 bg-white/5 border border-white/10 rounded-[2rem] glass">
            <TabsTrigger value="config" className="px-8 rounded-2xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              Configuration
            </TabsTrigger>
            <TabsTrigger value="directive" className="px-8 rounded-2xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              System Directives
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* OpenRouter Config */}
            {settings.ai_provider === "openrouter" && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-8">
                <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight">OpenRouter Integration</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Acquire secret cipher from <a href="https://openrouter.ai/keys" target="_blank" className="text-primary hover:underline font-black underline-offset-4">OPENROUTER.AI</a></p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Archive API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-or-v1-..."
                      value={settings.openrouter_api_key}
                      onChange={(e) => setSettings(s => ({ ...s, openrouter_api_key: e.target.value }))}
                      className="h-12 rounded-xl bg-white/5 border-white/10 font-bold focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cognitive Engine</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setCustomModelProvider("openrouter"); setCustomModelDialogOpen(true); }}
                        className="h-8 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:text-primary hover:bg-primary/10"
                      >
                        <Plus className="h-3 w-3 mr-2" /> ADD CORE
                      </Button>
                    </div>

                    <Select value={settings.openrouter_model} onValueChange={(v) => setSettings(s => ({ ...s, openrouter_model: v }))}>
                      <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-black text-xs uppercase tracking-widest focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card rounded-2xl border-white/10">
                        <ScrollArea className="h-[300px]">
                          <div className="p-2 space-y-1">
                            <p className="px-2 py-1 text-[8px] font-black text-primary uppercase tracking-[0.2em] opacity-60">Verified Cores</p>
                            {ALL_OPENROUTER_MODELS.map(model => (
                              <SelectItem key={model.id} value={model.id} className="rounded-xl focus:bg-primary/20">
                                <span className="font-bold">{model.name}</span>
                                <span className="ml-2 text-[8px] opacity-40 uppercase">{model.tier}</span>
                              </SelectItem>
                            ))}
                            {openRouterCustomModels.length > 0 && (
                              <>
                                <p className="px-2 py-1 mt-4 text-[8px] font-black text-accent uppercase tracking-[0.2em] opacity-60">Custom Cores</p>
                                {openRouterCustomModels.map(model => (
                                  <div key={model.id} className="flex items-center justify-between pr-2">
                                    <SelectItem value={model.id} className="flex-1 rounded-xl focus:bg-accent/20">
                                      <span className="font-bold">{model.name}</span>
                                    </SelectItem>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-red-500 hover:text-red-600"
                                      onClick={(e) => { e.stopPropagation(); removeCustomModel(model.id, "openrouter"); }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Groq Config */}
            {settings.ai_provider === "groq" && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-8">
                <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight">Groq Cloud Integration</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Get your API key from <a href="https://console.groq.com/keys" target="_blank" className="text-primary hover:underline font-black underline-offset-4">CONSOLE.GROQ.COM</a></p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Groq API Key</Label>
                    <Input
                      type="password"
                      placeholder="gsk_..."
                      value={settings.groq_api_key}
                      onChange={(e) => setSettings(s => ({ ...s, groq_api_key: e.target.value }))}
                      className="h-12 rounded-xl bg-white/5 border-white/10 font-bold focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Groq Model</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setCustomModelProvider("groq"); setCustomModelDialogOpen(true); }}
                        className="h-8 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:text-primary hover:bg-primary/10"
                      >
                        <Plus className="h-3 w-3 mr-2" /> ADD CORE
                      </Button>
                    </div>

                    <Select value={settings.groq_model} onValueChange={(v) => setSettings(s => ({ ...s, groq_model: v }))}>
                      <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-black text-xs uppercase tracking-widest focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card rounded-2xl border-white/10">
                        <ScrollArea className="h-[300px]">
                          <div className="p-2 space-y-1">
                            <p className="px-2 py-1 text-[8px] font-black text-primary uppercase tracking-[0.2em] opacity-60">Verified Cores</p>
                            {GROQ_MODELS.map(model => (
                              <SelectItem key={model.id} value={model.id} className="rounded-xl focus:bg-primary/20">
                                <span className="font-bold">{model.name}</span>
                              </SelectItem>
                            ))}
                            {groqCustomModels.length > 0 && (
                              <>
                                <p className="px-2 py-1 mt-4 text-[8px] font-black text-accent uppercase tracking-[0.2em] opacity-60">Custom Cores</p>
                                {groqCustomModels.map(model => (
                                  <div key={model.id} className="flex items-center justify-between pr-2">
                                    <SelectItem value={model.id} className="flex-1 rounded-xl focus:bg-accent/20">
                                      <span className="font-bold">{model.name}</span>
                                    </SelectItem>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-red-500 hover:text-red-600"
                                      onClick={(e) => { e.stopPropagation(); removeCustomModel(model.id, "groq"); }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Cerebras Config */}
            {settings.ai_provider === "cerebras" && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-8">
                <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight">Cerebras Cloud Integration</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Get your API key from <a href="https://cloud.cerebras.ai" target="_blank" className="text-primary hover:underline font-black underline-offset-4">CLOUD.CEREBRAS.AI</a></p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cerebras API Key</Label>
                    <Input
                      type="password"
                      placeholder="csk_..."
                      value={settings.cerebras_api_key}
                      onChange={(e) => setSettings(s => ({ ...s, cerebras_api_key: e.target.value }))}
                      className="h-12 rounded-xl bg-white/5 border-white/10 font-bold focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cerebras Model</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setCustomModelProvider("cerebras"); setCustomModelDialogOpen(true); }}
                        className="h-8 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:text-primary hover:bg-primary/10"
                      >
                        <Plus className="h-3 w-3 mr-2" /> ADD CORE
                      </Button>
                    </div>

                    <Select value={settings.cerebras_model} onValueChange={(v) => setSettings(s => ({ ...s, cerebras_model: v }))}>
                      <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-black text-xs uppercase tracking-widest focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card rounded-2xl border-white/10">
                        <ScrollArea className="h-[300px]">
                          <div className="p-2 space-y-1">
                            <p className="px-2 py-1 text-[8px] font-black text-primary uppercase tracking-[0.2em] opacity-60">Verified Cores</p>
                            {CEREBRAS_MODELS.map(model => (
                              <SelectItem key={model.id} value={model.id} className="rounded-xl focus:bg-primary/20">
                                <span className="font-bold">{model.name}</span>
                              </SelectItem>
                            ))}
                            {cerebrasCustomModels.length > 0 && (
                              <>
                                <p className="px-2 py-1 mt-4 text-[8px] font-black text-accent uppercase tracking-[0.2em] opacity-60">Custom Cores</p>
                                {cerebrasCustomModels.map(model => (
                                  <div key={model.id} className="flex items-center justify-between pr-2">
                                    <SelectItem value={model.id} className="flex-1 rounded-xl focus:bg-accent/20">
                                      <span className="font-bold">{model.name}</span>
                                    </SelectItem>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-red-500 hover:text-red-600"
                                      onClick={(e) => { e.stopPropagation(); removeCustomModel(model.id, "cerebras"); }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Bytez Config */}
            {settings.ai_provider === "bytez" && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-10">
                <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight">Bytez Neural Engine</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Configure unified multi-modal access via <a href="https://bytez.com" target="_blank" className="text-primary hover:underline font-black">BYTEZ.COM</a></p>
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Secret Access Key</Label>
                      <Input
                        type="password"
                        placeholder="Bytez API Key..."
                        value={settings.bytez_api_key}
                        onChange={(e) => setSettings(s => ({ ...s, bytez_api_key: e.target.value }))}
                        className="h-12 rounded-xl bg-white/5 border-white/10 font-bold"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Linguistic Core (Chat)</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setCustomModelProvider("bytez"); setCustomModelDialogOpen(true); }}
                          className="h-8 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:text-primary hover:bg-primary/10"
                        >
                          <Plus className="h-3 w-3 mr-2" /> ADD CORE
                        </Button>
                      </div>
                      <Select value={settings.bytez_chat_model} onValueChange={(v) => setSettings(s => ({ ...s, bytez_chat_model: v }))}>
                        <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 font-bold text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-card">
                          <ScrollArea className="h-64">
                            {ALL_BYTEZ_CHAT_MODELS.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            {bytezCustomModels.filter(m => m.category === "LLM").map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name} (Custom)</SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Diffusion Interface (Images)</Label>
                      <Select value={settings.bytez_image_model} onValueChange={(v) => setSettings(s => ({ ...s, bytez_image_model: v }))}>
                        <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 font-bold text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-card">
                          <ScrollArea className="h-64">
                            {ALL_BYTEZ_IMAGE_MODELS.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            {bytezCustomModels.filter(m => m.category === "Image Gen").map(m => (
                              <SelectItem key={m.id} value={m.id}>{m.name} (Custom)</SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-3 mb-2 text-amber-500">
                        <Zap className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deployment Note</span>
                      </div>
                      <p className="text-[10px] font-medium text-muted-foreground italic leading-relaxed">
                        Bytez models are served on-demand. Free plans have a size limit (usually models under 4GB).
                        On first use, a model may take 15-30 seconds to "wake up".
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-3 mb-2 text-primary">
                        <Mic className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Voice Synthesis</span>
                      </div>
                      <p className="text-[10px] font-medium text-muted-foreground italic">Whisper Large v3 and Kokoro-82M are deployed automatically for audio processing.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Puter Config */}
            {settings.ai_provider === "puter" && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-8">
                <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight">Puter.js Integration</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                      Direct client-side AI processing via <a href="https://puter.com" target="_blank" className="text-primary hover:underline font-black">PUTER.COM</a>
                    </p>
                  </div>
                  <Badge className="ml-auto bg-green-500/10 text-green-500 border-green-500/20 font-black uppercase tracking-widest">
                    FASTEST
                  </Badge>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Zap className="h-5 w-5 text-primary" />
                      <span className="text-sm font-black text-foreground uppercase tracking-widest">Zero Latency Mode</span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                      Puter.js runs directly in the user's browser, bypassing our server infrastructure.
                      This results in significantly faster response times and streaming.
                      No API key is required as it uses free tiers of OpenRouter models.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Default Chat Model
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setCustomModelProvider("puter"); setCustomModelDialogOpen(true); }}
                        className="h-8 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:text-primary hover:bg-primary/10"
                      >
                        <Plus className="h-3 w-3 mr-2" /> ADD CORE
                      </Button>
                    </div>
                    <Select value={settings.puter_chat_model} onValueChange={(v) => setSettings(s => ({ ...s, puter_chat_model: v }))}>
                      <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-black text-xs uppercase tracking-widest focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card rounded-2xl border-white/10">
                        <ScrollArea className="h-[250px]">
                          <div className="p-2 space-y-1">
                            {PUTER_CHAT_MODELS.map(model => (
                              <SelectItem key={model.id} value={model.id} className="rounded-xl focus:bg-primary/20">
                                <div className="flex items-center justify-between w-full gap-2">
                                  <span className="font-bold">{model.name}</span>
                                  <Badge variant="outline" className="text-[8px] opacity-60">FREE</Badge>
                                </div>
                              </SelectItem>
                            ))}
                            {puterCustomModels.length > 0 && (
                              <>
                                <p className="px-2 py-1 mt-4 text-[8px] font-black text-accent uppercase tracking-[0.2em] opacity-60">Custom Cores</p>
                                {puterCustomModels.map(model => (
                                  <div key={model.id} className="flex items-center justify-between pr-2">
                                    <SelectItem value={model.id} className="flex-1 rounded-xl focus:bg-accent/20">
                                      <span className="font-bold">{model.name}</span>
                                    </SelectItem>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-red-500 hover:text-red-600"
                                      onClick={(e) => { e.stopPropagation(); removeCustomModel(model.id, "puter"); }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Pollinations Free Image Generation Config */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-8">
              <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight">Pollinations Image Engine</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                    Backup image provider • Free unlimited generation
                  </p>
                </div>
                <Badge className="ml-auto bg-green-500/10 text-green-500 border-green-500/20 font-black uppercase tracking-widest">
                  100% FREE
                </Badge>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="text-sm font-black text-foreground uppercase tracking-widest">Backup Provider</span>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    Pollinations.ai is used as a backup when Hugging Face or other primary providers are unavailable.
                    It generates high-quality images instantly with no rate limits or API keys required.
                  </p>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Default Image Model
                  </Label>
                  <Select value={settings.pollinations_model} onValueChange={(v) => setSettings(s => ({ ...s, pollinations_model: v }))}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-black text-xs uppercase tracking-widest focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card rounded-2xl border-white/10">
                      <ScrollArea className="h-[250px]">
                        <div className="p-2 space-y-1">
                          {POLLINATIONS_MODELS.map(model => (
                            <SelectItem key={model.id} value={model.id} className="rounded-xl focus:bg-primary/20">
                              <div className="flex items-center justify-between w-full">
                                <span className="font-bold">{model.name}</span>
                                <Badge variant="outline" className="ml-2 text-[8px] opacity-60">FREE</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  <p className="text-[9px] font-medium text-muted-foreground italic ml-1">
                    This model is used as a backup when Hugging Face or other primary providers are unavailable.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  {[
                    { label: "Speed", value: "Instant", icon: Zap },
                    { label: "Quality", value: "High", icon: Sparkles },
                    { label: "Rate Limit", value: "None", icon: Image },
                    { label: "Cost", value: "$0", icon: Bot }
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <stat.icon className="w-3 h-3 text-primary" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                      </div>
                      <p className="text-sm font-black text-foreground">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* API Airforce Primary Image Generation Config */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-8">
              <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight">API Airforce (Primary)</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                    Primary image generation motor • Fast & Reliable
                  </p>
                </div>
                <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest">
                  PRIMARY
                </Badge>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Airforce API Key</Label>
                  <Input
                    type="password"
                    placeholder="sk-air-..."
                    value={settings.airforce_api_key}
                    onChange={(e) => setSettings(s => ({ ...s, airforce_api_key: e.target.value }))}
                    className="h-12 rounded-xl bg-white/5 border-white/10 font-bold focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Generation Model
                  </Label>
                  <Select value={settings.airforce_model} onValueChange={(v) => setSettings(s => ({ ...s, airforce_model: v }))}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-black text-xs uppercase tracking-widest focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card rounded-2xl border-white/10">
                      <div className="p-2 space-y-1">
                        {["plutogen-o1", "flux", "stable-diffusion-xl"].map(m => (
                          <SelectItem key={m} value={m} className="rounded-xl focus:bg-primary/20">
                            <span className="font-bold uppercase">{m}</span>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>

            {/* Krea.ai Premium Image Generation Config */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-8">
              <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight">Krea.ai (Secondary)</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                    Secondary image generation • Get API key from <a href="https://www.krea.ai/api" target="_blank" className="text-primary hover:underline font-black">KREA.AI</a>
                  </p>
                </div>
                <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest">
                  SECONDARY
                </Badge>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Krea API Key</Label>
                  <Input
                    type="password"
                    placeholder="krea_..."
                    value={settings.krea_api_key}
                    onChange={(e) => setSettings(s => ({ ...s, krea_api_key: e.target.value }))}
                    className="h-12 rounded-xl bg-white/5 border-white/10 font-bold focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Quality Preset
                  </Label>
                  <Select value={settings.krea_model} onValueChange={(v) => setSettings(s => ({ ...s, krea_model: v }))}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-black text-xs uppercase tracking-widest focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card rounded-2xl border-white/10">
                      <div className="p-2 space-y-1">
                        {["flux", "sdxl", "v3"].map(m => (
                          <SelectItem key={m} value={m} className="rounded-xl focus:bg-primary/20">
                            <span className="font-bold uppercase">{m}</span>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="directive" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="glass-card p-10 rounded-[3rem] border border-white/5 space-y-8">
              <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-primary">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight">Personality Matrix</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Calibrating global AI response characteristics</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">System Core Prompt</Label>
                <Textarea
                  value={settings.custom_system_prompt}
                  onChange={(e) => setSettings(s => ({ ...s, custom_system_prompt: e.target.value }))}
                  placeholder="Inject custom cognitive logic here... (Leave empty for default Study Assistant personality)"
                  className="min-h-[300px] rounded-[2rem] bg-white/2 border-white/10 p-8 font-medium leading-relaxed focus:ring-primary/20 resize-none glass"
                />
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center pt-2 italic">Changes to system directives apply to all active sessions upon next initialization.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Global Stats/Tips Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/5">
            <h4 className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest mb-4">
              <Eye className="w-4 h-4" /> Cognitive Insight
            </h4>
            <ul className="space-y-3">
              {[
                "Groq delivers ultra-fast Llama and Qwen inference.",
                "OpenRouter allows deep customization of LLM nodes.",
                "Bytez provides first-class support for visual synthesis.",
                "Puter.js offers the fastest chat experience via direct connection."
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-xs font-medium text-muted-foreground leading-snug">
                  <span className="text-primary">•</span> {tip}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 bg-primary/[0.02]">
            <h4 className="flex items-center gap-2 text-xs font-black text-foreground uppercase tracking-widest mb-4">
              <ExternalLink className="w-4 h-4 text-primary" /> Rapid Access
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Docs", url: "#" },
                { label: "API Status", url: "#" },
                { label: "Rate Limits", url: "#" },
                { label: "Model Index", url: "#" }
              ].map((link, i) => (
                <a key={i} href={link.url} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:border-primary/30 transition-all">{link.label}</a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shared Custom Model Dialog */}
      <Dialog open={customModelDialogOpen} onOpenChange={setCustomModelDialogOpen}>
        <DialogContent className="glass-card border-white/10 rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">
              Add Custom {
                customModelProvider === "openrouter" ? "OpenRouter" :
                  customModelProvider === "puter" ? "Puter.js" :
                    customModelProvider === "groq" ? "Groq" :
                      customModelProvider === "cerebras" ? "Cerebras" : "Bytez"
              } Model
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="model-id" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Model ID
              </Label>
              <Input
                id="model-id"
                placeholder={customModelProvider === "openrouter" ? "e.g., anthropic/claude-3-opus" : "e.g., custom-model-name"}
                value={newCustomModel.id}
                onChange={(e) => setNewCustomModel(m => ({ ...m, id: e.target.value }))}
                className="h-11 rounded-xl bg-white/5 border-white/10 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Display Name
              </Label>
              <Input
                id="model-name"
                placeholder="e.g., Claude 3 Opus"
                value={newCustomModel.name}
                onChange={(e) => setNewCustomModel(m => ({ ...m, name: e.target.value }))}
                className="h-11 rounded-xl bg-white/5 border-white/10 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-category" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Category
              </Label>
              <Select
                value={newCustomModel.category}
                onValueChange={(v) => setNewCustomModel(m => ({ ...m, category: v }))}
              >
                <SelectTrigger className="h-11 rounded-xl bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card rounded-xl border-white/10">
                  <SelectItem value="LLM">LLM (Chat)</SelectItem>
                  <SelectItem value="VLM">VLM (Vision)</SelectItem>
                  <SelectItem value="Image Gen">Image Generation</SelectItem>
                  <SelectItem value="Audio">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" className="rounded-xl">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={addCustomModel}
              className="rounded-xl bg-primary text-primary-foreground font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAISettings;
