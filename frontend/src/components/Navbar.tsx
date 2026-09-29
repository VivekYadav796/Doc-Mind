"use client";

import React from "react";
import {
  BrainCircuit,
  MessageSquare,
  FolderOpen,
  Search,
  Layers,
  UploadCloud,
  FileText,
} from "lucide-react";
import { DocumentMetadata } from "@/types";

interface NavbarProps {
  activeTab: "chat" | "vault" | "search" | "chunks";
  setActiveTab: (tab: "chat" | "vault" | "search" | "chunks") => void;
  documents: DocumentMetadata[];
  selectedDocId: string | null;
  setSelectedDocId: (id: string | null) => void;
  isBackendOnline: boolean;
  onOpenUploadModal: () => void;
}

type Tab = NavbarProps["activeTab"];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  documents,
  selectedDocId,
  setSelectedDocId,
  isBackendOnline,
  onOpenUploadModal,
}) => {
  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  const tabs: { id: Tab; label: string; short: string; Icon: React.ElementType }[] = [
    { id: "chat", label: "Chat & Q&A", short: "Chat", Icon: MessageSquare },
    { id: "vault", label: "Document Vault", short: `Docs (${documents.length})`, Icon: FolderOpen },
    { id: "search", label: "Clause & Fact Search", short: "Search", Icon: Search },
    { id: "chunks", label: "Vector Chunks", short: "Chunks", Icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/70 bg-[#070b14]/80 backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 opacity-40 blur-md" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#070b14]/70">
                <BrainCircuit className="h-5 w-5 text-cyan-300" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-gradient-to-r from-white via-indigo-100 to-cyan-200 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                DocMind
              </span>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                AI Hub
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-400 sm:block">Enterprise Document RAG &amp; Clause Intelligence</p>
          </div>
        </div>

        {/* Tabs */}
        <nav className="hidden items-center space-x-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-1 shadow-inner shadow-black/30 backdrop-blur-md md:flex">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex cursor-pointer items-center space-x-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${activeTab === id
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
              {id === "vault" && documents.length > 0 && (
                <span className="ml-1 rounded-full bg-black/30 px-1.5 text-[10px] font-mono text-slate-200">
                  {documents.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center space-x-3">
          <div className="hidden items-center space-x-1.5 lg:flex">
            <span className="text-[11px] text-slate-400">Context:</span>
            <div className="relative">
              <select
                value={selectedDocId || "all"}
                onChange={(e) => setSelectedDocId(e.target.value === "all" ? null : e.target.value)}
                title={selectedDoc?.filename}
                className="h-8 max-w-[190px] cursor-pointer truncate rounded-lg border border-slate-700/80 bg-slate-900/90 pl-7 pr-3 text-xs text-slate-200 transition-colors hover:border-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">🌐 All Ingested Documents</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    📄 {doc.filename} ({doc.totalChunks ?? 0} chunks)
                  </option>
                ))}
              </select>
              <FileText className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-indigo-400" />
            </div>
          </div>

          <div
            title={isBackendOnline ? "Backend connected (Port 8888)" : "Backend offline or unreachable"}
            className="flex items-center space-x-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300"
          >
            <span className="relative flex h-2 w-2">
              {isBackendOnline && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${isBackendOnline ? "bg-emerald-500" : "animate-pulse bg-rose-500"}`} />
            </span>
            <span className="hidden sm:inline">{isBackendOnline ? "Spring RAG Online" : "Backend Offline"}</span>
          </div>

          <button
            onClick={onOpenUploadModal}
            className="flex cursor-pointer items-center space-x-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-400 hover:to-cyan-400 hover:shadow-indigo-500/50 active:scale-95"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex justify-around border-t border-slate-800/80 bg-slate-950/80 px-2 py-1 md:hidden">
        {tabs.map(({ id, short, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center px-3 py-1 text-[10px] ${activeTab === id ? "font-semibold text-indigo-400" : "text-slate-400"
              }`}
          >
            <Icon className="mb-0.5 h-4 w-4" />
            <span>{short}</span>
          </button>
        ))}
      </div>
    </header>
  );
};