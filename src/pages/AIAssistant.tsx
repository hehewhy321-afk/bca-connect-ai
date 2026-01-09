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
  Volume2,
  VolumeX,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

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
}

// Voice recording hook
function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      throw error;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return { isRecording, audioBlob, startRecording, stopRecording, setAudioBlob };
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isRecording, audioBlob, startRecording, stopRecording, setAudioBlob } = useVoiceRecording();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle voice recording result
  useEffect(() => {
    if (audioBlob) {
      handleVoiceInput(audioBlob);
      setAudioBlob(null);
    }
  }, [audioBlob]);

  const handleVoiceInput = async (blob: Blob) => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please log in to use voice features");
      }

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const base64Audio = await base64Promise;

      // Send to speech-to-text
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-voice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "stt",
            audio: base64Audio,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transcribe audio");
      }

      const { text } = await response.json();
      if (text) {
        setInput(text);
        toast({
          title: "Voice transcribed",
          description: "Your speech has been converted to text.",
        });
      }
    } catch (error) {
      console.error("Voice input error:", error);
      toast({
        title: "Voice error",
        description: error instanceof Error ? error.message : "Failed to process voice",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        await startRecording();
        toast({
          title: "Recording started",
          description: "Speak now. Click the mic again to stop.",
        });
      } catch (error) {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to use voice input.",
          variant: "destructive",
        });
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
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
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      // Check if it's an image/JSON response
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const jsonData = await response.json();

        if (jsonData?.type === "image") {
          const imageUrl = jsonData.output?.url || jsonData.output;
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Generated image for: "${jsonData.prompt}"`,
            type: "image",
            imageUrl: typeof imageUrl === "string" ? imageUrl : undefined,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);
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
        { id: assistantId, role: "assistant", content: "", type: "text" },
      ]);

      let buffer = "";
      const thinkState: ThinkFilterState = { inThink: false, carry: "" };

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
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "Explain polymorphism in Java",
    "What is normalization in databases?",
    "Write a Python function for binary search",
    "Generate an image of a futuristic classroom",
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
              <Button variant="ghost" size="sm" onClick={handleClearChat}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Chat
              </Button>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                  How can I help you today?
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Ask me anything about your BCA curriculum, programming
                  concepts, or even generate images!
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => setInput(question)}
                      className="p-3 text-left text-sm rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors flex items-center gap-2"
                    >
                      {question.toLowerCase().includes("image") ? (
                        <Image className="w-4 h-4 text-primary flex-shrink-0" />
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
                    className={`flex gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        message.role === "user"
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
                      className={`flex-1 max-w-[80%] ${
                        message.role === "user" ? "text-right" : ""
                      }`}
                    >
                      <div
                        className={`inline-block p-4 rounded-2xl ${
                          message.role === "user"
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
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="text-sm">
                            <MarkdownRenderer content={message.content} />
                          </div>
                        )}
                      </div>
                      {message.role === "assistant" && message.content && (
                        <button
                          onClick={() => handleCopy(message.content, message.id)}
                          className="mt-1 p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex items-center gap-2 p-4 bg-muted rounded-2xl rounded-bl-md">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
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
              <Button
                type="button"
                size="icon"
                variant={isRecording ? "destructive" : "outline"}
                className="h-12 w-12 rounded-xl flex-shrink-0"
                onClick={handleMicClick}
                disabled={isLoading}
              >
                {isRecording ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRecording ? "Recording... Click mic to stop" : "Ask anything or try 'Generate an image of...'"}
                className="flex-1 px-4 py-3 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isLoading || isRecording}
              />
              <Button
                type="submit"
                size="icon"
                className="h-12 w-12 rounded-xl"
                disabled={!input.trim() || isLoading || isRecording}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              🎤 Voice Input • 💬 Chat • 🎨 Image Generation
            </p>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
