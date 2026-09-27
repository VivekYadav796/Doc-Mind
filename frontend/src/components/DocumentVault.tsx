"use client";

import React, { useState } from "react";
import {
  FileText,
  Trash2,
  MessageSquare,
  Search,
  Layers,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  HardDrive,
  Calendar,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { DocumentMetadata } from "@/types";
import { api } from "@/lib/api";

interface DocumentVaultProps {
  documents: DocumentMetadata[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectDocForChat: (id: string) => void;
  onSelectDocForSearch: (id: string) => void;
  onSelectDocForChunks: (id: string) => void;
  onOpenUploadModal: () => void;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({
  documents,
  isLoading,
  onRefresh,
  onSelectDocForChat,
  onSelectDocForSearch,
  onSelectDocForChunks,
  onOpenUploadModal,
}) => {
  const [searchFilter, setSearchFilter] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteDocument(id);
      onRefresh();
    } catch (err: unknown) {
      alert("Failed to delete document: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const totalChunksCount = documents.reduce((sum, d) => sum + (d.totalChunks ?? 0), 0);
  const totalSizeBytes = documents.reduce((sum, d) => sum + (d.fileSize || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Ingested Documents</span>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-100">{documents.length}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Indexed in vector knowledge base</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Vector Chunks</span>
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-100">{totalChunksCount}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Stored in PostgreSQL pgvector</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Indexed Size</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-100">{formatBytes(totalSizeBytes)}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">PDF, DOCX, TXT, MD, CSV files</p>
        </div>
      </div>

      {/* Action Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by name..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onOpenUploadModal}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-cyan-600 active:scale-95 transition-all cursor-pointer"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Documents</span>
          </button>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">
            {searchFilter ? "No matching documents found" : "No documents in your vault yet"}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-400">
            {searchFilter
              ? "Try changing your search keywords."
              : "Upload single or multiple PDF, DOCX, TXT, or CSV files to begin asking questions and extracting clauses."}
          </p>
          {!searchFilter && (
            <button
              onClick={onOpenUploadModal}
              className="mt-4 flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload Your First Document</span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Document Name</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Chunks</th>
                  <th className="px-5 py-3.5">File Size</th>
                  <th className="px-5 py-3.5">Uploaded At</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredDocs.map((doc) => {
                  const isDeleting = deletingId === doc.id;
                  const isConfirming = deleteConfirmId === doc.id;

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="max-w-[240px] sm:max-w-xs truncate">
                            <p
                              className="font-medium text-slate-100 truncate cursor-pointer hover:text-indigo-300"
                              title={doc.filename}
                              onClick={() => onSelectDocForChat(doc.id)}
                            >
                              {doc.filename}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ID: {doc.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {doc.status === "INDEXED" && (
                          <span className="inline-flex items-center space-x-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Indexed</span>
                          </span>
                        )}
                        {doc.status === "UPLOADING" && (
                          <span className="inline-flex items-center space-x-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-medium text-indigo-300">
                            <Clock className="h-3 w-3 animate-spin" />
                            <span>Processing</span>
                          </span>
                        )}
                        {doc.status === "FAILED" && (
                          <span
                            title={doc.errorMessage || "Indexing failed"}
                            className="inline-flex items-center space-x-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-300"
                          >
                            <AlertCircle className="h-3 w-3" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>

                      {/* Chunks */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => onSelectDocForChunks(doc.id)}
                          className="flex items-center space-x-1 rounded-md bg-slate-800/80 px-2 py-1 text-slate-300 hover:bg-indigo-600/30 hover:text-indigo-300 transition-colors"
                          title="Click to inspect chunks"
                        >
                          <Layers className="h-3 w-3 text-cyan-400" />
                          <span className="font-semibold text-slate-200">
                            {doc.totalChunks ?? 0}
                          </span>
                          <span className="text-[10px] text-slate-400">chunks</span>
                        </button>
                      </td>

                      {/* Size */}
                      <td className="px-5 py-4 text-slate-400 font-mono">
                        {formatBytes(doc.fileSize)}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-slate-400">
                        {formatDate(doc.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onSelectDocForChat(doc.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors"
                            title="Chat with this document"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => onSelectDocForSearch(doc.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors"
                            title="Search clauses in this document"
                          >
                            <Search className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => onSelectDocForChunks(doc.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-purple-500/20 hover:text-purple-300 transition-colors"
                            title="Inspect vector chunks"
                          >
                            <Layers className="h-4 w-4" />
                          </button>

                          {/* Delete Action with inline confirm */}
                          {isConfirming ? (
                            <div className="flex items-center space-x-1 bg-rose-950/80 border border-rose-500/40 rounded-lg p-1">
                              <span className="text-[10px] text-rose-300 font-semibold px-1">
                                Delete?
                              </span>
                              <button
                                onClick={() => handleDelete(doc.id)}
                                disabled={isDeleting}
                                className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-500"
                              >
                                {isDeleting ? "..." : "Yes"}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(doc.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                              title="Delete document and purge vectors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
