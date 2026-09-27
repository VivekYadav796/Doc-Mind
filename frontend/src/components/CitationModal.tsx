"use client";

import React, { useState } from "react";
import { X, Copy, Check, FileText, Layers, Percent, Info } from "lucide-react";
import { Citation } from "@/types";

interface CitationModalProps {
  citation: Citation | null;
  onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ citation, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!citation) return null;

  const handleCopy = () => {
    if (citation.snippet) {
      navigator.clipboard.writeText(citation.snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const similarityPercent = citation.similarityScore != null
    ? Math.round(citation.similarityScore * 100)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0b1120] p-6 shadow-2xl shadow-indigo-950/40">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 truncate max-w-sm sm:max-w-md">
                {citation.fileName || "Source Citation"}
              </h3>
              <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-400">
                {citation.pageNumber != null && (
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                    Page {citation.pageNumber}
                  </span>
                )}
                {citation.chunkIndex != null && (
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300">
                    Chunk #{citation.chunkIndex}
                  </span>
                )}
                {similarityPercent != null && (
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-emerald-300 font-medium">
                    {similarityPercent}% Similarity
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Snippet Content */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>Extracted Source Passage</span>
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy Passage</span>
                </>
              )}
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-950/80 p-4 text-xs leading-relaxed text-slate-200 whitespace-pre-wrap font-sans selection:bg-indigo-500/40">
            {citation.snippet || "No text available for this chunk."}
          </div>
        </div>

        {/* Metadata info */}
        {citation.metadata && Object.keys(citation.metadata).length > 0 && (
          <div className="mt-4">
            <span className="text-[11px] font-medium text-slate-400 flex items-center space-x-1 mb-1.5">
              <Info className="h-3 w-3" />
              <span>Vector Metadata</span>
            </span>
            <div className="max-h-24 overflow-y-auto rounded-lg bg-slate-900/60 p-2 text-[10px] font-mono text-slate-400 border border-slate-800/60">
              <pre>{JSON.stringify(citation.metadata, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
