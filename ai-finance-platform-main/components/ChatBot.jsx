"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Loader2,
  Sparkles,
  Zap,
  Copy,
  Check,
  ChevronRight,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChatResponse } from "@/actions/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function extractSuggestions(rawText) {
  if (!rawText) return { mainContent: "", suggestions: [] };
  const marker = "💡 You might also want to ask:";
  const idx = rawText.indexOf(marker);
  if (idx === -1) return { mainContent: rawText, suggestions: [] };

  const mainContent = rawText.slice(0, idx).trim();
  const rawSuggestions = rawText.slice(idx + marker.length).trim();
  const suggestions = rawSuggestions
    .split("\n")
    .map((s) => s.replace(/^\d+[\.\)]\s*/, "").replace(/^[-*•]\s*/, "").trim())
    .filter((s) => s.length > 8 && !s.toLowerCase().includes("might also want to ask"));

  return { mainContent, suggestions };
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm **SAMPAT AI**, your personal financial advisor. I have access to your live account data, transactions, and budgets. Ask me anything — from spending audits to custom saving strategies. 💡",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (customText) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage = { role: "user", content: textToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const history = updatedMessages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const result = await getChatResponse(textToSend, history);
      const aiText = result?.success
        ? result.response
        : `⚠️ **AI Notice**\n\n${result?.error || "Failed to retrieve response."}`;
      setMessages((prev) => [...prev, { role: "assistant", content: aiText }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **AI Temporarily Unavailable**\n\n${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSpeak = (text, index) => {
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech not supported in this browser.");
      return;
    }
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_~]/g, "").replace(/₹/g, "Rupees ").replace(/💡.*/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Listening... Speak now");
      };
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (e) {
      setIsListening(false);
      toast.error("Failed to start voice recognition.");
    }
  };

  const quickPrompts = [
    "Spending summary",
    "Budget status",
    "Saving tips",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        /* --- Floating Trigger Button --- */
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-100 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white cursor-pointer group"
          aria-label="Open SAMPAT AI Financial Assistant"
          suppressHydrationWarning
        >
          <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 group-hover:rotate-12 transition-transform" />
          <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-indigo-500 pointer-events-none" />
          {/* Live indicator dot */}
          <span className="absolute top-0 right-0 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </span>
        </button>
      ) : (
        /* --- High-End Chat Panel --- */
        <div
          className={cn(
            "flex flex-col rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141B2D] shadow-2xl transition-all duration-300",
            isExpanded
              ? "w-[92vw] sm:w-[540px] h-[80vh] max-h-[720px]"
              : "w-[92vw] sm:w-[410px] h-[580px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-white font-black text-sm tracking-tight flex items-center gap-1.5">
                  SAMPAT AI
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 font-bold uppercase">
                    Advisor
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-100 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-time Financial Sync</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-[#0B1120]/50">
            {messages.map((m, idx) => {
              const isAssistant = m.role === "assistant";
              const { mainContent, suggestions } = isAssistant
                ? extractSuggestions(m.content)
                : { mainContent: m.content, suggestions: [] };

              return (
                <div
                  key={idx}
                  className={cn("flex flex-col gap-1.5", isAssistant ? "items-start" : "items-end")}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    <span>{isAssistant ? "SAMPAT AI" : "You"}</span>
                  </div>

                  <div className="flex gap-2 max-w-[90%] items-start group">
                    {isAssistant && (
                      <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/20">
                        <Sparkles size={13} />
                      </div>
                    )}

                    <div
                      className={cn(
                        "relative px-4 py-3 text-xs sm:text-sm leading-relaxed rounded-2xl transition-all shadow-sm",
                        isAssistant
                          ? "bg-white dark:bg-[#141B2D] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-sm"
                          : "bg-indigo-600 text-white rounded-tr-sm"
                      )}
                    >
                      {isAssistant ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none space-y-2 font-medium">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              table: ({ node, ...props }) => (
                                <div className="overflow-x-auto my-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <table className="w-full text-[11px] text-left border-collapse" {...props} />
                                </div>
                              ),
                              th: ({ node, ...props }) => (
                                <th className="p-1.5 bg-slate-100 dark:bg-slate-800 font-bold" {...props} />
                              ),
                              td: ({ node, ...props }) => (
                                <td className="p-1.5 border-t border-slate-100 dark:border-slate-800" {...props} />
                              ),
                            }}
                          >
                            {mainContent}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap font-medium">{m.content}</p>
                      )}

                      {/* Action Toolbar */}
                      {isAssistant && (
                        <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => handleCopy(mainContent, idx)}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-[10px] font-semibold"
                            title="Copy message"
                          >
                            {copiedIndex === idx ? (
                              <Check size={11} className="text-emerald-500" />
                            ) : (
                              <Copy size={11} />
                            )}
                            <span>{copiedIndex === idx ? "Copied" : "Copy"}</span>
                          </button>

                          <button
                            onClick={() => handleSpeak(mainContent, idx)}
                            className={cn(
                              "p-1 rounded-md flex items-center gap-1 text-[10px] font-semibold transition-colors",
                              speakingIndex === idx
                                ? "text-indigo-600 bg-indigo-500/10"
                                : "text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                            title="Listen to audio"
                          >
                            {speakingIndex === idx ? (
                              <VolumeX size={11} className="animate-pulse text-indigo-600" />
                            ) : (
                              <Volume2 size={11} />
                            )}
                            <span>{speakingIndex === idx ? "Stop" : "Listen"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suggestion Chips */}
                  {suggestions.length > 0 && (
                    <div className="pl-9 space-y-1 w-full max-w-[90%]">
                      {suggestions.map((q, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSend(q)}
                          className="w-full text-left flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors shadow-2xs group/chip"
                        >
                          <span className="truncate">{q}</span>
                          <ChevronRight size={11} className="text-indigo-500 shrink-0 group-hover/chip:translate-x-0.5 transition-transform" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 pl-1">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Sparkles size={12} className="animate-spin" />
                </div>
                <span>SAMPAT AI is generating insights...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Strip */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#141B2D] flex gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="whitespace-nowrap px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
                >
                  ⚡ {p}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Input Area */}
          <div className="p-3 bg-white dark:bg-[#141B2D] border-t border-slate-100 dark:border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
            >
              {/* Voice Speech-to-Text Dictation Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={cn(
                  "p-1.5 rounded-lg transition-all shrink-0",
                  isListening
                    ? "bg-rose-500 text-white animate-pulse"
                    : "text-slate-400 hover:text-indigo-600"
                )}
                title={isListening ? "Listening... click to stop" : "Speak to type"}
              >
                {isListening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>

              <Input
                placeholder="Ask about budgets, goals, transactions..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1 h-9 shadow-none text-xs sm:text-sm text-slate-900 dark:text-white font-medium placeholder:text-slate-400"
                disabled={isLoading}
                suppressHydrationWarning
              />

              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="h-8 w-8 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-95 disabled:opacity-40"
                suppressHydrationWarning
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
