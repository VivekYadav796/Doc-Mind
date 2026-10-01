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

<img width="3170" height="1596" alt="docmind_rag_workflow" src="https://github.com/user-attachments/assets/f09be016-456e-44cb-89ad-894af3fb7837" />


<img width="1920" height="901" alt="screencapture-localhost-3000-2026-09-27-19_03_17" src="https://github.com/user-attachments/assets/6eafc603-c8f7-490c-b226-d13bc4ef2fc5" />

   
<img width="1920" height="868" alt="screencapture-localhost-3000-2026-09-27-19_03_31" src="https://github.com/user-attachments/assets/68273300-21c6-4a8d-b839-da854d785510" />


<img width="1920" height="1153" alt="screencapture-localhost-3000-2026-09-27-19_04_22" src="https://github.com/user-attachments/assets/424c6504-4314-4c7f-9710-03918fd56c7a" />


<img width="1920" height="2676" alt="screencapture-localhost-3000-2026-09-27-19_04_43" src="https://github.com/user-attachments/assets/af9e36b0-c80f-4e89-aef9-6f6ff88d52ca" />


<img width="1920" height="4511" alt="screencapture-localhost-3000-2026-09-27-19_05_00" src="https://github.com/user-attachments/assets/cd45fa69-66fe-4328-bcbe-837cc33aa4c2" />

