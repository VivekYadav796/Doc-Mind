"use client";

import React, { useState } from "react";
import {
  Search,
  Scale,
  Sparkles,
  FileText,
  SlidersHorizontal,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Layers,
  Percent,
  CalendarClock,
  Coins,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { Citation, DocumentMetadata, SearchResult } from "@/types";
import { api } from "@/lib/api";

interface SearchClauseFactViewProps {
  documents: DocumentMetadata[];
  selectedDocId: string | null;
  setSelectedDocId: (id: string | null) => void;
  onOpenCitation: (citation: Citation) => void;
  onSendToChat: (query: string) => void;
}

export const SearchClauseFactView: React.FC<SearchClauseFactViewProps> = ({
  documents,
  selectedDocId,
  setSelectedDocId,
  onOpenCitation,
  onSendToChat,
}) => {
  const [activeMode, setActiveMode] = useState<"clauses" | "facts" | "freeform">("clauses");
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(8);
  const [minSimilarity, setMinSimilarity] = useState(0.0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const clausePills = [
    { label: "Indemnification & Defense", query: "indemnification clause hold harmless defense of claims" },
    { label: "Limitation of Liability", query: "limitation of liability aggregate cap indirect damages" },
    { label: "Termination for Convenience / Cause", query: "termination for cause convenience notice period cure" },
    { label: "Confidentiality & Non-Disclosure", query: "confidential information non-disclosure standard of care survival" },
    { label: "Governing Law & Jurisdiction", query: "governing law jurisdiction arbitration venue dispute resolution" },
    { label: "Intellectual Property Ownership", query: "intellectual property rights ownership assignment work for hire" },
    { label: "Force Majeure", query: "force majeure acts of god war epidemic impossibility of performance" },
    { label: "Warranties & Disclaimers", query: "express warranties disclaimer as-is fitness for particular purpose" },
  ];

  const factPills = [
    { label: "Effective & Expiration Dates", query: "effective date expiration date renewal period term commencement" },
    { label: "Authorized Signatories & Entities", query: "authorized signatories contracting entities parties by and between" },
    { label: "Payment Terms & Penalties", query: "payment schedule fees late payment interest penalty Net 30" },
    { label: "Milestones & Delivery Windows", query: "deliverables milestones timeline delivery schedule acceptance criteria" },
    { label: "Insurance & Security Requirements", query: "insurance coverage liability policy minimum limit commercial general" },
  ];

  const handleSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery || query).trim();
    if (!q) return;

    if (overrideQuery) {
      setQuery(overrideQuery);
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await api.searchSimilarity({
        query: q,
        documentId: selectedDocId || undefined,
        topK,
        similaritySearch: minSimilarity,
      });
      setSearchResult(res);
    } catch (err: unknown) {
      alert("Search failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (index: number, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-indigo-950/20 to-slate-900/90 p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-1.5 text-indigo-400">
                <Scale className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-slate-100">
                Clause & Semantic Fact Explorer
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400 max-w-xl">
              Pinpoint critical contractual clauses, factual deadlines, and key statements using
              vector embeddings across your document library.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center space-x-1 rounded-xl border border-slate-800 bg-slate-950/80 p-1">
            <button
              onClick={() => setActiveMode("clauses")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeMode === "clauses"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Clause Search
            </button>
            <button
              onClick={() => setActiveMode("facts")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeMode === "facts"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Fact Finder
            </button>
            <button
              onClick={() => setActiveMode("freeform")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeMode === "freeform"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Freeform Search
            </button>
          </div>
        </div>

        {/* Quick Filter Pills */}
        {activeMode === "clauses" && (
          <div className="mt-4 flex flex-wrap gap-2">
            {clausePills.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(pill.query)}
                className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-300 hover:bg-indigo-500/25 hover:border-indigo-500/40 transition-all cursor-pointer"
              >
                + {pill.label}
              </button>
            ))}
          </div>
        )}

        {activeMode === "facts" && (
          <div className="mt-4 flex flex-wrap gap-2">
            {factPills.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(pill.query)}
                className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-500/40 transition-all cursor-pointer"
              >
                + {pill.label}
              </button>
            ))}
          </div>
        )}

        {/* Search Controls Bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Query Input */}
          <div className="relative sm:col-span-6">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={
                activeMode === "clauses"
                  ? "Enter clause term (e.g. indemnification liability cap)..."
                  : activeMode === "facts"
                  ? "Enter facts to verify (e.g. payment terms, effective date)..."
                  : "Type semantic question or phrase..."
              }
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Document Scope */}
          <div className="sm:col-span-3">
            <select
              value={selectedDocId || "all"}
              onChange={(e) => setSelectedDocId(e.target.value === "all" ? null : e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">🌐 All Ingested Documents</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  📄 {d.filename}
                </option>
              ))}
            </select>
          </div>

          {/* Search CTA */}
          <div className="sm:col-span-3 flex items-center space-x-2">
            <button
              onClick={() => handleSearch()}
              disabled={isLoading || !query.trim()}
              className="w-full flex items-center justify-center space-x-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-cyan-600 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Search Vectors</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Parameter Sliders */}
        <div className="mt-4 flex flex-wrap items-center gap-6 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <span>Results Limit (Top-K):</span>
            <input
              type="range"
              min="1"
              max="20"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-24 accent-indigo-500 cursor-pointer"
            />
            <span className="font-mono text-indigo-400 font-semibold">{topK}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span>Min Similarity Threshold:</span>
            <input
              type="range"
              min="0.0"
              max="0.9"
              step="0.05"
              value={minSimilarity}
              onChange={(e) => setMinSimilarity(Number(e.target.value))}
              className="w-24 accent-cyan-500 cursor-pointer"
            />
            <span className="font-mono text-cyan-400 font-semibold">
              {minSimilarity.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
              <span>Matching Chunks & Clauses</span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-indigo-300 font-mono">
                {searchResult?.totalMatches ?? 0} matches
              </span>
            </h3>
            {query && (
              <span className="text-[11px] text-slate-500">
                Query: <span className="text-slate-400 font-mono">&quot;{query}&quot;</span>
              </span>
            )}
          </div>

          {!searchResult || searchResult.matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-slate-500 mb-2" />
              <p className="text-xs font-medium text-slate-300">
                No matching chunks found above threshold
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Try lowering the minimum similarity threshold or using broader keywords.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {searchResult.matches.map((match, idx) => {
                const matchScore = match.similarityScore
                  ? Math.round(match.similarityScore * 100)
                  : null;

                return (
                  <div
                    key={idx}
                    className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <FileText className="h-4 w-4 shrink-0 text-indigo-400" />
                        <span className="font-semibold text-xs text-slate-200 truncate">
                          {match.fileName || "Document"}
                        </span>
                        {match.pageNumber != null && (
                          <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
                            Page {match.pageNumber}
                          </span>
                        )}
                        {match.chunkIndex != null && (
                          <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-cyan-300 font-mono">
                            Chunk #{match.chunkIndex}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        {matchScore != null && (
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] text-slate-400">Score:</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                                matchScore >= 80
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : matchScore >= 50
                                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {matchScore}% Match
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() => handleCopy(idx, match.snippet || "")}
                          className="rounded p-1 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Copy snippet"
                        >
                          {copiedIndex === idx ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Snippet Content */}
                    <p className="mt-3 text-xs leading-relaxed text-slate-300 line-clamp-4 font-sans selection:bg-indigo-500/40">
                      {match.snippet}
                    </p>

                    {/* Actions on match */}
                    <div className="mt-3 pt-2 flex items-center justify-between text-xs">
                      <button
                        onClick={() => onOpenCitation(match)}
                        className="flex items-center space-x-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Inspect Full Passage & Metadata</span>
                      </button>

                      <button
                        onClick={() =>
                          onSendToChat(
                            `Analyze this clause/fact extracted from ${match.fileName} (Page ${match.pageNumber}):\n\n"${match.snippet}"\n\nExplain its implications and potential legal or business risks.`
                          )
                        }
                        className="flex items-center space-x-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/40 px-3 py-1 text-[11px] font-medium text-indigo-200 hover:bg-indigo-600/50 transition-colors"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>Ask DocMind About This</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
