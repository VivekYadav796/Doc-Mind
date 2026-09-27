"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  FileText,
  Search,
  Hash,
  Database,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
  Info,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
} from "lucide-react";
import { DocumentChunk, DocumentMetadata } from "@/types";
import { api } from "@/lib/api";

interface ChunkInspectorViewProps {
  documents: DocumentMetadata[];
  selectedDocId: string | null;
  setSelectedDocId: (id: string | null) => void;
  onSendToChat: (prompt: string) => void;
}

export const ChunkInspectorView: React.FC<ChunkInspectorViewProps> = ({
  documents,
  selectedDocId,
  setSelectedDocId,
  onSendToChat,
}) => {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [filterPage, setFilterPage] = useState<string>("all");
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);
  const [expandedChunkIds, setExpandedChunkIds] = useState<Set<string>>(new Set());

  // Default to first document if none selected
  const activeDocId = selectedDocId || (documents.length > 0 ? documents[0].id : null);
  const currentDoc = documents.find((d) => d.id === activeDocId);

  const fetchChunks = async (docId: string) => {
    setIsLoading(true);
    try {
      const data = await api.getDocumentChunks(docId);
      setChunks(data);
    } catch (err: unknown) {
      console.error("Failed to load chunks:", err);
      setChunks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeDocId) {
      fetchChunks(activeDocId);
    } else {
      setChunks([]);
    }
  }, [activeDocId]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChunkId(id);
    setTimeout(() => setCopiedChunkId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedChunkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Extract unique pages from chunks
  const uniquePages = Array.from(
    new Set(chunks.map((c) => c.pageNumber).filter((p): p is number => p != null))
  ).sort((a, b) => a - b);

  // Filter chunks by keyword and page
  const filteredChunks = chunks.filter((chunk) => {
    const matchesText =
      !filterText || chunk.snippet.toLowerCase().includes(filterText.toLowerCase());
    const matchesPage =
      filterPage === "all" || String(chunk.pageNumber) === filterPage;
    return matchesText && matchesPage;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-indigo-950/20 p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-1.5 text-cyan-400">
                <Layers className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold text-slate-100">
                Vector Chunk Inspector & Token Visualizer
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400 max-w-xl">
              Inspect how documents are split by TokenTextSplitter (chunk size: 700 tokens) and
              stored with 3072-dimensional Gemini embeddings in PgVector.
            </p>
          </div>

          {/* Document Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Document:</span>
            <select
              value={activeDocId || ""}
              onChange={(e) => {
                setSelectedDocId(e.target.value);
              }}
              className="h-9 max-w-xs rounded-xl border border-slate-700/80 bg-slate-950 px-3 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              {documents.length === 0 ? (
                <option value="">No documents uploaded</option>
              ) : (
                documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    📄 {d.filename} ({d.totalChunks ?? 0} chunks)
                  </option>
                ))
              )}
            </select>

            {activeDocId && (
              <button
                onClick={() => fetchChunks(activeDocId)}
                disabled={isLoading}
                className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-slate-200 disabled:opacity-50 transition-colors"
                title="Reload chunks"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
              </button>
            )}
          </div>
        </div>

        {/* Technical Specs Cards */}
        {currentDoc && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Total Chunks
              </span>
              <p className="text-lg font-bold text-slate-100 mt-0.5">
                {chunks.length || currentDoc.totalChunks || 0}
              </p>
              <p className="text-[10px] text-slate-500">Indexed vectors</p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Splitter Size
              </span>
              <p className="text-lg font-bold text-indigo-400 mt-0.5">700 tokens</p>
              <p className="text-[10px] text-slate-500">TokenTextSplitter</p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Embedding Model
              </span>
              <p className="text-lg font-bold text-cyan-400 mt-0.5">3,072 Dims</p>
              <p className="text-[10px] text-slate-500">gemini-embedding-001</p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Storage Table
              </span>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">vector_store</p>
              <p className="text-[10px] text-slate-500">PostgreSQL pgvector</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter and In-Document Search */}
      {chunks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search keyword inside chunks..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-8 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {uniquePages.length > 0 && (
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <span>Filter Page:</span>
                <select
                  value={filterPage}
                  onChange={(e) => setFilterPage(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="all">All Pages</option>
                  {uniquePages.map((p) => (
                    <option key={p} value={String(p)}>
                      Page {p}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <span className="text-xs text-slate-400 font-mono">
              Showing {filteredChunks.length} of {chunks.length} chunks
            </span>
          </div>
        </div>
      )}

      {/* Chunks List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-2" />
          <p className="text-xs text-slate-400">Loading vector chunks from PostgreSQL...</p>
        </div>
      ) : chunks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <Layers className="mx-auto h-10 w-10 text-slate-500 mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No Vector Chunks Available</h3>
          <p className="mt-1 max-w-sm mx-auto text-xs text-slate-400">
            {documents.length === 0
              ? "Please upload a document first to see its vector chunks."
              : "No chunks found for the selected document. The file might still be indexing."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredChunks.map((chunk, idx) => {
            const isExpanded = expandedChunkIds.has(chunk.id || String(idx));
            const charCount = chunk.snippet?.length || 0;
            const estimatedTokens = Math.round(charCount / 4);

            return (
              <div
                key={chunk.id || idx}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-cyan-500/40 hover:bg-slate-900/90 transition-all"
              >
                {/* Chunk Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-300 font-mono">
                      Chunk #{chunk.chunkIndex ?? idx}
                    </span>
                    {chunk.pageNumber != null && (
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 font-medium">
                        Page {chunk.pageNumber}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 font-mono">
                      {charCount} chars &bull; ~{estimatedTokens} tokens
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopy(chunk.id || String(idx), chunk.snippet)}
                      className="flex items-center space-x-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                      title="Copy chunk text"
                    >
                      {copiedChunkId === (chunk.id || String(idx)) ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        onSendToChat(
                          `Analyze Chunk #${chunk.chunkIndex ?? idx} from ${currentDoc?.filename || "document"} (Page ${chunk.pageNumber}):\n\n"${chunk.snippet}"\n\nExplain key obligations and takeaways.`
                        )
                      }
                      className="flex items-center space-x-1 rounded bg-indigo-600/30 border border-indigo-500/30 px-2 py-1 text-[11px] font-medium text-indigo-300 hover:bg-indigo-600/50 transition-colors"
                      title="Send this chunk to chat"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>Ask AI</span>
                    </button>

                    <button
                      onClick={() => toggleExpand(chunk.id || String(idx))}
                      className="rounded bg-slate-800 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                      title={isExpanded ? "Collapse" : "Expand full"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Chunk Content */}
                <div className="mt-3">
                  <p
                    className={`text-xs leading-relaxed text-slate-200 font-sans selection:bg-cyan-500/30 whitespace-pre-wrap ${
                      isExpanded ? "" : "line-clamp-4"
                    }`}
                  >
                    {chunk.snippet}
                  </p>
                  {!isExpanded && charCount > 300 && (
                    <button
                      onClick={() => toggleExpand(chunk.id || String(idx))}
                      className="mt-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300"
                    >
                      Show more &darr;
                    </button>
                  )}
                </div>

                {/* Metadata JSON tags */}
                {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-400">
                    {Object.entries(chunk.metadata).map(([key, val]) => {
                      if (val == null || typeof val === "object") return null;
                      return (
                        <span
                          key={key}
                          className="rounded bg-slate-950/80 px-2 py-0.5 border border-slate-800/80"
                        >
                          <span className="text-slate-500">{key}:</span> {String(val)}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
