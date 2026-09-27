export type DocumentStatus = "UPLOADING" | "INDEXED" | "FAILED" | "PENDING";

export interface DocumentMetadata {
  id: string;
  filename: string;
  contentType: string;
  fileSize: number;
  totalPages?: number | null;
  totalChunks?: number | null;
  status: DocumentStatus;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface DocumentResponse {
  id: string;
  fileName: string;
  fileSize: number;
  status: DocumentStatus;
  chunksCreated?: number;
  message?: string;
  userId?: number;
}

export interface Citation {
  documentId?: string;
  fileName?: string;
  chunkIndex?: number;
  pageNumber?: number;
  snippet?: string;
  similarityScore?: number;
  metadata?: Record<string, unknown>;
}

export interface ChatResponse {
  answer: string;
  conversationId?: string;
  citations?: Citation[];
  responseTimeMs?: number;
}

export interface ChatRequest {
  question: string;
  documentId?: string;
  topK?: number;
  minSimilarity?: number;
  conversationId?: string;
}

export interface SearchRequest {
  query: string;
  documentId?: string;
  topK?: number;
  similaritySearch?: number;
}

export interface SearchResult {
  query: string;
  totalMatches: number;
  matches: Citation[];
}

export interface DocumentChunk {
  id: string;
  documentId?: string;
  chunkIndex?: number;
  pageNumber?: number;
  snippet: string;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  responseTimeMs?: number;
  citations?: Citation[];
  isStreaming?: boolean;
  documentId?: string;
}

export interface Template {
  id: string;
  title: string;
  category: "clauses" | "facts" | "risk" | "summary" | "financial";
  badge: string;
  iconName: string;
  description: string;
  prompt: string;
  suggestedTopK?: number;
}
