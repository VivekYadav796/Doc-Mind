import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocMind | Enterprise Document Intelligence & Semantic RAG Hub",
  description:
    "AI-powered document intelligence platform. Upload documents, extract clauses & facts, chat with deep citations, and inspect vector chunks with Gemini embeddings.",
  keywords: ["DocMind", "RAG", "AI Document Assistant", "Vector Search", "Clause Search", "Document Intelligence"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#070b14] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
