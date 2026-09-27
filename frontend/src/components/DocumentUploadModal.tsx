"use client";

import React, { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  FileCheck,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "@/lib/api";
import { DocumentResponse } from "@/types";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

interface QueuedFile {
  id: string;
  file: File;
  status: "idle" | "uploading" | "success" | "error";
  error?: string;
  chunksCreated?: number;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const acceptedExtensions = [".pdf", ".docx", ".txt", ".md", ".csv"];

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setBatchError(null);
    const newItems: QueuedFile[] = [];

    Array.from(files).forEach((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!acceptedExtensions.includes(ext)) {
        setBatchError(`Skipped "${file.name}": Unsupported format. DocMind supports PDF, DOCX, TXT, MD, and CSV.`);
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setBatchError(`Skipped "${file.name}": File size exceeds the 25MB limit.`);
        return;
      }
      newItems.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        status: "idle",
      });
    });

    setQueuedFiles((prev) => [...prev, ...newItems]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const startUpload = async () => {
    const pending = queuedFiles.filter((f) => f.status === "idle" || f.status === "error");
    if (pending.length === 0) return;

    setIsProcessingBatch(true);
    setBatchError(null);

    try {
      if (pending.length === 1) {
        // Use single upload endpoint
        const target = pending[0];
        setQueuedFiles((prev) =>
          prev.map((f) => (f.id === target.id ? { ...f, status: "uploading" } : f))
        );

        try {
          const res = await api.uploadSingleDocument(target.file);
          setQueuedFiles((prev) =>
            prev.map((f) =>
              f.id === target.id
                ? {
                    ...f,
                    status: "success",
                    chunksCreated: res.chunksCreated ?? 0,
                  }
                : f
            )
          );
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
          onUploadSuccess();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Upload error";
          setQueuedFiles((prev) =>
            prev.map((f) => (f.id === target.id ? { ...f, status: "error", error: msg } : f))
          );
          setBatchError(msg);
        }
      } else {
        // Use multiple upload endpoint
        setQueuedFiles((prev) =>
          prev.map((f) => (pending.some((p) => p.id === f.id) ? { ...f, status: "uploading" } : f))
        );

        try {
          const results = await api.uploadMultipleDocuments(pending.map((p) => p.file));
          setQueuedFiles((prev) =>
            prev.map((f) => {
              const matched = results.find((r) => r.fileName === f.file.name);
              if (matched) {
                return {
                  ...f,
                  status: "success",
                  chunksCreated: matched.chunksCreated ?? 0,
                };
              }
              return { ...f, status: "success" };
            })
          );
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
          onUploadSuccess();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Batch upload error";
          setBatchError(msg);
          setQueuedFiles((prev) =>
            prev.map((f) =>
              f.status === "uploading" ? { ...f, status: "error", error: msg } : f
            )
          );
        }
      }
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const hasSuccessfulUploads = queuedFiles.some((f) => f.status === "success");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0b1120] p-6 shadow-2xl shadow-indigo-950/40">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
                <span>Upload & Ingest Documents</span>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                  Single / Multiple
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Documents are parsed, chunked, and embedded into pgvector via Gemini.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-indigo-400 bg-indigo-500/10 scale-[0.99]"
              : "border-slate-700/80 bg-slate-900/50 hover:border-indigo-500/50 hover:bg-slate-900/80"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".pdf,.docx,.txt,.md,.csv"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-slate-200">
            Drag & drop files here, or <span className="text-indigo-400 underline">browse</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Supports PDF, DOCX, TXT, MD, CSV (Max 25MB each)
          </p>
        </div>

        {/* Batch Error Notice */}
        {batchError && (
          <div className="mt-4 flex items-center space-x-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{batchError}</span>
          </div>
        )}

        {/* Selected Files Queue */}
        {queuedFiles.length > 0 && (
          <div className="mt-4 max-h-56 overflow-y-auto space-y-2 pr-1">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
              <span>Selected Files ({queuedFiles.length})</span>
              <button
                onClick={() => setQueuedFiles([])}
                className="text-[11px] text-slate-400 hover:text-slate-200"
              >
                Clear all
              </button>
            </div>
            {queuedFiles.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 p-2.5 text-xs"
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <FileText className="h-4 w-4 shrink-0 text-indigo-400" />
                  <div className="truncate">
                    <p className="truncate font-medium text-slate-200">{item.file.name}</p>
                    <p className="text-[10px] text-slate-400">{formatFileSize(item.file.size)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {item.status === "idle" && (
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                      Ready
                    </span>
                  )}
                  {item.status === "uploading" && (
                    <span className="flex items-center space-x-1 text-indigo-400 text-[10px]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Ingesting & Embedding...</span>
                    </span>
                  )}
                  {item.status === "success" && (
                    <span className="flex items-center space-x-1 text-emerald-400 text-[10px] font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>
                        Indexed ({item.chunksCreated !== undefined ? `${item.chunksCreated} chunks` : "Done"})
                      </span>
                    </span>
                  )}
                  {item.status === "error" && (
                    <span
                      title={item.error}
                      className="flex items-center space-x-1 text-rose-400 text-[10px]"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Failed</span>
                    </span>
                  )}

                  {item.status !== "uploading" && (
                    <button
                      onClick={() => removeFile(item.id)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800">
          <p className="text-[11px] text-slate-400">
            Vector embeddings generated using Gemini 3072D Cosine similarity.
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              {hasSuccessfulUploads ? "Done" : "Cancel"}
            </button>
            <button
              onClick={startUpload}
              disabled={
                isProcessingBatch ||
                queuedFiles.filter((f) => f.status === "idle" || f.status === "error").length === 0
              }
              className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isProcessingBatch ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Start Indexing</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
