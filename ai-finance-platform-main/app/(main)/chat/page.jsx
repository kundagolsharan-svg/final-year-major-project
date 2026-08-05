"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertCircle,
  BarChart2,
  MessageSquare,
  Loader2,
  Volume2,
  VolumeX,
  Download,
  ShieldCheck,
  Zap,
  Target,
  Wallet,
  Compass,
  FileSpreadsheet,
  Mic,
  MicOff,
  SlidersHorizontal,
  ChevronDown,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { getChatResponse, getUserFinancialSummaryForChat } from "@/actions/chat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Preset Prompt Library ──────────────────────────────────────────────────
const PROMPT_CATEGORIES = [
  {
    id: "cashflow",
    name: "Ledger & Expenses",
    icon: TrendingDown,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    prompts: [
      "Break down my top spending categories and point out where I can cut costs.",
      "Are there any unusual or spike expenses in my recent transactions?",
      "How does my spending on dining and shopping compare to essentials?",
      "Analyze my recurring subscriptions and list potential unneeded costs.",
    ],
  },
  {
    id: "budgeting",
    name: "Savings & Budget",
    icon: PiggyBank,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    prompts: [
      "Calculate my current monthly savings rate and give actionable tips to reach 30%.",
      "Draft a personalized 50/30/20 budget plan based on my current income.",
      "How much emergency fund should I hold and how many months am I covered for?",
      "Review my active financial goals and estimate my completion dates.",
    ],
  },
  {
    id: "investing",
    name: "Investments & SIP",
    icon: TrendingUp,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    prompts: [
      "What is a smart SIP investment strategy for someone with my cash flow?",
      "Explain the difference between index mutual funds and flexi-cap funds for long-term wealth.",
      "How should I balance equity vs debt given my current account balances?",
      "What are the best tax-saving investment options under Section 80C?",
    ],
  },
  {
    id: "planning",
    name: "Executive Strategy",
    icon: Target,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    prompts: [
      "Give me a 360-degree executive audit of my financial health.",
      "What are 3 immediate financial wins I can achieve this month?",
      "How can I optimize cash held in low-yield accounts into higher returns?",
      "Create a step-by-step debt-elimination and wealth-compounding roadmap.",
    ],
  },
];

// ─── Extract Suggested Follow-Up Questions ──────────────────────────────────
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

