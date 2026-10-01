# DocMind – AI-Powered Document Intelligence Platform

DocMind is a full-stack Retrieval-Augmented Generation (RAG) application that lets users upload documents and ask natural-language questions about their content. It retrieves the most relevant chunks from your documents and uses an LLM to generate grounded, context-aware answers.

## Features

- 📄 **Document Upload** — Upload documents for processing and semantic indexing
- 🔍 **Semantic Search** — Documents are chunked, embedded, and stored in PGVector for similarity-based retrieval
- 💬 **Natural-Language Q&A** — Ask questions in plain English and get answers grounded in your uploaded content
- 🤖 **LLM-Powered Responses** — Integrated with Spring AI + Gemini 3.8 model to generate context-aware answers from retrieved chunks
- 🔐 **[multi-document support]** 
- 🐳 **Dockerized Setup** — Spin up the full stack (app + PostgreSQL/PGVector) with a single command

## Tech Stack

| Backend -> Java, Spring Boot, Spring AI |
| Frontend -> Next.js , Tailwind CSS |
| Database | PostgreSQL + PGVector |
| LLM / Embeddings |  Gemini flash 3.8 model , text-embedding-3-small] |
| Containerization | Docker, Docker Compose |
