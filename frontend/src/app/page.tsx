"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { DocumentVault } from "@/components/DocumentVault";
import { ChatArea } from "@/components/ChatArea";
import { SearchClauseFactView } from "@/components/SearchClauseFactView";
import { ChunkInspectorView } from "@/components/ChunkInspectorView";
import { DocumentUploadModal } from "@/components/DocumentUploadModal";
import { FeatureTemplateModal } from "@/components/FeatureTemplateModal";
import { CitationModal } from "@/components/CitationModal";
import { Citation, DocumentMetadata, Template } from "@/types";
import { api } from "@/lib/api";
import {
  BrainCircuit,
  MessageSquare,
  FolderOpen,
  Search,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "vault" | "search" | "chunks">("chat");
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [inspectingCitation, setInspectingCitation] = useState<Citation | null>(null);

  // Prompt to pass to Chat when user selects a template or searches
  const [pendingPromptForChat, setPendingPromptForChat] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await api.getAllDocuments();
      setDocuments(docs);
      setIsBackendOnline(true);
    } catch (err) {
      console.warn("Could not fetch documents:", err);
      setIsBackendOnline(false);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  // Check health and load documents on mount and periodically
  useEffect(() => {
    loadDocuments();
    const interval = setInterval(async () => {
      const online = await api.checkHealth();
      setIsBackendOnline(online);
    }, 15000);
    return () => clearInterval(interval);
  }, [loadDocuments]);

  const handleSelectTemplate = (template: Template) => {
    setPendingPromptForChat(template.prompt);
    setActiveTab("chat");
  };

  const handleSendPromptToChat = (prompt: string) => {
    setPendingPromptForChat(prompt);
    setActiveTab("chat");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        documents={documents}
        selectedDocId={selectedDocId}
        setSelectedDocId={setSelectedDocId}
        isBackendOnline={isBackendOnline}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Offline / Setup Helper Banner (only if backend is offline) */}
        {!isBackendOnline && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="flex h-3 w-3 shrink-0 rounded-full bg-amber-400 animate-pulse" />
              <div>
                <p className="font-semibold text-amber-100">
                  Backend connection pending (Listening on port 8888)
                </p>
                <p className="text-amber-300/80 text-[11px] mt-0.5">
                  Make sure Docker PostgreSQL (port 5434) and Spring Boot application are running.
                </p>
              </div>
            </div>
            <button
              onClick={loadDocuments}
              className="shrink-0 rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 font-medium text-amber-200 hover:bg-amber-500/30 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Tab 1: Chat Assistant */}
        {activeTab === "chat" && (
          <ChatArea
            documents={documents}
            selectedDocId={selectedDocId}
            setSelectedDocId={setSelectedDocId}
            onOpenTemplates={() => setIsTemplateModalOpen(true)}
            onOpenCitation={(citation) => setInspectingCitation(citation)}
            pendingPrompt={pendingPromptForChat}
            onClearPendingPrompt={() => setPendingPromptForChat(null)}
          />
        )}

        {/* Tab 2: Document Vault */}
        {activeTab === "vault" && (
          <DocumentVault
            documents={documents}
            isLoading={isLoadingDocs}
            onRefresh={loadDocuments}
            onSelectDocForChat={(id) => {
              setSelectedDocId(id);
              setActiveTab("chat");
            }}
            onSelectDocForSearch={(id) => {
              setSelectedDocId(id);
              setActiveTab("search");
            }}
            onSelectDocForChunks={(id) => {
              setSelectedDocId(id);
              setActiveTab("chunks");
            }}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
          />
        )}

        {/* Tab 3: Clause & Fact Search */}
        {activeTab === "search" && (
          <SearchClauseFactView
            documents={documents}
            selectedDocId={selectedDocId}
            setSelectedDocId={setSelectedDocId}
            onOpenCitation={(citation) => setInspectingCitation(citation)}
            onSendToChat={handleSendPromptToChat}
          />
        )}

        {/* Tab 4: Vector Chunks Inspector */}
        {activeTab === "chunks" && (
          <ChunkInspectorView
            documents={documents}
            selectedDocId={selectedDocId}
            setSelectedDocId={setSelectedDocId}
            onSendToChat={handleSendPromptToChat}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 gap-2">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">DocMind AI RAG Platform</span>
            <span>&bull;</span>
            <span className="text-[11px] text-slate-400">Next.js + Tailwind CSS + Spring AI</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span className="flex items-center space-x-1 text-slate-400">
              <Zap className="h-3 w-3 text-cyan-400" />
              <span>Gemini 2.5 Flash + PgVector</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center space-x-1 text-slate-400">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>3072D Vector Embeddings</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => {
          loadDocuments();
        }}
      />

      {/* Feature Template Modal */}
      <FeatureTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Citation / Snippet Inspector Modal */}
      <CitationModal
        citation={inspectingCitation}
        onClose={() => setInspectingCitation(null)}
      />
    </div>
  );
}
