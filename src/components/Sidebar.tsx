import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Layers,
  Award,
  MessageSquare,
  GitGraph,
  Share2,
  CalendarRange,
  TrendingUp,
  Video,
  DownloadCloud,
} from "lucide-react";

import { useLanguage, SUPPORTED_LANGUAGES } from "../context/LanguageContext";
import { TRANSLATIONS } from "../translations";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  noteSelected: boolean;
}

export default function Sidebar({ activeTab, setActiveTab, noteSelected }: SidebarProps) {
  const { selectedLanguage } = useLanguage();
  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.English;

  const menuItems = [
    { id: "dashboard", label: t.dashboard, icon: LayoutDashboard, requiresNote: false },
    { id: "analytics", label: t.settings, icon: TrendingUp, requiresNote: false },
    { id: "upload", label: t.uploadButton, icon: UploadCloud, requiresNote: false },
    { id: "summary", label: selectedLanguage === "English" ? "AI Summaries" : t.studyNotes, icon: FileText, requiresNote: true },
    { id: "flashcards", label: t.flashcards, icon: Layers, requiresNote: true },
    { id: "planner", label: t.roadmap, icon: CalendarRange, requiresNote: true },
    { id: "videos", label: selectedLanguage === "English" ? "AI Animated Lectures" : t.presentation, icon: Video, requiresNote: true },
    { id: "quiz", label: t.quiz, icon: Award, requiresNote: true },
    { id: "tutor", label: t.aiTutor, icon: MessageSquare, requiresNote: true },
    { id: "mindmap", label: t.mindMap, icon: GitGraph, requiresNote: true },
    { id: "flowchart", label: t.flowchart, icon: Share2, requiresNote: true },
    { id: "export", label: selectedLanguage === "English" ? "AI Presentation" : t.presentation, icon: DownloadCloud, requiresNote: true },
  ];

  return (
    <aside
      id="side-bar"
      className="w-full md:w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 flex flex-col p-6 font-sans text-slate-100 z-10"
    >
      {/* Brand logo as per Immersive UI */}
      <div className="py-2 mb-6 flex items-center gap-3" id="sidebar-logo-container">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Manthan360
        </span>
      </div>

      <nav className="flex-1 space-y-2 flex flex-col" id="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const locked = item.requiresNote && !noteSelected;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`sidebar-item-${item.id}`}
              onClick={() => {
                if (!locked) {
                  setActiveTab(item.id);
                }
              }}
              disabled={locked}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left relative ${
                isActive
                  ? "bg-white/10 text-white border border-white/10 shadow-lg shadow-violet-500/5 font-semibold"
                  : locked
                  ? "opacity-40 cursor-not-allowed hover:bg-transparent text-slate-500"
                  : "hover:bg-white/5 text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-violet-400" : locked ? "text-slate-600" : "text-slate-400"}`} />
              <span className="flex-1 text-xs">{item.label}</span>
              {locked && (
                <span className="text-[9px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-full font-mono uppercase border border-white/5">
                  Lock
                </span>
              )}
              {isActive && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-8 mb-2" id="sidebar-goal-widget">
        <div className="bg-gradient-to-br from-violet-600/20 to-blue-600/20 rounded-2xl p-4 border border-violet-500/30">
          <p className="text-xs text-violet-300 font-semibold uppercase tracking-wider mb-2">Weekly Goal</p>
          <div className="h-2 bg-black/40 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">12/18 modules mastered</p>
        </div>
      </div>
    </aside>
  );
}
