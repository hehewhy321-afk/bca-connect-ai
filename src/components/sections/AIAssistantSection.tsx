import { motion, AnimatePresence } from "framer-motion"; // AnimatePresence थपियो
import { Bot, Send, Sparkles, Code, FileText, Lightbulb, LogIn, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const GUEST_CHAT_LIMIT = 2; //limit

const capabilities = [
  {
    icon: Code,
    title: "Code Debugging",
    description: "Get help fixing bugs and understanding errors",
  },
  {
    icon: FileText,
    title: "Study Summaries",
    description: "Summarize chapters and create study notes",
  },
  {
    icon: Lightbulb,
    title: "Practice Problems",
    description: "Generate custom practice questions",
  },
];

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AIAssistantSection() {
  const [inputValue, setInputValue] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const storedCount = localStorage.getItem("guestChatCount");
    if (storedCount) {
      setChatCount(parseInt(storedCount, 10));
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (chatCount >= GUEST_CHAT_LIMIT) {
      setShowLoginPrompt(true);
      return;
    }

    const userMessage: Message = { role: "user", content: inputValue.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    const newCount = chatCount + 1;
    setChatCount(newCount);
    localStorage.setItem("guestChatCount", newCount.toString());

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat-guest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: [...messages, userMessage] }),
        }
      );

      if (response.status === 403) {
        setShowLoginPrompt(true);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return newMessages;
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      if (newCount >= GUEST_CHAT_LIMIT) {
        setTimeout(() => setShowLoginPrompt(true), 1500);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const remainingChats = Math.max(0, GUEST_CHAT_LIMIT - chatCount);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section
      id="ai-assistant"
      className="py-20 md:py-32 bg-gradient-to-br from-muted/50 to-background relative overflow-hidden"
    >
      {/* Background Decoration with Floating Animation */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" 
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.span 
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4"
            >
              <Sparkles className="w-4 h-4" />
              AI-Powered
            </motion.span>
            <motion.h2 variants={itemVariants} className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Your Personal{" "}
              <span className="gradient-text-orange">Study Companion</span>
            </motion.h2>
            <motion.p variants={itemVariants} className="text-muted-foreground text-lg mb-8">
              Meet your 24/7 AI study assistant. Get instant help with BCA
              curriculum, debug code, and prepare for exams.
            </motion.p>

            {/* Capabilities */}
            <div className="space-y-4 mb-8">
              {capabilities.map((cap) => (
                <motion.div
                  key={cap.title}
                  variants={itemVariants}
                  whileHover={{ x: 5 }}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-card/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <cap.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{cap.title}</h4>
                    <p className="text-sm text-muted-foreground">{cap.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="gradient" 
                size="lg" 
                onClick={() => setShowChat(true)}
              >
                Try AI Assistant
                <Bot className="w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Right - Chat Interface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-medium text-primary-foreground">BCA AI Assistant</h4>
                  <p className="text-xs text-primary-foreground/70">
                    {showChat ? `${remainingChats} free chats remaining` : "Always online"}
                  </p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-4 space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {!showChat ? (
                    <motion.div
                      key="demo"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-end">
                        <div className="max-w-[80%] p-3 rounded-2xl text-sm bg-primary text-primary-foreground rounded-br-md">
                          Explain the difference between TCP and UDP protocols
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="max-w-[80%] p-3 rounded-2xl text-sm bg-muted text-foreground rounded-bl-md">
                          TCP is reliable and connection-oriented, while UDP is faster but connectionless.
                        </div>
                      </div>
                    </motion.div>
                  ) : messages.length === 0 ? (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center h-full text-center py-8"
                    >
                      <Bot className="w-12 h-12 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground text-sm">Ask me anything about BCA!</p>
                    </motion.div>
                  ) : (
                    messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-md shadow-md"
                              : "bg-muted text-foreground rounded-bl-md border border-border"
                          }`}
                        >
                          {msg.content || (
                            <span className="flex items-center gap-1.5 py-1">
                              <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                              <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                              <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />

                {/* Login Prompt Overlay */}
                <AnimatePresence>
                  {showLoginPrompt && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20"
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                      >
                        <button onClick={() => setShowLoginPrompt(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                          <X className="w-5 h-5" />
                        </button>
                        <LogIn className="w-12 h-12 text-primary mb-4" />
                        <h3 className="font-heading font-bold text-lg mb-2">Free Trial Ended</h3>
                        <p className="text-muted-foreground text-sm mb-4">Sign in for unlimited access.</p>
                        <Button variant="gradient" onClick={() => navigate("/auth")}>Sign In to Continue</Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={showChat ? "Ask anything..." : "Click 'Try AI Assistant'..."}
                    disabled={!showChat || (remainingChats === 0 && !isLoading)}
                    className="flex-1 px-4 py-3 rounded-xl bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="default"
                      size="icon"
                      className="rounded-xl"
                      onClick={showChat ? handleSendMessage : () => setShowChat(true)}
                      disabled={isLoading || (showChat && remainingChats === 0)}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}