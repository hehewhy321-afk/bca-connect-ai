import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Image,
  Loader2,
  Mic,
  MicOff,
  ImageIcon,
  MessageSquare,
  Zap,
  AlertCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { useQuery } from "@tanstack/react-query";

interface AISettings {
  ai_provider: string;
  puter_chat_model: string;
}

type ThinkFilterState = {
  inThink: boolean;
  carry: string;
};

function getCarrySuffix(input: string, tag: string) {
  const max = Math.min(tag.length - 1, input.length);
  for (let k = max; k >= 1; k--) {
    if (tag.startsWith(input.slice(-k))) return input.slice(-k);
  }
  return "";
}

function filterThinkDelta(delta: string, state: ThinkFilterState) {
  const OPEN = "<think>";
  const CLOSE = "</think>";

  let s = state.carry + delta;
  state.carry = "";

  let out = "";

  while (s.length) {
    if (!state.inThink) {
      const i = s.indexOf(OPEN);
      if (i === -1) {
        const carry = getCarrySuffix(s, OPEN);
        state.carry = carry;
        out += carry ? s.slice(0, -carry.length) : s;
        break;
      }
      out += s.slice(0, i);
      s = s.slice(i + OPEN.length);
      state.inThink = true;
      continue;
    }

    const j = s.indexOf(CLOSE);
    if (j === -1) {
      const carry = getCarrySuffix(s, CLOSE);
      state.carry = carry;
      break;
    }

    s = s.slice(j + CLOSE.length);
    state.inThink = false;
  }

  return out;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image";
  imageUrl?: string;
  provider?: string;
  model?: string;
  fallback?: boolean;
  fallbackReason?: string;
}

interface StreamingStatus {
  isStreaming: boolean;
  provider: string;
  model: string;
  tokensReceived: number;
  startTime: number;
  tokensPerSecond: number;
}

