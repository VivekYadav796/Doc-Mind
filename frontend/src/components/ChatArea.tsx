"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  SlidersHorizontal,
  Trash2,
  Copy,
  Check,
  FileText,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  BookOpen,
} from "lucide-react";
import { ChatMessage, Citation, DocumentMetadata, Template } from "@/types";
import { api } from "@/lib/api";
import { FEATURE_TEMPLATES } from "@/lib/templates";

interface ChatAreaProps {
  documents: DocumentMetadata[];
  selectedDocId: string | null;
  setSelectedDocId: (id: string | null) => void;
  onOpenTemplates: () => void;
  onOpenCitation: (citation: Citation) => void;
  pendingPrompt?: string | null;
  onClearPendingPrompt?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  documents,
  selectedDocId,
  setSelectedDocId,
  onOpenTemplates,
  onOpenCitation,
  pendingPrompt,
  onClearPendingPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreamingMode, setIsStreamingMode] = useState(false);
  const [topK, setTopK] = useState(5);
  const [minSimilarity, setMinSimilarity] = useState(0.0);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (pendingPrompt) {
      setInputQuestion(pendingPrompt);
      if (onClearPendingPrompt) onClearPendingPrompt();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
      }, 50);
    }
  }, [pendingPrompt, onClearPendingPrompt]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const activeDoc = documents.find((d) => d.id === selectedDocId);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleSend = async (questionToSend?: string) => {
    const q = (questionToSend || inputQuestion).trim();
    if (!q || isLoading) return;

    setInputQuestion("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsgId = "msg-" + Date.now();
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      documentId: selectedDocId || undefined,
    };

    const assistantMsgId = "msg-" + (Date.now() + 1);
    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isStreaming: true,
      documentId: selectedDocId || undefined,
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setIsLoading(true);
    const startTime = performance.now();

    if (isStreamingMode) {
      try {
        await api.streamQuestion(
          {
            question: q,
            documentId: selectedDocId || undefined,
            topK,
            minSimilarity,
          },
          (token) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: m.content + token } : m
              )
            );
          },
          () => {
            const duration = Math.round(performance.now() - startTime);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, isStreaming: false, responseTimeMs: duration }
                  : m
              )
            );
            setIsLoading(false);
          },
          (error) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                    ...m,
                    isStreaming: false,
                    content:
                      m.content ||
                      `Error streaming response: ${error.message}. You can switch off SSE Streaming to use standard Query mode.`,
                  }
                  : m
              )
            );
            setIsLoading(false);
          }
        );
      } catch (err: unknown) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                ...m,
                isStreaming: false,
                content: `Failed to query: ${err instanceof Error ? err.message : String(err)}`,
              }
              : m
          )
        );
        setIsLoading(false);
      }
    } else {
      // Standard query mode
      try {
        const response = await api.askQuestion({
          question: q,
          documentId: selectedDocId || undefined,
          topK,
          minSimilarity,
        });

        const duration = response.responseTimeMs || Math.round(performance.now() - startTime);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                ...m,
                content: response.answer || "No response generated by model.",
                citations: response.citations || [],
                responseTimeMs: duration,
                isStreaming: false,
              }
              : m
          )
        );
      } catch (err: unknown) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                ...m,
                content: `Error: ${err instanceof Error ? err.message : String(err)}. Please ensure PostgreSQL and the Spring Boot backend are running.`,
                isStreaming: false,
              }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputQuestion(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const quickTemplates = FEATURE_TEMPLATES.slice(0, 4);

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] rounded-2xl border border-slate-800 bg-[#070b14]/70 backdrop-blur-xl overflow-hidden shadow-2xl shadow-indigo-950/20">
      {/* Chat Header Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-200">DocMind RAG Assistant</span>
              <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.2 text-[10px] text-indigo-300">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Querying against:{" "}
              <span className="text-slate-300 font-medium">
                {activeDoc ? activeDoc.filename : "All Ingested Documents"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Settings Drawer Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center space-x-1 rounded-lg border px-2.5 py-1 text-xs transition-colors ${showSettings
                ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200"
              }`}
            title="Configure RAG Top-K and Similarity Threshold"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">RAG Params (K={topK})</span>
          </button>

          {/* Clear Conversation */}
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* RAG Settings Collapsible Panel */}
      {showSettings && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-800 bg-slate-900/80 p-4 text-xs">
          <div>
            <div className="flex justify-between text-slate-300 font-medium mb-1">
              <span>Top-K Chunks to Retrieve</span>
              <span className="font-mono text-indigo-400">{topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1">Number of nearest neighbor chunks fed to LLM.</p>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 font-medium mb-1">
              <span>Similarity Threshold</span>
              <span className="font-mono text-cyan-400">{minSimilarity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.9"
              step="0.05"
              value={minSimilarity}
              onChange={(e) => setMinSimilarity(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1">Minimum cosine score (0.0 = return closest top-K).</p>
          </div>

          <div className="flex flex-col justify-between">
            <span className="text-slate-300 font-medium mb-1">Retrieval Mode</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsStreamingMode(false)}
                className={`flex-1 rounded-lg py-1.5 text-center text-xs font-medium border ${!isStreamingMode
                    ? "border-indigo-500/50 bg-indigo-600/30 text-indigo-200"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
              >
                Standard (with Citations)
              </button>
              <button
                onClick={() => setIsStreamingMode(true)}
                className={`flex-1 rounded-lg py-1.5 text-center text-xs font-medium border ${isStreamingMode
                    ? "border-indigo-500/50 bg-indigo-600/30 text-indigo-200"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
              >
                Token Streaming
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Standard mode returns full passage citations.</p>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          /* Empty State with Template Recommendations */
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600/20 via-cyan-500/20 to-purple-600/20 border border-indigo-500/30 text-cyan-300 mb-4 shadow-lg shadow-indigo-950/50">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">
              DocMind Document Intelligence
            </h3>
            <p className="mt-1 max-w-md text-xs text-slate-400 leading-relaxed">
              Ask natural language questions, extract legal clauses, verify statements, or select a
              pre-built intelligence template below.
            </p>

            {/* Quick Templates Chips */}
            <div className="mt-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Recommended Analysis Templates</span>
                </span>
                <button
                  onClick={onOpenTemplates}
                  className="text-indigo-400 hover:text-indigo-300 text-[11px] underline cursor-pointer"
                >
                  View all ({FEATURE_TEMPLATES.length}) &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                {quickTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      setInputQuestion(tpl.prompt);
                      textareaRef.current?.focus();
                    }}
                    className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:border-indigo-500/40 hover:bg-slate-800/40 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {tpl.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{tpl.badge}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                      {tpl.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${isUser
                      ? "bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/20"
                      : "bg-slate-800 border border-slate-700 text-cyan-300"
                    }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`flex flex-col max-w-[85%] sm:max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${isUser
                      ? "bg-indigo-600/90 text-white rounded-tr-none shadow-md shadow-indigo-900/30"
                      : "bg-slate-900/80 text-slate-200 border border-slate-800/80 rounded-tl-none shadow-lg"
                    }`}
                >
                  {/* Content */}
                  {message.isStreaming && !message.content ? (
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                      <span>DocMind is analyzing vector embeddings...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap font-sans selection:bg-indigo-500/30">
                      {message.content}
                    </div>
                  )}

                  {/* Assistant Footer Info (Latency & Citations) */}
                  {!isUser && !message.isStreaming && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center space-x-2">
                          {message.responseTimeMs && (
                            <span className="flex items-center space-x-1 text-emerald-400">
                              <Clock className="h-3 w-3" />
                              <span>{message.responseTimeMs}ms</span>
                            </span>
                          )}
                          <span>&bull;</span>
                          <span>{message.timestamp}</span>
                        </div>

                        <button
                          onClick={() => handleCopy(message.id, message.content)}
                          className="flex items-center space-x-1 hover:text-slate-200 transition-colors"
                          title="Copy response"
                        >
                          {copiedMsgId === message.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Citations Accordion */}
                      {message.citations && message.citations.length > 0 && (
                        <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                          <span className="text-[11px] font-semibold text-indigo-300 flex items-center space-x-1.5 mb-2">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Source Citations ({message.citations.length} Chunks)</span>
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {message.citations.map((citation, cIdx) => {
                              const matchScore = citation.similarityScore
                                ? Math.round(citation.similarityScore * 100)
                                : null;

                              return (
                                <div
                                  key={cIdx}
                                  onClick={() => onOpenCitation(citation)}
                                  className="group flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-[11px] hover:border-indigo-500/50 hover:bg-slate-900 transition-all cursor-pointer"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-slate-300 truncate max-w-[140px]">
                                      {citation.fileName || "Source Document"}
                                    </span>
                                    {matchScore != null && (
                                      <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-300 font-mono">
                                        {matchScore}%
                                      </span>
                                    )}
                                  </div>

                                  <p className="line-clamp-2 text-slate-400 text-[10px] italic">
                                    &quot;{citation.snippet}&quot;
                                  </p>

                                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 group-hover:text-indigo-300">
                                    <span>
                                      Page {citation.pageNumber ?? "?"} &bull; Chunk #{citation.chunkIndex ?? 0}
                                    </span>
                                    <span>Inspect &rarr;</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
        {/* Quick Template bar above input */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 text-[11px]">
          <button
            onClick={onOpenTemplates}
            className="flex items-center space-x-1 shrink-0 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-indigo-300 hover:bg-indigo-500/20 transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            <span>Templates</span>
          </button>
          {quickTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setInputQuestion(t.prompt);
                textareaRef.current?.focus();
              }}
              className="shrink-0 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
            >
              {t.title}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="relative mt-1 flex items-end rounded-xl border border-slate-800 bg-slate-950/80 p-2 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputQuestion}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={
              activeDoc
                ? `Ask about "${activeDoc.filename}" (e.g., list all indemnification obligations)...`
                : "Ask anything across all ingested documents (or type Shift+Enter for new line)..."
            }
            className="flex-1 max-h-36 resize-none bg-transparent px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputQuestion.trim() || isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/25 hover:from-indigo-600 hover:to-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
