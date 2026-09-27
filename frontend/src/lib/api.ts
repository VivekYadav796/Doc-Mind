import {
  ChatRequest,
  ChatResponse,
  DocumentChunk,
  DocumentMetadata,
  DocumentResponse,
  SearchRequest,
  SearchResult,
} from "@/types";

// Base URL: either direct URL or proxy route
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888";

interface ApiEnvelope<T> {
  success: boolean;
  message?: string | null;
  data: T;
  timestamp?: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.message) errorMsg = parsed.message;
      } catch {
        if (errText) errorMsg = errText;
      }
      throw new Error(errorMsg);
    }

    const envelope: ApiEnvelope<T> = await res.json();
    return envelope.data;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(String(err) || "Unknown network error");
  }
}

export const api = {
  // Check backend health
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/documents`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Document APIs
  async getAllDocuments(): Promise<DocumentMetadata[]> {
    return request<DocumentMetadata[]>("/api/v1/documents");
  },

  async getDocumentById(id: string): Promise<DocumentMetadata> {
    return request<DocumentMetadata>(`/api/v1/documents/${id}`);
  },

  async uploadSingleDocument(file: File): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${API_BASE}/api/v1/documents/upload`;
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Upload failed with status ${res.status}`);
    }

    const data: ApiEnvelope<DocumentResponse> = await res.json();
    return data.data;
  },

  async uploadMultipleDocuments(files: File[]): Promise<DocumentResponse[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    const url = `${API_BASE}/api/v1/documents/upload-multiple`;
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Multiple upload failed with status ${res.status}`);
    }

    const data: ApiEnvelope<DocumentResponse[]> = await res.json();
    return data.data;
  },

  async deleteDocument(id: string): Promise<void> {
    return request<void>(`/api/v1/documents/${id}`, {
      method: "DELETE",
    });
  },

  // Document Chunks APIs
  async getDocumentChunks(id: string): Promise<DocumentChunk[]> {
    try {
      // First attempt dedicated endpoint
      return await request<DocumentChunk[]>(`/api/v1/documents/${id}/chunks`);
    } catch {
      // Fallback: use similarity search with blank query to retrieve chunks
      const searchRes = await this.searchSimilarity({
        query: "the",
        documentId: id,
        topK: 50,
        similaritySearch: 0.0,
      });

      return (searchRes.matches || []).map((m, idx) => ({
        id: `${id}-chunk-${idx}`,
        documentId: id,
        chunkIndex: m.chunkIndex ?? idx,
        pageNumber: m.pageNumber,
        snippet: m.snippet || "",
        metadata: m.metadata,
      }));
    }
  },

  // Chat APIs
  async askQuestion(req: ChatRequest): Promise<ChatResponse> {
    return request<ChatResponse>("/api/v1/chat/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
  },

  async streamQuestion(
    req: ChatRequest,
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (err: Error) => void
  ): Promise<() => void> {
    const controller = new AbortController();
    const url = `${API_BASE}/api/v1/chat/stream`;

    (async () => {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream, text/plain",
          },
          body: JSON.stringify(req),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Streaming failed: HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // Handle SSE 'data:' prefixes if present
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data:")) {
              onToken(line.replace("data:", "").trimStart());
            } else if (line.length > 0) {
              onToken(line);
            }
          }
        }
        onDone();
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    })();

    return () => controller.abort();
  },

  // Search APIs
  async searchSimilarity(req: SearchRequest): Promise<SearchResult> {
    return request<SearchResult>("/api/v1/chat/search/similarity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
  },
};
