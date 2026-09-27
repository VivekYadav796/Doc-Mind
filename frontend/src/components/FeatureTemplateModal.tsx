"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  ShieldAlert,
  FileWarning,
  Lock,
  Scale,
  CalendarClock,
  Users,
  Coins,
  AlertTriangle,
  Briefcase,
  HelpCircle,
  ArrowRight,
  Search,
} from "lucide-react";
import { Template } from "@/types";
import { FEATURE_TEMPLATES } from "@/lib/templates";

interface FeatureTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
}

export const FeatureTemplateModal: React.FC<FeatureTemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "ShieldAlert":
        return <ShieldAlert className="h-5 w-5 text-amber-400" />;
      case "FileWarning":
        return <FileWarning className="h-5 w-5 text-rose-400" />;
      case "Lock":
        return <Lock className="h-5 w-5 text-blue-400" />;
      case "Scale":
        return <Scale className="h-5 w-5 text-indigo-400" />;
      case "CalendarClock":
        return <CalendarClock className="h-5 w-5 text-cyan-400" />;
      case "Users":
        return <Users className="h-5 w-5 text-emerald-400" />;
      case "Coins":
        return <Coins className="h-5 w-5 text-yellow-400" />;
      case "AlertTriangle":
        return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      case "Briefcase":
        return <Briefcase className="h-5 w-5 text-purple-400" />;
      case "HelpCircle":
        return <HelpCircle className="h-5 w-5 text-pink-400" />;
      default:
        return <Sparkles className="h-5 w-5 text-indigo-400" />;
    }
  };

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "clauses", label: "Key Clauses" },
    { id: "facts", label: "Fact Finder" },
    { id: "risk", label: "Risk & Compliance" },
    { id: "financial", label: "Financial & Fees" },
    { id: "summary", label: "Executive & FAQ" },
  ];

  const filteredTemplates = FEATURE_TEMPLATES.filter((tpl) => {
    const matchesCategory = selectedCategory === "all" || tpl.category === selectedCategory;
    const matchesQuery =
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[85vh] rounded-2xl border border-slate-800 bg-[#0b1120] shadow-2xl shadow-indigo-950/40">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 text-white">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Sparkles className="h-5 w-5 text-cyan-300" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Feature Analysis Templates</h2>
              <p className="text-xs text-slate-400">
                Pre-configured AI intelligence workflows for clauses, facts, compliance, and metrics.
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

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === c.id
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => {
                onSelectTemplate(template);
                onClose();
              }}
              className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-all duration-200 hover:border-indigo-500/50 hover:bg-slate-800/50 hover:shadow-lg hover:shadow-indigo-950/30 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="rounded-lg bg-slate-800/80 p-2 border border-slate-700/50 group-hover:scale-105 transition-transform">
                      {getIcon(template.iconName)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {template.title}
                      </h4>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        {template.badge}
                      </span>
                    </div>
                  </div>
                  {template.suggestedTopK && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                      Top-{template.suggestedTopK} chunks
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                  {template.description}
                </p>

                <div className="mt-3 rounded-lg bg-slate-950/60 p-2.5 text-[11px] text-slate-300 border border-slate-800/60 font-mono">
                  <p className="line-clamp-2 italic text-slate-400">&quot;{template.prompt}&quot;</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end text-xs font-semibold text-indigo-400 group-hover:text-cyan-300 transition-colors">
                <span className="mr-1">Use Template</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
