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
  Clock,
  Loader2,
  BookOpen,
} from "lucide-react";
import { ChatMessage, Citation, DocumentMetadata } from "@/types";
import { api } from "@/lib/api";
import { FEATURE_TEMPLATES } from "@/lib/templates";
import { BorderBeam } from "./ui/border-beam";
import { SpotlightCard } from "./ui/spotlight-card";

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

  const modeBtn = (active: boolean) =>
    `flex-1 cursor-pointer rounded-lg border py-1.5 text-center text-xs font-medium transition-all ${active
      ? "border-indigo-500/60 bg-indigo-600/30 text-indigo-100 shadow-md shadow-indigo-500/20"
      : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
    }`;

  return (
    <div className="relative flex h-[calc(100vh-8.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#070b14]/80 shadow-2xl shadow-indigo-950/40 backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl" />

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-5 py-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 text-cyan-300 shadow-md shadow-indigo-500/20">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-100">DocMind RAG Assistant</span>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Querying against:{" "}
              <span className="font-medium text-cyan-300">
                {activeDoc ? activeDoc.filename : "All Ingested Documents"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex cursor-pointer items-center space-x-1 rounded-lg border px-2.5 py-1 text-xs transition-colors ${showSettings
                ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200"
              }`}
            title="Configure RAG Top-K and Similarity Threshold"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">RAG Params (K={topK})</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="relative grid grid-cols-1 gap-4 border-b border-slate-800 bg-slate-900/80 p-4 text-xs sm:grid-cols-3">
          <div>
            <div className="mb-1 flex justify-between font-medium text-slate-300">
              <span>Top-K Chunks to Retrieve</span>
              <span className="font-mono text-indigo-400">{topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full cursor-pointer accent-indigo-500"
            />
            <p className="mt-1 text-[10px] text-slate-400">Number of nearest neighbor chunks fed to LLM.</p>
          </div>

          <div>
            <div className="mb-1 flex justify-between font-medium text-slate-300">
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
              className="w-full cursor-pointer accent-cyan-500"
            />
            <p className="mt-1 text-[10px] text-slate-400">Minimum cosine score (0.0 = return closest top-K).</p>
          </div>

          <div className="flex flex-col justify-between">
            <span className="mb-1 font-medium text-slate-300">Retrieval Mode</span>
            <div className="flex items-center space-x-2">
              <button onClick={() => setIsStreamingMode(false)} className={modeBtn(!isStreamingMode)}>
                Standard (with Citations)
              </button>
              <button onClick={() => setIsStreamingMode(true)} className={modeBtn(isStreamingMode)}>
                Token Streaming
              </button>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">Standard mode returns full passage citations.</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="relative flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <div className="relative mb-5">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-indigo-600 to-cyan-400 opacity-30 blur-xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/30 bg-gradient-to-tr from-indigo-600/30 via-cyan-500/20 to-purple-600/30 text-cyan-200">
                <Sparkles className="h-8 w-8" />
              </div>
            </div>
            <h3 className="bg-gradient-to-r from-white via-indigo-100 to-cyan-200 bg-clip-text text-xl font-bold text-transparent">
              DocMind Document Intelligence
            </h3>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-400">
              Ask natural language questions, extract legal clauses, verify statements, or select a
              pre-built intelligence template below.
            </p>

            <div className="mt-7 w-full max-w-2xl">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center space-x-1.5 font-semibold text-slate-300">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Recommended Analysis Templates</span>
                </span>
                <button
                  onClick={onOpenTemplates}
                  className="cursor-pointer text-[11px] text-indigo-400 underline hover:text-indigo-300"
                >
                  View all ({FEATURE_TEMPLATES.length}) &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
                {quickTemplates.map((tpl) => (
                  <SpotlightCard
                    key={tpl.id}
                    spotlightColor="#6366f133"
                    className="group cursor-pointer p-4 transition-colors hover:border-indigo-500/50"
                    onClick={() => {
                      setInputQuestion(tpl.prompt);
                      textareaRef.current?.focus();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-100 transition-colors group-hover:text-indigo-300">
                        {tpl.title}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">{tpl.badge}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[11px] text-slate-400">{tpl.description}</p>
                  </SpotlightCard>
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
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${isUser
                      ? "bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30"
                      : "border border-slate-700 bg-slate-800 text-cyan-300"
                    }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div
                  className={`flex max-w-[85%] flex-col rounded-2xl p-4 text-xs leading-relaxed sm:max-w-2xl ${isUser
                      ? "rounded-tr-none bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-900/40"
                      : "rounded-tl-none border border-slate-800/80 bg-slate-900/80 text-slate-200 shadow-lg"
                    }`}
                >
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

                  {!isUser && !message.isStreaming && (
                    <div className="mt-3 flex flex-col space-y-2 border-t border-slate-800/80 pt-2.5">
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
                          className="flex cursor-pointer items-center space-x-1 transition-colors hover:text-slate-200"
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

                      {message.citations && message.citations.length > 0 && (
                        <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                          <span className="mb-2 flex items-center space-x-1.5 text-[11px] font-semibold text-indigo-300">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Source Citations ({message.citations.length} Chunks)</span>
                          </span>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {message.citations.map((citation, cIdx) => {
                              const matchScore = citation.similarityScore
                                ? Math.round(citation.similarityScore * 100)
                                : null;

                              return (
                                <SpotlightCard
                                  key={cIdx}
                                  spotlightColor="#22d3ee26"
                                  onClick={() => onOpenCitation(citation)}
                                  className="group cursor-pointer rounded-lg p-2 text-[11px] transition-colors hover:border-cyan-500/50"
                                >
                                  <div className="mb-1 flex items-center justify-between">
                                    <span className="max-w-[140px] truncate font-semibold text-slate-300">
                                      {citation.fileName || "Source Document"}
                                    </span>
                                    {matchScore != null && (
                                      <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 font-mono text-[10px] text-emerald-300">
                                        {matchScore}%
                                      </span>
                                    )}
                                  </div>

                                  <p className="line-clamp-2 text-[10px] italic text-slate-400">
                                    &quot;{citation.snippet}&quot;
                                  </p>

                                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 group-hover:text-cyan-300">
                                    <span>
                                      Page {citation.pageNumber ?? "?"} &bull; Chunk #{citation.chunkIndex ?? 0}
                                    </span>
                                    <span>Inspect &rarr;</span>
                                  </div>
                                </SpotlightCard>
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

      {/* Input */}
      <div className="relative border-t border-slate-800/80 bg-slate-900/60 p-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-3 text-[11px]">
          <button
            onClick={onOpenTemplates}
            className="flex shrink-0 cursor-pointer items-center space-x-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-indigo-300 transition-colors hover:bg-indigo-500/20"
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
              className="shrink-0 cursor-pointer rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-slate-300 transition-colors hover:border-indigo-500/40 hover:text-white"
            >
              {t.title}
            </button>
          ))}
        </div>

        <BorderBeam size="md" colorVariant="colorful">
          <div className="flex w-full items-end rounded-xl bg-[#0b1020] p-2">
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
              className="max-h-36 flex-1 resize-none bg-transparent px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />

            <button
              onClick={() => handleSend()}
              disabled={!inputQuestion.trim() || isLoading}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-400 hover:to-cyan-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </BorderBeam>
      </div>
    </div>
  );
};