// ─── Single Message Bubble Component ─────────────────────────────────────────
function MessageBubble({ msg, onSuggestionClick, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'like' | 'dislike' | null
  const isUser = msg.role === "user";

  const { mainContent, suggestions } = isUser
    ? { mainContent: msg.content, suggestions: [] }
    : extractSuggestions(msg.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(mainContent);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for clean audio
    const cleanText = mainContent
      .replace(/[#*`_~]/g, "")
      .replace(/₹/g, "Rupees ")
      .replace(/💡.*/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex gap-3.5 group", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105",
          isUser
            ? "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-indigo-500/20"
            : "bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 dark:from-indigo-600 dark:to-purple-600 text-indigo-400 dark:text-white border border-indigo-500/30 shadow-indigo-500/10"
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={18} />}
      </div>

      {/* Bubble Container */}
      <div
        className={cn(
          "flex-1 max-w-[88%] sm:max-w-[82%] flex flex-col gap-1.5",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Header Tag & Timestamp */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isUser ? "You" : "SAMPAT AI Advisor"}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Content Box */}
        <div
          className={cn(
            "relative rounded-3xl px-5 py-4 text-sm leading-relaxed transition-all shadow-sm",
            isUser
              ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-indigo-500/20"
              : "bg-white dark:bg-[#141B2D] text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-tl-sm shadow-slate-200/50 dark:shadow-none"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-3 font-medium">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-slate-700/80">
                      <table
                        className="w-full text-xs text-left border-collapse"
                        {...props}
                      />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead
                      className="bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700"
                      {...props}
                    />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="p-2.5 font-bold" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td
                      className="p-2.5 border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      {...props}
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="space-y-1.5 list-disc pl-5 my-2" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="space-y-1.5 list-decimal pl-5 my-2" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li
                      className="text-slate-700 dark:text-slate-200 text-xs sm:text-sm leading-relaxed"
                      {...props}
                    />
                  ),
                  h1: ({ node, ...props }) => (
                    <h1
                      className="text-base font-black text-slate-900 dark:text-white mt-4 mb-2 flex items-center gap-1.5"
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-3 mb-1.5"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mt-2.5 mb-1"
                      {...props}
                    />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong
                      className="font-black text-slate-900 dark:text-white"
                      {...props}
                    />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-indigo-500 pl-3 italic text-xs text-slate-600 dark:text-slate-400 my-2"
                      {...props}
                    />
                  ),
                  code: ({ node, inline, ...props }) =>
                    inline ? (
                      <code
                        className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold"
                        {...props}
                      />
                    ) : (
                      <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto my-2 border border-slate-800">
                        <code {...props} />
                      </pre>
                    ),
                }}
              >
                {mainContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Message Toolbar Actions (Assistant Only) */}
        {!isUser && (
          <div className="flex items-center gap-1.5 px-1 pt-0.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check size={12} className="text-emerald-500" />
              ) : (
                <Copy size={12} />
              )}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              onClick={handleSpeak}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors",
                isSpeaking
                  ? "text-indigo-600 bg-indigo-500/10"
                  : "text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
              title="Listen to response"
            >
              {isSpeaking ? (
                <>
                  <VolumeX size={12} className="animate-pulse text-indigo-600" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 size={12} />
                  <span>Listen</span>
                </>
              )}
            </button>

            <div className="h-3 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            <button
              onClick={() => {
                setFeedback("like");
                toast.success("Thanks for your feedback!");
              }}
              className={cn(
                "p-1 rounded-lg text-slate-400 hover:text-emerald-500 transition-colors",
                feedback === "like" && "text-emerald-500 bg-emerald-500/10"
              )}
              title="Helpful response"
            >
              <ThumbsUp size={12} />
            </button>

            <button
              onClick={() => {
                setFeedback("dislike");
                toast.info("Feedback noted. We will refine future responses.");
              }}
              className={cn(
                "p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors",
                feedback === "dislike" && "text-rose-500 bg-rose-500/10"
              )}
              title="Needs improvement"
            >
              <ThumbsDown size={12} />
            </button>
          </div>
        )}

        {/* Suggested Follow-Up Question Chips */}
        {suggestions.length > 0 && (
          <div className="mt-2 space-y-1.5 w-full">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 pl-1">
              <Sparkles size={11} className="text-purple-500" />
              Suggested Deep Dives:
            </p>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((q, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onSuggestionClick(q)}
                  className="w-full text-left flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all duration-200 shadow-sm group/btn"
                >
                  <span className="truncate">{q}</span>
                  <ChevronRight
                    size={13}
                    className="text-indigo-500 shrink-0 group-hover/btn:translate-x-1 transition-transform"
                  />
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Typing Pulse Indicator ──────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex gap-3.5 items-center"
    >
      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-900 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30 shadow-md">
        <Bot size={18} />
      </div>
      <div className="bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800 rounded-3xl rounded-tl-sm px-5 py-3.5 flex items-center gap-2 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-2">
          SAMPAT AI is analyzing your ledger & calculating insights...
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main Chat Page Component ────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [activeCategory, setActiveCategory] = useState("cashflow");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load live user financial metrics on mount
  useEffect(() => {
    async function loadSummary() {
      const data = await getUserFinancialSummaryForChat();
      if (data) setSummary(data);
    }
    loadSummary();
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Send message handler
  const sendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setInput("");
    setError(null);
    setShowMobileSidebar(false);

    const userMsg = {
      role: "user",
      content: query,
      id: Date.now(),
      timestamp: Date.now(),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsLoading(true);

    try {
      const historyForAI = updatedHistory.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const result = await getChatResponse(query, historyForAI);

      if (result.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.response,
            id: Date.now() + 1,
            timestamp: Date.now(),
          },
        ]);
      } else {
        setError(result.error || "Unable to retrieve AI response. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Connection failed. Please check your network and retry.");
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    if (window.confirm("Are you sure you want to reset this chat session?")) {
      setMessages([]);
      setError(null);
      setInput("");
      toast.success("Conversation reset.");
    }
  };

  const handleExportTranscript = () => {
    if (messages.length === 0) {
      toast.error("No conversation to export.");
      return;
    }
    const transcriptText = messages
      .map(
        (m) =>
          `### ${m.role === "user" ? "USER" : "SAMPAT AI"} [${new Date(m.timestamp || Date.now()).toLocaleString()}]:\n\n${m.content}\n\n---\n`
      )
      .join("\n");

    const blob = new Blob([transcriptText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SAMPAT_AI_Advisor_Transcript_${new Date().toISOString().split("T")[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Transcript exported as Markdown!");
  };

  // Web Speech API voice input toggle
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

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
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Listening... Speak now");
      };

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
      toast.error("Failed to start voice recognition.");
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-6.5rem)] max-w-7xl mx-auto pb-2">
      {/* ───────────────────────────────────────────────────────────────────────
          LEFT PANEL: Financial Intelligence Hub & Prompt Library (Desktop + Drawer)
      ───────────────────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "w-full lg:w-80 shrink-0 flex flex-col gap-4 overflow-y-auto pr-1 transition-all",
          "hidden lg:flex"
        )}
      >
        {/* Live Financial Metrics Snapshot */}
        {summary && (
          <div className="p-4 rounded-3xl bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Wallet size={16} />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Live Snapshot
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                ● Live Sync
              </span>
            </div>

            {/* Metric Tiles */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  sendMessage("Give me a breakdown of my current balance across all accounts.")
                }
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-left hover:border-indigo-400 transition-all group"
              >
                <span className="text-[10px] font-bold text-slate-400 block">Total Balance</span>
                <span className="text-sm font-black text-purple-600 dark:text-purple-400 mt-0.5 block truncate">
                  ₹{Number(summary.totalBalance || 0).toLocaleString("en-IN")}
                </span>
                <span className="text-[9px] text-indigo-500 font-bold group-hover:underline flex items-center gap-0.5 mt-1">
                  Ask AI <ChevronRight size={10} />
                </span>
              </button>

              <button
                onClick={() =>
                  sendMessage("Analyze my monthly income and expenditure trends.")
                }
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-left hover:border-indigo-400 transition-all group"
              >
                <span className="text-[10px] font-bold text-slate-400 block">This Month</span>
                <span className="text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5 block truncate">
                  -₹{Number(summary.monthlyExpense || 0).toLocaleString("en-IN")}
                </span>
                <span className="text-[9px] text-indigo-500 font-bold group-hover:underline flex items-center gap-0.5 mt-1">
                  Audit <ChevronRight size={10} />
                </span>
              </button>
            </div>

            {/* Savings Rate Bar */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <PiggyBank size={13} className="text-emerald-500" /> Savings Rate
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {summary.savingsRate}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(summary.savingsRate, 0), 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Categorized Prompt Library */}
        <div className="flex-1 p-4 rounded-3xl bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Compass size={16} />
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Strategy Library
              </h3>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-2xl">
            {PROMPT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "py-1.5 px-2 rounded-xl text-[11px] font-bold text-center transition-all truncate",
                  activeCategory === cat.id
                    ? "bg-white dark:bg-[#1E293B] text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {cat.name.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Selected Category Prompts */}
          <div className="space-y-2 overflow-y-auto flex-1 max-h-[260px] pr-1">
            {PROMPT_CATEGORIES.find((c) => c.id === activeCategory)?.prompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(p)}
                className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-all duration-200 group flex items-start gap-2"
              >
                <ChevronRight
                  size={13}
                  className="text-indigo-500 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform"
                />
                <span className="leading-snug">{p}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-indigo-500" /> Bank-Grade Privacy
            </span>
            <span>Ollama + Gemini</span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          CENTRAL PANEL: Conversation View & Command Dock
      ───────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full rounded-3xl bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Sparkles size={20} />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#141B2D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  SAMPAT Wealth AI
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  v2.4 Advisor
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Dual-Engine AI • Live Ledger & Goals Context Active
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5">
            {!isEmpty && (
              <>
                <button
                  onClick={handleExportTranscript}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-xs font-bold transition-all"
                  title="Export Transcript"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <button
                  onClick={handleClearChat}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-rose-600 text-xs font-bold transition-all"
                  title="Reset Conversation"
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Messages Feed Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/40 dark:bg-transparent">
          {isEmpty ? (
            /* Welcome Empty State Screen */
            <div className="h-full flex flex-col items-center justify-center text-center p-4 max-w-2xl mx-auto space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/30 rounded-full blur-3xl scale-150" />
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
                  <Bot size={36} />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Welcome to SAMPAT Financial Intelligence
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                  I have synchronized your live accounts, recent transactions, goals, and budgets.
                  Ask me anything from itemized expense audits to long-term wealth compounding roadmaps.
                </p>
              </div>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {[
                  {
                    icon: TrendingDown,
                    title: "Audit Monthly Expenses",
                    desc: "Where is my money going and what can I cut?",
                    color: "text-rose-500 bg-rose-500/10",
                  },
                  {
                    icon: PiggyBank,
                    title: "Optimize Savings Plan",
                    desc: "Build a customized 50/30/20 budget framework",
                    color: "text-amber-500 bg-amber-500/10",
                  },
                  {
                    icon: Target,
                    title: "Goal Feasibility Check",
                    desc: "Are my active goals on track for completion?",
                    color: "text-purple-500 bg-purple-500/10",
                  },
                  {
                    icon: TrendingUp,
                    title: "SIP & Wealth Strategy",
                    desc: "Smart mutual fund and equity allocation plan",
                    color: "text-emerald-500 bg-emerald-500/10",
                  },
                ].map((item, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => sendMessage(item.desc)}
                    className="p-4 rounded-3xl bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-md transition-all group flex items-start gap-3"
                  >
                    <div className={cn("p-2.5 rounded-2xl shrink-0", item.color)}>
                      <item.icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Message List */
            <>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  onSuggestionClick={(q) => sendMessage(q)}
                  onRegenerate={() => {
                    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
                    if (lastUserMsg) sendMessage(lastUserMsg.content);
                  }}
                />
              ))}

              <AnimatePresence>
                {isLoading && <TypingIndicator />}
              </AnimatePresence>

              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl"
                  >
                    <AlertCircle size={18} className="text-rose-500 shrink-0" />
                    <p className="text-xs text-rose-600 dark:text-rose-300 font-semibold flex-1">
                      {error}
                    </p>
                    <button
                      onClick={() => {
                        const last = messages[messages.length - 1];
                        if (last) sendMessage(last.content);
                      }}
                      className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold"
                    >
                      <RefreshCw size={12} /> Retry
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            BOTTOM DOCK: Command Bar Input Box
        ───────────────────────────────────────────────────────────────────── */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#141B2D] shrink-0 space-y-2">
          {/* Quick Context Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Quick:
            </span>
            <button
              onClick={() => sendMessage("Give me an executive summary of my financial state.")}
              className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-bold whitespace-nowrap transition-colors"
            >
              📊 Full Portfolio Summary
            </button>
            <button
              onClick={() => sendMessage("Show my recent transactions in food, shopping, and cold drinks.")}
              className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-bold whitespace-nowrap transition-colors"
            >
              🛍️ Shopping & Food Audit
            </button>
            <button
              onClick={() => sendMessage("How much can I safely save or invest this month?")}
              className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-bold whitespace-nowrap transition-colors"
            >
              💡 Monthly Saving Capacity
            </button>
          </div>

          {/* Input Bar */}
          <div className="relative flex items-end gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={cn(
                "p-2.5 rounded-xl transition-all shrink-0",
                isListening
                  ? "bg-rose-500 text-white animate-pulse"
                  : "text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-800"
              )}
              title={isListening ? "Listening... click to stop" : "Voice dictation"}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {/* Auto-growing Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask SAMPAT AI about your finances, budgets, or investments... (Enter to send)"
              rows={1}
              className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 py-2 resize-none leading-relaxed max-h-36"
              disabled={isLoading}
            />

            {/* Send Button */}
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Send size={14} />
                  <span className="hidden sm:inline">Ask AI</span>
                </>
              )}
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-400 font-medium">
            SAMPAT AI provides data-driven financial advice. Always verify major tax and legal commitments.
          </p>
        </div>
      </div>
    </div>
  );
}
