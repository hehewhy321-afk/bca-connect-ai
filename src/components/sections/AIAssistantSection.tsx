import { motion } from "framer-motion";
import { Bot, Send, Sparkles, Code, FileText, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const sampleMessages = [
  {
    type: "user",
    content: "Explain the difference between TCP and UDP protocols",
  },
  {
    type: "assistant",
    content:
      "Great question! TCP (Transmission Control Protocol) is connection-oriented and ensures reliable, ordered delivery of data. UDP (User Datagram Protocol) is connectionless, faster but doesn't guarantee delivery. TCP is used for web browsing, email; UDP for streaming, gaming.",
  },
];

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

export function AIAssistantSection() {
  const [inputValue, setInputValue] = useState("");

  return (
    <section
      id="ai-assistant"
      className="py-20 md:py-32 bg-gradient-to-br from-muted/50 to-background relative overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered
            </span>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Your Personal{" "}
              <span className="gradient-text-orange">Study Companion</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Meet your 24/7 AI study assistant. Get instant help with BCA
              curriculum, debug code, understand complex concepts, and prepare
              for exams with personalized guidance.
            </p>

            {/* Capabilities */}
            <div className="space-y-4 mb-8">
              {capabilities.map((cap, index) => (
                <motion.div
                  key={cap.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <cap.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{cap.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {cap.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button variant="gradient" size="lg">
              Try AI Assistant
              <Bot className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* Right - Chat Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-medium text-primary-foreground">
                    BCA AI Assistant
                  </h4>
                  <p className="text-xs text-primary-foreground/70">
                    Always online • Powered by Gemini
                  </p>
                </div>
                <div className="ml-auto flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-4 space-y-4 min-h-[300px]">
                {sampleMessages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.2 }}
                    className={`flex ${
                      msg.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.type === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask anything about BCA..."
                    className="flex-1 px-4 py-3 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <Button variant="default" size="icon" className="rounded-xl">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-secondary/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
