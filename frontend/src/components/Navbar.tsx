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
  Activity,
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/25">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#070b14]/60 backdrop-blur-sm">
              <BrainCircuit className="h-5 w-5 text-cyan-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                DocMind
              </span>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-indigo-300 uppercase">
                AI Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Enterprise Document RAG & Clause Intelligence</p>
          </div>
        </div>

        {/* Center Tabs Navigation */}
        <nav className="hidden md:flex items-center space-x-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "chat"
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chat & Q&A</span>
          </button>

          <button
            onClick={() => setActiveTab("vault")}
            className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "vault"
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span>Document Vault</span>
            {documents.length > 0 && (
              <span className="ml-1 rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300 font-mono">
                {documents.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("search")}
            className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "search"
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Clause & Fact Search</span>
          </button>

          <button
            onClick={() => setActiveTab("chunks")}
            className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "chunks"
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Vector Chunks</span>
          </button>
        </nav>

        {/* Right Section: Document Scope Selector & Backend Status */}
        <div className="flex items-center space-x-3">
          {/* Active Scoped Document Selector */}
          <div className="hidden lg:flex items-center space-x-1.5">
            <span className="text-[11px] text-slate-400">Context:</span>
            <div className="relative">
              <select
                value={selectedDocId || "all"}
                onChange={(e) => setSelectedDocId(e.target.value === "all" ? null : e.target.value)}
                className="h-8 max-w-[190px] truncate rounded-lg border border-slate-700/80 bg-slate-900/90 pl-7 pr-3 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
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

          {/* Backend Health Status Pill */}
          <div
            title={isBackendOnline ? "Backend connected (Port 8888)" : "Backend offline or unreachable"}
            className="flex items-center space-x-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-400"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isBackendOnline ? "bg-emerald-500 shadow-sm shadow-emerald-500" : "bg-rose-500 animate-pulse"
              }`}
            />
            <span className="hidden sm:inline">{isBackendOnline ? "Spring RAG Online" : "Backend Offline"}</span>
          </div>

          {/* Upload Button */}
          <button
            onClick={onOpenUploadModal}
            className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-cyan-600 active:scale-95 transition-all cursor-pointer"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden border-t border-slate-800/80 bg-slate-950/80 px-2 py-1 justify-around">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex flex-col items-center py-1 text-[10px] ${
            activeTab === "chat" ? "text-indigo-400 font-semibold" : "text-slate-400"
          }`}
        >
          <MessageSquare className="h-4 w-4 mb-0.5" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => setActiveTab("vault")}
          className={`flex flex-col items-center py-1 text-[10px] ${
            activeTab === "vault" ? "text-indigo-400 font-semibold" : "text-slate-400"
          }`}
        >
          <FolderOpen className="h-4 w-4 mb-0.5" />
          <span>Docs ({documents.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`flex flex-col items-center py-1 text-[10px] ${
            activeTab === "search" ? "text-indigo-400 font-semibold" : "text-slate-400"
          }`}
        >
          <Search className="h-4 w-4 mb-0.5" />
          <span>Search</span>
        </button>
        <button
          onClick={() => setActiveTab("chunks")}
          className={`flex flex-col items-center py-1 text-[10px] ${
            activeTab === "chunks" ? "text-indigo-400 font-semibold" : "text-slate-400"
          }`}
        >
          <Layers className="h-4 w-4 mb-0.5" />
          <span>Chunks</span>
        </button>
      </div>
    </header>
  );
};
