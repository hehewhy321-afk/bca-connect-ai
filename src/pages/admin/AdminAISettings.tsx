import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Bot, Key, Sparkles, ExternalLink, Image, Zap, Plus, X, Eye, Mic, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AISettingsMap {
  ai_provider: string;
  openrouter_api_key: string;
  openrouter_model: string;
  openrouter_custom_models: string;
  bytez_api_key: string;
  bytez_chat_model: string;
  bytez_image_model: string;
  bytez_custom_models: string;
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
  { id: "Qwen/Qwen3-4B", name: "Qwen3 4B", provider: "Qwen", tier: "free", category: "LLM" },
  { id: "Qwen/Qwen3-8B", name: "Qwen3 8B", provider: "Qwen", tier: "free", category: "LLM" },
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
    ai_provider: "lovable",
    openrouter_api_key: "",
    openrouter_model: "meta-llama/llama-3.2-3b-instruct:free",
    openrouter_custom_models: "[]",
    bytez_api_key: "",
    bytez_chat_model: "Qwen/Qwen3-4B",
    bytez_image_model: "dreamlike-art/dreamlike-photoreal-2.0",
    bytez_custom_models: "[]",
    custom_system_prompt: "",
  });

  const [newCustomModel, setNewCustomModel] = useState<CustomModel>({ id: "", name: "", category: "LLM" });
  const [customModelDialogOpen, setCustomModelDialogOpen] = useState(false);
  const [customModelProvider, setCustomModelProvider] = useState<"openrouter" | "bytez">("bytez");

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
        ai_provider: "lovable",
        openrouter_api_key: "",
        openrouter_model: "meta-llama/llama-3.2-3b-instruct:free",
        openrouter_custom_models: "[]",
        bytez_api_key: "",
        bytez_chat_model: "Qwen/Qwen3-4B",
        bytez_image_model: "dreamlike-art/dreamlike-photoreal-2.0",
        bytez_custom_models: "[]",
        custom_system_prompt: "",
      };
      
      aiSettings.forEach((setting) => {
        if (setting.setting_key in settingsMap) {
          settingsMap[setting.setting_key as keyof AISettingsMap] = setting.setting_value || "";
        }
      });
      
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
    } else {
      const current = getBytezCustomModels();
      if (current.some(m => m.id === newCustomModel.id)) {
        toast.error("Model with this ID already exists");
        return;
      }
      const updated = [...current, newCustomModel];
      setSettings(s => ({ ...s, bytez_custom_models: JSON.stringify(updated) }));
    }

    setNewCustomModel({ id: "", name: "", category: "LLM" });
    setCustomModelDialogOpen(false);
    toast.success("Custom model added");
  };

  const removeCustomModel = (modelId: string, provider: "openrouter" | "bytez") => {
    if (provider === "openrouter") {
      const current = getOpenRouterCustomModels();
      const updated = current.filter(m => m.id !== modelId);
      setSettings(s => ({ ...s, openrouter_custom_models: JSON.stringify(updated) }));
    } else {
      const current = getBytezCustomModels();
      const updated = current.filter(m => m.id !== modelId);
      setSettings(s => ({ ...s, bytez_custom_models: JSON.stringify(updated) }));
    }
    toast.success("Custom model removed");
  };

  const selectedModel = ALL_OPENROUTER_MODELS.find(m => m.id === settings.openrouter_model) ||
    getOpenRouterCustomModels().find(m => m.id === settings.openrouter_model);
  
  const selectedBytezChatModel = ALL_BYTEZ_CHAT_MODELS.find(m => m.id === settings.bytez_chat_model) ||
    getBytezCustomModels().find(m => m.id === settings.bytez_chat_model);
  
  const selectedBytezImageModel = ALL_BYTEZ_IMAGE_MODELS.find(m => m.id === settings.bytez_image_model) ||
    getBytezCustomModels().find(m => m.id === settings.bytez_image_model);

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8" />
            AI Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your AI assistant provider and model settings
          </p>
        </div>

        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Provider
            </CardTitle>
            <CardDescription>
              Choose between Lovable AI, OpenRouter, or Bytez for AI capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${
                  settings.ai_provider === "lovable" 
                    ? "ring-2 ring-primary bg-primary/5" 
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setSettings(s => ({ ...s, ai_provider: "lovable" }))}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    Lovable AI
                    <Badge variant="secondary">Built-in</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Uses Gemini 2.5 Flash. No API key required. Simple and reliable.
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  settings.ai_provider === "openrouter" 
                    ? "ring-2 ring-primary bg-primary/5" 
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setSettings(s => ({ ...s, ai_provider: "openrouter" }))}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    OpenRouter
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Free Models
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Access 100+ models including free options. Bring your own API key.
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  settings.ai_provider === "bytez" 
                    ? "ring-2 ring-primary bg-primary/5" 
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setSettings(s => ({ ...s, ai_provider: "bytez" }))}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    Bytez
                    <Badge variant="outline" className="text-purple-600 border-purple-600">
                      <Image className="h-3 w-3 mr-1" />
                      Multi-Modal
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Chat + Image + Voice. Single API for all models.
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* OpenRouter Configuration */}
        {settings.ai_provider === "openrouter" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                OpenRouter Configuration
              </CardTitle>
              <CardDescription>
                Get your free API key from{" "}
                <a 
                  href="https://openrouter.ai/keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  openrouter.ai/keys
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={settings.openrouter_api_key}
                  onChange={(e) => setSettings(s => ({ ...s, openrouter_api_key: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Your API key is stored securely and only accessed by the server
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Model Selection</Label>
                  <Dialog open={customModelDialogOpen && customModelProvider === "openrouter"} onOpenChange={(open) => {
                    setCustomModelDialogOpen(open);
                    if (open) setCustomModelProvider("openrouter");
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Custom Model
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Custom OpenRouter Model</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Model ID</Label>
                          <Input
                            placeholder="e.g., openai/gpt-4-turbo"
                            value={newCustomModel.id}
                            onChange={(e) => setNewCustomModel(s => ({ ...s, id: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Display Name</Label>
                          <Input
                            placeholder="e.g., GPT-4 Turbo"
                            value={newCustomModel.name}
                            onChange={(e) => setNewCustomModel(s => ({ ...s, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select value={newCustomModel.category} onValueChange={(v) => setNewCustomModel(s => ({ ...s, category: v }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LLM">LLM (Text)</SelectItem>
                              <SelectItem value="VLM">VLM (Vision)</SelectItem>
                              <SelectItem value="Image Gen">Image Generation</SelectItem>
                              <SelectItem value="Audio">Audio/Speech</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={addCustomModel}>Add Model</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select
                  value={settings.openrouter_model}
                  onValueChange={(value) => setSettings(s => ({ ...s, openrouter_model: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[300px]">
                      {openRouterCustomModels.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-sm font-semibold text-purple-600">
                            ⭐ Custom Models
                          </div>
                          {openRouterCustomModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              <div className="flex items-center gap-2">
                                <span>{model.name}</span>
                                <Badge variant="outline" className="text-xs">{model.category}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                      <div className="px-2 py-1.5 text-sm font-semibold text-green-600">
                        🆓 Free Models
                      </div>
                      {FREE_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {model.provider}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-sm font-semibold text-amber-600 border-t mt-2 pt-2">
                        💰 Paid Models
                      </div>
                      {PAID_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {model.provider}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
                {selectedModel && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={selectedModel.tier === "free" ? "secondary" : "outline"}>
                      {selectedModel.tier === "free" ? "🆓 Free" : "💰 Paid"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedModel.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Custom Models List */}
              {openRouterCustomModels.length > 0 && (
                <div className="space-y-2">
                  <Label>Your Custom Models</Label>
                  <div className="flex flex-wrap gap-2">
                    {openRouterCustomModels.map((model) => (
                      <Badge key={model.id} variant="secondary" className="flex items-center gap-1">
                        {model.name}
                        <button
                          onClick={() => removeCustomModel(model.id, "openrouter")}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bytez Configuration */}
        {settings.ai_provider === "bytez" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Bytez Configuration
              </CardTitle>
              <CardDescription>
                Get your API key from{" "}
                <a 
                  href="https://bytez.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  bytez.com
                  <ExternalLink className="h-3 w-3" />
                </a>
                {" "}• Browse models at{" "}
                <a 
                  href="https://bytez.com/model" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  bytez.com/model
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bytez-api-key">API Key</Label>
                <Input
                  id="bytez-api-key"
                  type="password"
                  placeholder="Your Bytez API key..."
                  value={settings.bytez_api_key}
                  onChange={(e) => setSettings(s => ({ ...s, bytez_api_key: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Single API key for all models including chat, image, and voice
                </p>
              </div>

              <Tabs defaultValue="chat" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="chat" className="flex items-center gap-1">
                    <Bot className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="image" className="flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    Custom
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Chat Model</Label>
                    <Select
                      value={settings.bytez_chat_model}
                      onValueChange={(value) => setSettings(s => ({ ...s, bytez_chat_model: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a chat model" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[300px]">
                          {bytezCustomModels.filter(m => m.category === "LLM" || m.category === "VLM").length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-sm font-semibold text-purple-600">
                                ⭐ Custom Models
                              </div>
                              {bytezCustomModels.filter(m => m.category === "LLM" || m.category === "VLM").map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{model.name}</span>
                                    <Badge variant="outline" className="text-xs">{model.category}</Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                          <div className="px-2 py-1.5 text-sm font-semibold text-blue-600">
                            💬 Text / LLM Models
                          </div>
                          {BYTEZ_LLM_MODELS.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              <div className="flex items-center gap-2">
                                <span>{model.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {model.provider}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                          <div className="px-2 py-1.5 text-sm font-semibold text-purple-600 border-t mt-2 pt-2">
                            👁️ Vision-Language Models
                          </div>
                          {BYTEZ_VLM_MODELS.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              <div className="flex items-center gap-2">
                                <span>{model.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {model.provider}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    {selectedBytezChatModel && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{selectedBytezChatModel.category}</Badge>
                        <span className="text-sm text-muted-foreground">
                          by {selectedBytezChatModel.provider}
                        </span>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Image Generation Model</Label>
                    <Select
                      value={settings.bytez_image_model}
                      onValueChange={(value) => setSettings(s => ({ ...s, bytez_image_model: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an image model" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[300px]">
                          {bytezCustomModels.filter(m => m.category === "Image Gen" || m.category === "Image LoRA").length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-sm font-semibold text-purple-600">
                                ⭐ Custom Models
                              </div>
                              {bytezCustomModels.filter(m => m.category === "Image Gen" || m.category === "Image LoRA").map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{model.name}</span>
                                    <Badge variant="outline" className="text-xs">{model.category}</Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                          <div className="px-2 py-1.5 text-sm font-semibold text-pink-600">
                            🎨 Image Generation Models
                          </div>
                          {BYTEZ_IMAGE_GEN_MODELS.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              <div className="flex items-center gap-2">
                                <span>{model.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {model.provider}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                          <div className="px-2 py-1.5 text-sm font-semibold text-orange-600 border-t mt-2 pt-2">
                            ✨ Image LoRA / Fine-Tuned
                          </div>
                          {BYTEZ_IMAGE_LORA_MODELS.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              <div className="flex items-center gap-2">
                                <span>{model.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {model.provider}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    {selectedBytezImageModel && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">🎨 {selectedBytezImageModel.category}</Badge>
                        <span className="text-sm text-muted-foreground">
                          by {selectedBytezImageModel.provider}
                        </span>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Custom Bytez Models</Label>
                      <Dialog open={customModelDialogOpen && customModelProvider === "bytez"} onOpenChange={(open) => {
                        setCustomModelDialogOpen(open);
                        if (open) setCustomModelProvider("bytez");
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Custom Model
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Custom Bytez Model</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Model ID (from bytez.com/model)</Label>
                              <Input
                                placeholder="e.g., organization/model-name"
                                value={newCustomModel.id}
                                onChange={(e) => setNewCustomModel(s => ({ ...s, id: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Display Name</Label>
                              <Input
                                placeholder="e.g., My Custom Model"
                                value={newCustomModel.name}
                                onChange={(e) => setNewCustomModel(s => ({ ...s, name: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Category</Label>
                              <Select value={newCustomModel.category} onValueChange={(v) => setNewCustomModel(s => ({ ...s, category: v }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="LLM">LLM (Text)</SelectItem>
                                  <SelectItem value="VLM">VLM (Vision-Language)</SelectItem>
                                  <SelectItem value="Image Gen">Image Generation</SelectItem>
                                  <SelectItem value="Image LoRA">Image LoRA</SelectItem>
                                  <SelectItem value="Audio">Audio/Speech</SelectItem>
                                  <SelectItem value="Domain">Domain-Specific</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={addCustomModel}>Add Model</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {bytezCustomModels.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No custom models added yet</p>
                        <p className="text-sm">Add models from bytez.com/model</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {bytezCustomModels.map((model) => (
                          <div key={model.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                            <div>
                              <p className="font-medium">{model.name}</p>
                              <p className="text-sm text-muted-foreground">{model.id}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{model.category}</Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCustomModel(model.id, "bytez")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Bytez Features
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Bot className="h-4 w-4" /> Chat with AI models for study assistance
                  </li>
                  <li className="flex items-center gap-2">
                    <Image className="h-4 w-4" /> Generate images from text prompts
                  </li>
                  <li className="flex items-center gap-2">
                    <Mic className="h-4 w-4" /> Speech-to-text (voice input)
                  </li>
                  <li className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" /> Text-to-speech (voice output)
                  </li>
                  <li className="flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Vision-Language models for image understanding
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom System Prompt */}
        <Card>
          <CardHeader>
            <CardTitle>Custom System Prompt (Optional)</CardTitle>
            <CardDescription>
              Override the default AI assistant personality and instructions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Leave empty to use the default BCA AI Study Assistant prompt..."
              value={settings.custom_system_prompt}
              onChange={(e) => setSettings(s => ({ ...s, custom_system_prompt: e.target.value }))}
              rows={6}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending}
            size="lg"
          >
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">💡 Tips for Using AI Models</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Lovable AI</strong> - Best for quick setup, no API key needed</p>
            <p>• <strong>OpenRouter</strong> - Great for accessing many free models like Llama, Gemma, Mistral</p>
            <p>• <strong>Bytez</strong> - Best for multi-modal (chat + image + voice) with single API</p>
            <p>• Add custom models from bytez.com/model or OpenRouter's model library</p>
            <p>• Free models have rate limits but are perfect for learning and development</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAISettings;