// Real-time speech recognition hook using Web Speech API
function useSpeechRecognition(onTranscript: (text: string, isFinal: boolean) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();

      // Configure for real-time continuous recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // You can make this configurable
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript.trim(), true);
        } else if (interimTranscript) {
          onTranscript(interimTranscript.trim(), false);
        }
      };

      recognition.onerror = (event: any) => {
        if (import.meta.env.DEV) {
          console.error('Speech recognition error:', event.error);
        }
        if (event.error === 'no-speech') {
          // Restart if no speech detected
          if (isListening) {
            recognition.start();
          }
        } else if (event.error === 'aborted') {
          // Ignore aborted errors
        } else {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Auto-restart if still supposed to be listening
        if (isListening) {
          try {
            recognition.start();
          } catch (e) {
            if (import.meta.env.DEV) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, onTranscript]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to start recognition:', error);
        }
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, isSupported, startListening, stopListening };
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connecting" | "waking_up" | "streaming">("idle");
  const [streamingStatus, setStreamingStatus] = useState<StreamingStatus>({
    isStreaming: false,
    provider: "",
    model: "",
    tokensReceived: 0,
    startTime: 0,
    tokensPerSecond: 0,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: aiSettings } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_settings")
        .select("*");

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching AI settings:", error);
        }
        return null;
      }

      const settings: any = {};
      data.forEach(item => {
        settings[item.setting_key] = item.setting_value;
      });
      return settings as AISettings;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle real-time transcription
  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      // Add final transcript to input
      setInput(prev => (prev + ' ' + text).trim());
      setInterimTranscript("");
    } else {
      // Show interim results
      setInterimTranscript(text);
    }
  }, []);

  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition(handleTranscript);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMicClick = async () => {
    if (!isSupported) {
      toast({
        title: "Not supported",
        description: "Your browser doesn't support speech recognition. Try Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      stopListening();
      toast({
        title: "Stopped listening",
        description: "Voice input stopped.",
      });
    } else {
      startListening();
      toast({
        title: "Listening...",
        description: "Speak now. Your words will appear in real-time!",
      });
    }
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    toast({
      title: "Chat cleared",
      description: "Your conversation has been cleared.",
    });
  };

  const handleDownloadChat = () => {
    if (messages.length === 0) {
      toast({
        title: "No messages to download",
        description: "Start a conversation first!",
        variant: "destructive",
      });
      return;
    }

    // Function to format markdown content to HTML
    const formatMarkdown = (text: string): string => {
      let formatted = text;

      // Code blocks with syntax highlighting
      formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre class="code-block"><code class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>`;
      });

      // Inline code
      formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

      // Bold text
      formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

      // Headers
      formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="heading-3">$1</h3>');
      formatted = formatted.replace(/^## (.+)$/gm, '<h2 class="heading-2">$1</h2>');
      formatted = formatted.replace(/^# (.+)$/gm, '<h1 class="heading-1">$1</h1>');

      // Horizontal rules
      formatted = formatted.replace(/^={3,}$/gm, '<hr class="divider">');
      formatted = formatted.replace(/^-{3,}$/gm, '<hr class="divider">');

      // Bullet lists
      formatted = formatted.replace(/^\* (.+)$/gm, '<li class="list-item">$1</li>');
      formatted = formatted.replace(/^- (.+)$/gm, '<li class="list-item">$1</li>');

      // Wrap consecutive list items in ul
      formatted = formatted.replace(/(<li class="list-item">.*<\/li>\n?)+/g, (match) => {
        return `<ul class="list">${match}</ul>`;
      });

      // Line breaks
      formatted = formatted.replace(/\n/g, '<br>');

      return formatted;
    };

    // Create beautiful HTML document
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Chat Conversation - ${new Date().toLocaleDateString()}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      min-height: 100vh;
      line-height: 1.6;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    
    .header p {
      font-size: 14px;
      opacity: 0.9;
      font-weight: 500;
    }
    
    .stats {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .stat {
      text-align: center;
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: 800;
      display: block;
    }
    
    .stat-label {
      font-size: 12px;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    
    .messages {
      padding: 40px;
    }
    
    .message {
      display: flex;
      gap: 16px;
      margin-bottom: 32px;
      animation: fadeIn 0.3s ease-in;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .message.user {
      flex-direction: row-reverse;
    }
    
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-weight: 700;
      font-size: 18px;
    }
    
    .avatar.user {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .avatar.assistant {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }
    
    .message-content {
      flex: 1;
      max-width: 70%;
    }
    
    .message.user .message-content {
      text-align: right;
    }
    
    .message-bubble {
      padding: 16px 20px;
      border-radius: 16px;
      display: inline-block;
      max-width: 100%;
      word-wrap: break-word;
      text-align: left;
    }
    
    .message.user .message-bubble {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-bottom-right-radius: 4px;
    }
    
    .message.assistant .message-bubble {
      background: #f7f7f8;
      color: #1a1a1a;
      border-bottom-left-radius: 4px;
    }
    
    /* Markdown formatting styles */
    .message-bubble strong {
      font-weight: 700;
    }
    
    .message-bubble .heading-1 {
      font-size: 24px;
      font-weight: 800;
      margin: 16px 0 12px 0;
      color: inherit;
    }
    
    .message-bubble .heading-2 {
      font-size: 20px;
      font-weight: 700;
      margin: 14px 0 10px 0;
      color: inherit;
    }
    
    .message-bubble .heading-3 {
      font-size: 16px;
      font-weight: 600;
      margin: 12px 0 8px 0;
      color: inherit;
    }
    
    .message-bubble .divider {
      border: none;
      border-top: 2px solid rgba(0, 0, 0, 0.1);
      margin: 16px 0;
    }
    
    .message.user .message-bubble .divider {
      border-top-color: rgba(255, 255, 255, 0.3);
    }
    
    .message-bubble .list {
      margin: 12px 0;
      padding-left: 24px;
    }
    
    .message-bubble .list-item {
      margin: 6px 0;
      line-height: 1.6;
    }
    
    .message-bubble .inline-code {
      background: rgba(0, 0, 0, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 0.9em;
    }
    
    .message.user .message-bubble .inline-code {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .message-bubble .code-block {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 12px 0;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.5;
    }
    
    .message-bubble .code-block code {
      color: #f8f8f2;
      font-family: inherit;
    }
    
    .message-meta {
      font-size: 11px;
      margin-top: 8px;
      opacity: 0.6;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .message.user .message-meta {
      justify-content: flex-end;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .badge.image {
      background: #e0f2fe;
      color: #0369a1;
    }
    
    .badge.provider {
      background: #f0fdf4;
      color: #15803d;
    }
    
    .message-image {
      margin-top: 12px;
      border-radius: 12px;
      max-width: 100%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .footer {
      background: #f7f7f8;
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e5e5e5;
    }
    
    .footer p {
      font-size: 13px;
      color: #666;
      margin-bottom: 8px;
    }
    
    .footer .logo {
      font-size: 18px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 AI Chat Conversation</h1>
      <p>Exported on ${new Date().toLocaleString()}</p>
      <div class="stats">
        <div class="stat">
          <span class="stat-value">${messages.length}</span>
          <span class="stat-label">Messages</span>
        </div>
        <div class="stat">
          <span class="stat-value">${messages.filter(m => m.type === "image").length}</span>
          <span class="stat-label">Images</span>
        </div>
        <div class="stat">
          <span class="stat-value">${user?.email?.split('@')[0] || 'User'}</span>
          <span class="stat-label">Account</span>
        </div>
      </div>
    </div>
    
    <div class="messages">
      ${messages.map((message, index) => `
        <div class="message ${message.role}">
          <div class="avatar ${message.role}">
            ${message.role === "user" ? "👤" : "🤖"}
          </div>
          <div class="message-content">
            <div class="message-bubble">
              ${formatMarkdown(message.content)}
              ${message.type === "image" && message.imageUrl ? `
                <img src="${message.imageUrl}" alt="Generated image" class="message-image" />
              ` : ''}
            </div>
            <div class="message-meta">
              ${message.type === "image" ? '<span class="badge image">🖼️ Image</span>' : ''}
              ${message.provider ? `<span class="badge provider">${message.provider}:${message.model}</span>` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="footer">
      <p class="logo">BCA AI Study Assistant</p>
      <p>Powered by AI • MMAMC College</p>
    </div>
  </div>
</body>
</html>
    `;

    // Create and download the file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Chat downloaded!",
      description: "Open the HTML file in your browser to view.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      type: imageMode ? "image" : "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingStatus({
      isStreaming: true,
      provider: "",
      model: "",
      tokensReceived: 0,
      startTime: Date.now(),
      tokensPerSecond: 0,
    });
    setConnectionStatus("connecting");

    // Waking up detection - skip or delay for fast providers
    const isFastProvider = ["groq", "cerebras", "openrouter", "airforce"].includes(aiSettings?.ai_provider || "");
    const wakeupTimer = setTimeout(() => {
      setConnectionStatus((prev) => {
        if (prev === "connecting" && !isFastProvider) {
          return "waking_up";
        }
        return prev;
      });
    }, isFastProvider ? 15000 : 4000); // Much longer delay for fast providers, essentially disabling it for typical use

    try {
      // Check if we should use Puter.js (Client-side)
      if (aiSettings?.ai_provider === "puter" && !imageMode) {
        setStreamingStatus({
          isStreaming: true,
          provider: "Puter.js",
          model: aiSettings.puter_chat_model || "openrouter:meta-llama/llama-3.1-8b-instruct",
          tokensReceived: 0,
          startTime: Date.now(),
          tokensPerSecond: 0,
        });

        // Add empty assistant message
        const assistantId = (Date.now() + 1).toString();
        let assistantContent = "";

        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "", type: "text", provider: "Puter.js", model: aiSettings.puter_chat_model },
        ]);

        const puter = (window as any).puter;
        if (!puter) {
          throw new Error("Puter.js not loaded. Please refresh the page.");
        }

        // Prepare conversation history
        // Puter.js usually takes the prompt string for simple chat, or an array of messages?
        // The tutorial showed: puter.ai.chat(prompt, {model: ...})
        // Let's check if it supports full history. The tutorial didn't explicitly show full history object, 
        // but typically these wrappers align with OpenAI's format or take a string.
        // If it only takes a string, we might lose context.
        // However, looking at standard Puter docs, it maps validation to OpenRouter.
        // Let's try passing the last message content as prompt for now, 
        // OR construct a prompt string from history if needed.
        // Assuming puter.ai.chat takes a prompt string.

        // Construct a prompt from recent messages to maintain some context
        const contextPrompt = messages.slice(-5).map(m => `${m.role}: ${m.content}`).join("\n") + `\nuser: ${input}`;

        const response = await puter.ai.chat(contextPrompt, {
          model: aiSettings.puter_chat_model || "openrouter:meta-llama/llama-3.1-8b-instruct",
          stream: true
        });

        let tokenCount = 0;

        for await (const part of response) {
          if (part?.text) {
            assistantContent += part.text;
            tokenCount += 1; // Rough estimation

            // Update streaming status logic
            const elapsed = (Date.now() - streamingStatus.startTime) / 1000;
            setStreamingStatus(prev => ({
              ...prev,
              tokensReceived: tokenCount,
              tokensPerSecond: elapsed > 0 ? Math.round(tokenCount / elapsed) : 0,
            }));

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              )
            );
          }
        }

        setIsLoading(false);
        setStreamingStatus(prev => ({ ...prev, isStreaming: false }));
        return;
      }

      // Fallback to Server-side (Supabase Edge Function) for other providers
      // Get the current session to use the user's JWT token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please log in to use the AI assistant");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            mode: imageMode ? "image" : "chat",
          }),
        }
      );

      // Get provider info from headers
      const provider = response.headers.get("X-AI-Provider") || "unknown";
      const model = response.headers.get("X-AI-Model") || "unknown";

      setStreamingStatus(prev => ({
        ...prev,
        provider,
        model,
      }));

      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = errorData.code;

        // Show specific error messages based on error code
        let errorTitle = "Error";
        let errorDesc = errorData.error || "Failed to get response";

        if (errorCode === "RATE_LIMITED") {
          errorTitle = "Rate Limited";
          errorDesc = "Too many requests. Please wait a moment and try again.";
        } else if (errorCode === "CREDITS_EXHAUSTED") {
          errorTitle = "Credits Exhausted";
          errorDesc = "AI credits exhausted. Please add more credits or switch to a free model in Admin > AI Settings.";
        } else if (errorCode === "INVALID_API_KEY") {
          errorTitle = "Invalid API Key";
          errorDesc = "Please check your API key in Admin > AI Settings.";
        }

        toast({
          title: errorTitle,
          description: errorDesc,
          variant: "destructive",
        });
        throw new Error(errorData.error || "Failed to get response");
      }

      // Check if it's an image/JSON response
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const jsonData = await response.json();

        if (jsonData?.type === "image") {
          // Handle different output formats
          let imageUrl = "";

          if (typeof jsonData.output === "string") {
            // Direct URL string (Pollinations, Hugging Face base64)
            imageUrl = jsonData.output;
          } else if (jsonData.output?.url) {
            // Object with url property
            imageUrl = jsonData.output.url;
          } else if (jsonData.output?.image_url) {
            // Alternative format
            imageUrl = jsonData.output.image_url;
          }

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Generated image for: "${jsonData.prompt}"`,
            type: "image",
            imageUrl: imageUrl,
            provider: jsonData.provider,
            model: jsonData.model,
            fallback: jsonData.fallback,
            fallbackReason: jsonData.fallbackReason,
          };

          setMessages((prev) => [...prev, assistantMessage]);

          // Show fallback notification if applicable
          if (jsonData.fallback) {
            toast({
              title: "Using fallback provider",
              description: jsonData.fallbackReason || "Primary provider unavailable",
            });
          }

          setIsLoading(false);
          setStreamingStatus(prev => ({ ...prev, isStreaming: false }));
          return;
        }

        const fallbackText =
          jsonData?.output ?? jsonData?.content ?? jsonData?.message ?? jsonData?.error;
        if (fallbackText) {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: String(fallbackText),
              type: "text",
            },
          ]);
          setIsLoading(false);
          setStreamingStatus(prev => ({ ...prev, isStreaming: false }));
          return;
        }

        throw new Error("Unexpected AI response format");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = (Date.now() + 1).toString();

      // Add empty assistant message
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", type: "text", provider, model },
      ]);

      let buffer = "";
      const thinkState: ThinkFilterState = { inThink: false, carry: "" };
      let tokenCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process line by line
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              const filtered = filterThinkDelta(content, thinkState);
              if (filtered) {
                assistantContent += filtered;
                tokenCount += filtered.split(/\s+/).length;

                // Update streaming status
                const elapsed = (Date.now() - streamingStatus.startTime) / 1000;
                setConnectionStatus("streaming");
                setStreamingStatus(prev => ({
                  ...prev,
                  tokensReceived: tokenCount,
                  tokensPerSecond: elapsed > 0 ? Math.round(tokenCount / elapsed) : 0,
                }));

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: assistantContent } : m
                  )
                );
              }
            }
          } catch {
            // Incomplete JSON, will be handled in next iteration
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Chat error:", error);
      }
      // Only show toast if not already shown
      if (!(error instanceof Error && error.message.includes("Failed to get response"))) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to get response",
          variant: "destructive",
        });
      }
    } finally {
      clearTimeout(wakeupTimer);
      setIsLoading(false);
      setStreamingStatus(prev => ({ ...prev, isStreaming: false }));
      setConnectionStatus("idle");
    }
  };

  const suggestedQuestions = imageMode
    ? [
      "Generate an image of a futuristic classroom",
      "Create an image of a beautiful sunset over mountains",
      "Draw a cute robot studying computer science",
      "Make an image of Nepal's Himalayan landscape",
    ]
    : [
      "Explain polymorphism in Java",
      "What is normalization in databases?",
      "Write a Python function for binary search",
      "How does recursion work?",
    ];

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">
                AI Study Assistant
              </h1>
              <p className="text-sm text-muted-foreground">
                Chat, Voice & Image Generation • 24/7 BCA companion
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard/image-gallery">
              <Button variant="outline" size="sm">
                <ImageIcon className="w-4 h-4 mr-2" />
                Gallery
              </Button>
            </Link>
            {messages.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleDownloadChat}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearChat}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Chat
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Streaming Status Indicator */}
        {streamingStatus.isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50 border border-border"
          >
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">
              {streamingStatus.provider && (
                <Badge variant="secondary" className="mr-2">
                  {streamingStatus.provider}
                </Badge>
              )}
              {streamingStatus.model && (
                <span className="text-xs opacity-75">{streamingStatus.model}</span>
              )}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {streamingStatus.tokensPerSecond > 0 && (
                <span className="font-mono">
                  ~{streamingStatus.tokensPerSecond} tokens/sec
                </span>
              )}
            </span>
          </motion.div>
        )}

        {/* Chat Area */}
        <div className="flex-1 bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
                  {imageMode ? (
                    <ImageIcon className="w-10 h-10 text-primary" />
                  ) : (
                    <Sparkles className="w-10 h-10 text-primary" />
                  )}
                </div>
                <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                  {imageMode ? "Image Generation Mode" : "How can I help you today?"}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {imageMode
                    ? "Describe any image you want to create and I'll generate it for you!"
                    : "Ask me anything about your BCA curriculum, programming concepts, or toggle Image Mode to generate images!"
                  }
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => setInput(question)}
                      className="p-3 text-left text-sm rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors flex items-center gap-2"
                    >
                      {imageMode ? (
                        <ImageIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      ) : (
                        <Bot className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                      <span>{question}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""
                      }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${message.role === "user"
                        ? "bg-primary"
                        : "bg-gradient-to-br from-primary to-accent"
                        }`}
                    >
                      {message.role === "user" ? (
                        <User className="w-4 h-4 text-primary-foreground" />
                      ) : message.type === "image" ? (
                        <Image className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                    <div
                      className={`flex-1 max-w-[80%] ${message.role === "user" ? "text-right" : ""
                        }`}
                    >
                      <div
                        className={`inline-block p-4 rounded-2xl ${message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                          }`}
                      >
                        {message.type === "image" && message.imageUrl ? (
                          <div className="space-y-2">
                            <p className="text-sm">{message.content}</p>
                            <img
                              src={message.imageUrl}
                              alt="Generated image"
                              className="rounded-lg max-w-full h-auto"
                            />
                            {message.provider && (
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {message.provider}:{message.model}
                                </Badge>
                                {message.fallback && (
                                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Fallback
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm">
                            <MarkdownRenderer content={message.content} />
                          </div>
                        )}
                      </div>
                      {message.role === "assistant" && message.content && (
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => handleCopy(message.content, message.id)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedId === message.id ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          {message.provider && message.type !== "image" && (
                            <span className="text-xs text-muted-foreground">
                              via {message.provider}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      {imageMode ? (
                        <ImageIcon className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 p-4 bg-muted rounded-2xl rounded-bl-md">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground animate-pulse">
                        {imageMode ? "Generating image..." :
                          connectionStatus === "waking_up" ? "Waking up model... (this may take 15-30s)" :
                            connectionStatus === "connecting" ? "Connecting to server..." :
                              "Thinking..."}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              {/* Voice Button */}
              <Button
                type="button"
                size="icon"
                variant={isListening ? "destructive" : "outline"}
                className={`h-12 w-12 rounded-xl flex-shrink-0 ${isListening ? 'animate-pulse' : ''}`}
                onClick={handleMicClick}
                disabled={isLoading}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>

              {/* Mode Toggle - Chat/Image */}
              <Button
                type="button"
                size="icon"
                variant={imageMode ? "default" : "outline"}
                className={`h-12 w-12 rounded-xl flex-shrink-0 ${imageMode ? 'bg-primary hover:bg-primary/90' : ''}`}
                onClick={() => setImageMode(!imageMode)}
                disabled={isLoading}
                aria-label="Toggle between chat and image mode"
              >
                {imageMode ? (
                  <ImageIcon className="w-5 h-5" />
                ) : (
                  <MessageSquare className="w-5 h-5" />
                )}
              </Button>

              {/* Input Field */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isListening
                      ? "Listening... Speak now!"
                      : imageMode
                        ? "Describe the image you want to generate..."
                        : "Ask anything about your studies..."
                  }
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isLoading}
                />
                {/* Show interim transcript as overlay */}
                {interimTranscript && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 italic pointer-events-none">
                    {input && <span className="opacity-0">{input} </span>}
                    {interimTranscript}
                  </div>
                )}
                {imageMode && !isListening && (
                  <ImageIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                )}
                {isListening && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span className="w-1 h-3 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-3 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>

              {/* Send Button */}
              <Button
                type="submit"
                size="icon"
                className="h-12 w-12 rounded-xl"
                disabled={!input.trim() || isLoading}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              🎤 Real-time Voice • 💬 Chat • 🎨 Image Generation
              {imageMode && <span className="text-primary font-medium"> • IMAGE MODE ON</span>}
              {isListening && <span className="text-red-500 font-medium animate-pulse"> • LISTENING...</span>}
            </p>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
