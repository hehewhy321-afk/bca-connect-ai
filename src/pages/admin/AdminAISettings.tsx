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
import { Loader2, Bot, Key, Sparkles, ExternalLink, Image, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AISettingsMap {
  ai_provider: string;
  openrouter_api_key: string;
  openrouter_model: string;
  bytez_api_key: string;
  bytez_chat_model: string;
  bytez_image_model: string;
  custom_system_prompt: string;
}

// Free and low-cost models available on OpenRouter
const FREE_MODELS = [
  { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Llama 3.2 3B Instruct", provider: "Meta", tier: "free" },
  { id: "meta-llama/llama-3.2-1b-instruct:free", name: "Llama 3.2 1B Instruct", provider: "Meta", tier: "free" },
  { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B Instruct", provider: "Meta", tier: "free" },
  { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B", provider: "Google", tier: "free" },
  { id: "microsoft/phi-3-mini-128k-instruct:free", name: "Phi-3 Mini 128K", provider: "Microsoft", tier: "free" },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B Instruct", provider: "Mistral AI", tier: "free" },
  { id: "openchat/openchat-7b:free", name: "OpenChat 7B", provider: "OpenChat", tier: "free" },
  { id: "huggingfaceh4/zephyr-7b-beta:free", name: "Zephyr 7B Beta", provider: "HuggingFace", tier: "free" },
  { id: "nousresearch/nous-capybara-7b:free", name: "Nous Capybara 7B", provider: "Nous Research", tier: "free" },
  { id: "qwen/qwen-2-7b-instruct:free", name: "Qwen 2 7B Instruct", provider: "Alibaba", tier: "free" },
];

const PAID_MODELS = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", tier: "paid" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI", tier: "paid" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", tier: "paid" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", provider: "Anthropic", tier: "paid" },
  { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5", provider: "Google", tier: "paid" },
  { id: "google/gemini-flash-1.5", name: "Gemini Flash 1.5", provider: "Google", tier: "paid" },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B", provider: "Meta", tier: "paid" },
  { id: "mistralai/mixtral-8x7b-instruct", name: "Mixtral 8x7B", provider: "Mistral AI", tier: "paid" },
];

const ALL_MODELS = [...FREE_MODELS, ...PAID_MODELS];

// Bytez models
const BYTEZ_CHAT_MODELS = [
  { id: "Qwen/Qwen3-4B", name: "Qwen3 4B", provider: "Qwen", tier: "free" },
  { id: "Qwen/Qwen3-8B", name: "Qwen3 8B", provider: "Qwen", tier: "free" },
  { id: "Qwen/Qwen3-14B", name: "Qwen3 14B", provider: "Qwen", tier: "free" },
  { id: "meta-llama/Llama-3.2-3B-Instruct", name: "Llama 3.2 3B", provider: "Meta", tier: "free" },
  { id: "meta-llama/Llama-3.1-8B-Instruct", name: "Llama 3.1 8B", provider: "Meta", tier: "free" },
  { id: "mistralai/Mistral-7B-Instruct-v0.3", name: "Mistral 7B", provider: "Mistral", tier: "free" },
  { id: "microsoft/Phi-3-mini-4k-instruct", name: "Phi-3 Mini", provider: "Microsoft", tier: "free" },
  { id: "google/gemma-2-9b-it", name: "Gemma 2 9B", provider: "Google", tier: "free" },
  { id: "openai/gpt-4", name: "GPT-4 (via Bytez)", provider: "OpenAI", tier: "paid" },
  { id: "anthropic/claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "Anthropic", tier: "paid" },
];

const BYTEZ_IMAGE_MODELS = [
  { id: "dreamlike-art/dreamlike-photoreal-2.0", name: "Dreamlike Photoreal 2.0", provider: "Dreamlike", tier: "free" },
  { id: "stabilityai/stable-diffusion-xl-base-1.0", name: "Stable Diffusion XL", provider: "Stability AI", tier: "free" },
  { id: "runwayml/stable-diffusion-v1-5", name: "Stable Diffusion 1.5", provider: "RunwayML", tier: "free" },
  { id: "CompVis/stable-diffusion-v1-4", name: "Stable Diffusion 1.4", provider: "CompVis", tier: "free" },
];

const AdminAISettings = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<AISettingsMap>({
    ai_provider: "lovable",
    openrouter_api_key: "",
    openrouter_model: "meta-llama/llama-3.2-3b-instruct:free",
    bytez_api_key: "",
    bytez_chat_model: "Qwen/Qwen3-4B",
    bytez_image_model: "dreamlike-art/dreamlike-photoreal-2.0",
    custom_system_prompt: "",
  });

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
        bytez_api_key: "",
        bytez_chat_model: "Qwen/Qwen3-4B",
        bytez_image_model: "dreamlike-art/dreamlike-photoreal-2.0",
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

  const selectedModel = ALL_MODELS.find(m => m.id === settings.openrouter_model);
  const selectedBytezChatModel = BYTEZ_CHAT_MODELS.find(m => m.id === settings.bytez_chat_model);
  const selectedBytezImageModel = BYTEZ_IMAGE_MODELS.find(m => m.id === settings.bytez_image_model);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

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
                    Chat + Image generation. Single API for all models.
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
                <Label>Model Selection</Label>
                <Select
                  value={settings.openrouter_model}
                  onValueChange={(value) => setSettings(s => ({ ...s, openrouter_model: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
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
                  </SelectContent>
                </Select>
                {selectedModel && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={selectedModel.tier === "free" ? "secondary" : "outline"}>
                      {selectedModel.tier === "free" ? "🆓 Free" : "💰 Paid"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      by {selectedModel.provider}
                    </span>
                  </div>
                )}
              </div>
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
                  Single API key for all models including chat and image generation
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    Chat Model
                  </Label>
                  <Select
                    value={settings.bytez_chat_model}
                    onValueChange={(value) => setSettings(s => ({ ...s, bytez_chat_model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a chat model" />
                    </SelectTrigger>
                    <SelectContent>
                      {BYTEZ_CHAT_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {model.provider}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBytezChatModel && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={selectedBytezChatModel.tier === "free" ? "secondary" : "outline"}>
                        {selectedBytezChatModel.tier === "free" ? "🆓 Free" : "💰 Paid"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        by {selectedBytezChatModel.provider}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Image Generation Model
                  </Label>
                  <Select
                    value={settings.bytez_image_model}
                    onValueChange={(value) => setSettings(s => ({ ...s, bytez_image_model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an image model" />
                    </SelectTrigger>
                    <SelectContent>
                      {BYTEZ_IMAGE_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {model.provider}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBytezImageModel && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">🎨 Image Gen</Badge>
                      <span className="text-sm text-muted-foreground">
                        by {selectedBytezImageModel.provider}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Bytez Features
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 💬 Chat with AI models for study assistance</li>
                  <li>• 🎨 Generate images from text prompts</li>
                  <li>• 🎤 Speech-to-text and text-to-speech (coming soon)</li>
                  <li>• 🤖 Auto-detects intent from prompt</li>
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
            <p>• <strong>Bytez</strong> - Best for multi-modal (chat + image generation) with single API</p>
            <p>• Free models have rate limits but are perfect for learning and development</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAISettings;
