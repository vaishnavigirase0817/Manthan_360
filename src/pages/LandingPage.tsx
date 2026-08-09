import React, { useState } from "react";
import { 
  Sparkles, 
  GraduationCap, 
  Globe, 
  FileText, 
  LayoutGrid, 
  HelpCircle, 
  GitBranch, 
  Workflow, 
  Calendar, 
  MessageSquare, 
  Video, 
  Presentation, 
  ChevronRight, 
  CheckCircle2, 
  Flame, 
  TrendingUp, 
  BookOpen, 
  ArrowRight,
  Github,
  Mail,
  Shield,
  Layers,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { loginWithGoogle } from "../services/firebase";

interface LandingPageProps {
  onLoginSuccess: (user: any) => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  
  // Interactive Demo Preview Tab State
  const [activePreviewTab, setActivePreviewTab] = useState<
    "dashboard" | "tutor" | "flashcards" | "mindmap" | "flowchart" | "teacher"
  >("dashboard");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    setIsUnauthorizedDomain(false);
    try {
      const user = await loginWithGoogle();
      onLoginSuccess(user);
    } catch (e: any) {
      console.error(e);
      const isAuthDomainErr = e?.code === "auth/unauthorized-domain" || String(e).includes("unauthorized-domain");
      if (isAuthDomainErr) {
        setIsUnauthorizedDomain(true);
        setErrorMsg(`This preview domain '${window.location.hostname}' is not authorized in your Firebase Project configuration. Please add it to your Authorized Domains in the Firebase Console.`);
      } else {
        setErrorMsg(e?.message || "Authorization denied or cancelled. Please review browser popup credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    onLoginSuccess({
      uid: "demo_student_manthan360",
      email: "vaishnavigirase802@gmail.com",
      displayName: "Demo Student",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
    });
  };

  // Major features definitions
  const featuresList = [
    {
      id: "ocr",
      icon: <FileText className="w-6 h-6 text-indigo-400" />,
      title: "OCR Notes Extraction",
      description: "Extract clean, formatted textual scripts from handwritten notebooks, photos, or complex syllabus files instantly.",
      badge: "Tesseract OCR"
    },
    {
      id: "summary",
      icon: <Layers className="w-6 h-6 text-violet-400" />,
      title: "AI Summary",
      description: "Generate highly dense core revision sheets, key takeaways, and bullet summaries of multiple PDF sources at once.",
      badge: "Gemini Pro"
    },
    {
      id: "flashcards",
      icon: <LayoutGrid className="w-6 h-6 text-fuchsia-400" />,
      title: "Flashcards Studio",
      description: "Convert dense paragraphs into smart active recall card decks with interactive flip controls and tracking stats.",
      badge: "Spaced Repetitive"
    },
    {
      id: "quizzes",
      icon: <HelpCircle className="w-6 h-6 text-pink-400" />,
      title: "Interactive Quizzes",
      description: "Challenge your comprehension with native-language MCQs, countdown pressure, and diagnostic report-cards.",
      badge: "Active Testing"
    },
    {
      id: "mindmaps",
      icon: <GitBranch className="w-6 h-6 text-blue-400" />,
      title: "Dynamic Mind Maps",
      description: "Translate complex concepts into visual branching trees with physics layout animations for quick learning.",
      badge: "Xyflow Nodes"
    },
    {
      id: "flowcharts",
      icon: <Workflow className="w-6 h-6 text-cyan-400" />,
      title: "System Flowcharts",
      description: "Auto-layout procedural science or operational business equations into step-by-step connection graphs.",
      badge: "Procedural Maps"
    },
    {
      id: "studyplanner",
      icon: <Calendar className="w-6 h-6 text-emerald-400" />,
      title: "Custom Study Planner",
      description: "Plan chapters with day-by-day dynamic schedules based on exam speed, priority, and current preparation level.",
      badge: "Syllabus Plan"
    },
    {
      id: "learningroadmaps",
      icon: <TrendingUp className="w-6 h-6 text-teal-400" />,
      title: "Visual Master Roadmaps",
      description: "Unlock structural developmental pathways with milestone tracking designed to keep retention loops green.",
      badge: "Milestones"
    },
    {
      id: "aitutor",
      icon: <MessageSquare className="w-6 h-6 text-amber-400" />,
      title: "1-on-1 AI Tutor",
      description: "Query specialized academic doubts inside a friendly interactive chat terminal in your native tongue.",
      badge: "Personal Mentor"
    },
    {
      id: "teacherhub",
      icon: <GraduationCap className="w-6 h-6 text-violet-500" />,
      title: "AI Virtual Teacher Hub",
      description: "Watch a high-fidelity cinematic virtual student lecture player sync'd with slides, audio waveforms, and MCQs.",
      badge: "Lecturer 2.0"
    },
    {
      id: "presentation",
      icon: <Presentation className="w-6 h-6 text-rose-400" />,
      title: "Presentation Slides Generator",
      description: "Turn simple text files into structured PPTX lecture slide files with beautiful layouts ready to download.",
      badge: "PPTX Exports"
    },
    {
      id: "videoscript",
      icon: <Video className="w-6 h-6 text-sky-400" />,
      title: "Narration Script Generator",
      description: "Automate continuous scenic narration and voiceover prompts ready to feed straight into avatars.",
      badge: "Voiceover Sync"
    },
    {
      id: "multilang",
      icon: <Globe className="w-6 h-6 text-emerald-500" />,
      title: "Multi-Language Learning",
      description: "Study comfortably in English, Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Bengali, or Punjabi.",
      badge: "10 Languages"
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200 relative overflow-x-hidden" id="landing-page">
      {/* Absolute Ambient Background Lights */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-blue-900/5 to-transparent pointer-events-none z-0" />
      <div className="absolute top-[800px] left-[-10%] w-[50%] h-[500px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[1800px] right-[-10%] w-[50%] h-[500px] bg-rose-600/5 rounded-full blur-[140px] pointer-events-none" />
      
      {/* TOP HEADER MENU */}
      <header className="border-b border-white/5 bg-slate-950/10 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between" id="landing-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-sans font-black text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Manthan360
            </span>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">Upload Once. Learn Forever.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAuthModal(true)}
            className="text-xs font-mono font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            id="header-signin-link"
          >
            Sign In
          </button>
          
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-transparent hover:bg-white/5 border border-white/10 hover:border-violet-500/50 text-white text-xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md"
            id="header-get-started-btn"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* 1. HERO SECTION */}
      <section className="relative z-10 pt-16 pb-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center" id="hero-section">
        <div className="lg:col-span-7 space-y-6 text-left" id="hero-headlines">
          <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 px-3 py-1.5 rounded-full" id="hero-pill">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-violet-300 uppercase tracking-widest">
              AI-Powered Cognitive Education Suite
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-sans leading-[1.1] tracking-tight text-white" id="hero-title">
            Manthan360
          </h1>
          
          <h2 className="text-2xl sm:text-3xl font-serif text-indigo-300 font-bold italic" id="hero-tagline">
            "Upload Once. Learn Forever."
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed font-sans" id="hero-description">
            The ultimate academic acceleration platform. Transform standard textual notes, handwritten sheets, or textbook chapters instantly into interactive localized summaries, active memory flashcards, custom countdown MCQs, structural flowcharts, and high-fidelity video classroom lectures led by virtual lecturer personas.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4" id="hero-cta-buttons">
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 hover:opacity-95 text-white font-black text-sm px-8 py-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group"
              id="hero-get-started-btn"
            >
              <span>Get Started Free</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => {
                const element = document.getElementById("demo-preview-section");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white font-bold text-xs px-6 py-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              id="hero-view-demo-btn"
            >
              <span>Explore Interactive Mockups</span>
              <BookOpen className="w-4 h-4 text-violet-400" />
            </button>
          </div>

          {/* Value Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/5 text-center sm:text-left" id="hero-badges">
            <div>
              <p className="text-xl sm:text-2xl font-black text-white font-sans">10+</p>
              <p className="text-[10px] uppercase text-slate-500 font-mono tracking-wider">Indian Languages</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white font-sans">12+</p>
              <p className="text-[10px] uppercase text-slate-500 font-mono tracking-wider">AI Study Formats</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white font-sans">100%</p>
              <p className="text-[10px] uppercase text-slate-500 font-mono tracking-wider">Offline Sandbox Mode</p>
            </div>
          </div>
        </div>

        {/* Hero Interactive Orbital Canvas Simulation Illustration */}
        <div className="lg:col-span-5 flex items-center justify-center relative" id="hero-illustration-wrapper">
          <div className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full border border-white/5 relative flex items-center justify-center bg-slate-900/10 backdrop-blur-3xl shadow-3xl" id="hero-orbital-canvas">
            {/* Soft inner glow */}
            <div className="absolute w-[240px] h-[240px] rounded-full bg-violet-500/10 blur-xl pointer-events-none" />
            
            {/* Center Note Icon */}
            <div className="w-20 h-20 rounded-3xl bg-slate-950 border-2 border-indigo-500/30 flex flex-col items-center justify-center relative z-20 shadow-2xl animate-bounce">
              <FileText className="w-8 h-8 text-indigo-400" />
              <span className="text-[8px] font-mono text-indigo-300 font-black mt-1">NOTES.PDF</span>
              
              {/* Core radar pulses */}
              <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-3xl animate-ping scale-110 pointer-events-none" />
            </div>

            {/* Orbit paths */}
            <div className="absolute inset-0 border border-white/5 rounded-full scale-[0.8] animate-spin [animation-duration:22s]" />
            <div className="absolute inset-0 border border-indigo-500/10 rounded-full scale-[0.6] animate-spin [animation-duration:14s] reverse" />

            {/* Floating processed node indicators */}
            <div className="absolute top-10 left-12 w-12 h-12 rounded-full bg-slate-950 border border-violet-500/40 flex items-center justify-center shadow-lg transform -rotate-12 hover:scale-110 transition-transform">
              <LayoutGrid className="w-5 h-5 text-violet-400" />
              <div className="absolute -top-7 bg-slate-900 text-[8px] px-1.5 py-0.5 border border-white/5 text-violet-300 font-mono rounded">Cards</div>
            </div>

            <div className="absolute bottom-16 left-6 w-12 h-12 rounded-full bg-slate-950 border border-fuchsia-500/40 flex items-center justify-center shadow-lg transform rotate-45 hover:scale-110 transition-transform">
              <Workflow className="w-5 h-5 text-fuchsia-400" />
              <div className="absolute -bottom-6 bg-slate-900 text-[8px] px-1.5 py-0.5 border border-white/5 text-fuchsia-300 font-mono rounded">Flow</div>
            </div>

            <div className="absolute top-24 right-6 w-12 h-12 rounded-full bg-slate-950 border border-cyan-500/40 flex items-center justify-center shadow-lg transform rotate-12 hover:scale-110 transition-transform">
              <GitBranch className="w-5 h-5 text-cyan-400" />
              <div className="absolute -top-7 bg-slate-900 text-[8px] px-1.5 py-0.5 border border-white/5 text-cyan-300 font-mono rounded">Map</div>
            </div>

            <div className="absolute bottom-10 right-14 w-12 h-12 rounded-full bg-slate-950 border border-pink-500/40 flex items-center justify-center shadow-lg transform -rotate-45 hover:scale-110 transition-transform">
              <HelpCircle className="w-5 h-5 text-pink-400" />
              <div className="absolute -bottom-6 bg-slate-900 text-[8px] px-1.5 py-0.5 border border-white/5 text-pink-300 font-mono rounded">Quiz</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES GRID SECTION */}
      <section className="relative z-10 py-20 bg-slate-950/40 border-t border-b border-white/5 px-6" id="features-section">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
              Feature Ecosystem
            </span>
            <h3 className="text-3xl font-sans font-black text-white tracking-tight">
              Thirteen Powerhouses. One Platform.
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              We've consolidated entire systems of study into a beautiful, lightning-rapid core interface. Every visual asset translates straight into retention.
            </p>
          </div>

          {/* Responsive Bento-themed Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="features-grid">
            {featuresList.map((f, fIdx) => (
              <div
                key={f.id}
                className="group p-6 bg-[#090d23]/50 border border-white/5 hover:border-violet-500/40 rounded-3xl transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-[0_8px_30px_rgb(99,102,241,0.1)] flex flex-col justify-between"
                id={`feature-card-${f.id}`}
              >
                <div className="space-y-4">
                  {/* Glowing header row with badge */}
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-violet-600/10 transition-all">
                      {f.icon}
                    </div>
                    <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                      {f.badge}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">
                      {f.title}
                    </h4>
                    <p className="text-slate-400 text-xs leading-relaxed font-sans">
                      {f.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center text-[10px] font-mono text-indigo-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all cursor-pointer">
                  <span>Verify Engine Capability</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto" id="how-it-works-section">
        <div className="space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-[10px] font-mono font-black text-[#ffae19] uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
              Retention Pipeline
            </span>
            <h3 className="text-3xl font-sans font-black text-white tracking-tight">
              Four Steps to Active Learning
            </h3>
            <p className="text-slate-400 text-xs">
              Go from static textbook sheets to a fully customized video lecture course in under a minute.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative" id="how-it-works-grid">
            {[
              {
                step: "01",
                title: "Upload Study Notes",
                description: "Drop PDFs, syllabus plans, text documents, or snapshots of handwritten notes directly into our secure scanner."
              },
              {
                step: "02",
                title: "AI Processes Content",
                description: "Gemini maps logical pathways, extracts complex formulas, matches glossary keywords, and outputs a clean text script."
              },
              {
                step: "03",
                title: "Generate Materials",
                description: "Tap one-click compilations to spawn fully sync'd visual roadmaps, flashcards, flowcharts, calendars, and slides."
              },
              {
                step: "04",
                title: "Study Smarter",
                description: "Interrogate tutoring questions in 10 languages, play synthetic teacher voiceovers, and secure consecutive day-streaks."
              }
            ].map((s, sIdx) => (
              <div 
                key={sIdx} 
                className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl relative overflow-hidden flex flex-col justify-between"
                id={`works-step-${s.step}`}
              >
                <div className="absolute top-[-20%] right-[-10%] text-7xl font-sans font-black text-white/5 select-none font-mono">
                  {s.step}
                </div>

                <div className="space-y-4">
                  <span className="text-xs font-mono font-extrabold text-violet-400 tracking-widest bg-violet-500/10 p-1.5 px-3 rounded-lg border border-violet-500/20">
                    STEP {s.step}
                  </span>
                  <p className="font-bold text-slate-100 text-sm mt-2">{s.title}</p>
                  <p className="text-slate-400 text-xs leading-relaxed font-sans">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. DEMO PREVIEW INTERACTIVE SECTION */}
      <section className="relative z-10 py-20 bg-slate-950/60 border-t border-b border-white/5 px-6" id="demo-preview-section">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-[10px] font-mono font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
              Interactive Preview
            </span>
            <h3 className="text-3xl font-sans font-black text-white tracking-tight">
              Test Ride the Workspace
            </h3>
            <p className="text-slate-400 text-xs">
              Click the different module preview tabs below to look at a high-fidelity visual preview of what you will unlock!
            </p>
          </div>

          {/* Tab Selector Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto" id="preview-tab-controls">
            {[
              { id: "dashboard", label: "Dashboard Space" },
              { id: "tutor", label: "AI Tutor Terminal" },
              { id: "flashcards", label: "Flashcards Studio" },
              { id: "mindmap", label: "Cognitive Mind Maps" },
              { id: "flowchart", label: "System Flowcharts" },
              { id: "teacher", label: "AI Teacher Masterclass" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePreviewTab(tab.id as any)}
                className={`p-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePreviewTab === tab.id
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20 scale-102"
                    : "bg-white/5 border border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Mockups Screen Box */}
          <div className="w-full max-w-5xl mx-auto bg-[#040815] rounded-[32px] border border-white/10 p-4 sm:p-6 shadow-2xl relative" id="preview-stage-container">
            {/* Top Windows frame circles */}
            <div className="flex items-center gap-1.5 pb-4 border-b border-white/5 mb-4 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-600 font-mono ml-2">https://manthan360.applet/{activePreviewTab}</span>
            </div>

            {/* TAB CORRESPONDING VIEWPORTS */}
            <div className="min-h-[340px] flex flex-col justify-between" id="preview-body-stage">
              {activePreviewTab === "dashboard" && (
                <div className="space-y-4 animate-fade-in" id="preview-viewport-dashboard">
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Dynamic Learning Dashboard</h4>
                      <p className="text-[10px] text-slate-400">All uploaded note packages and diagnostic tracking in one spot.</p>
                    </div>
                    <span className="text-[10px] font-mono bg-violet-500/10 border border-violet-500/20 text-violet-300 p-1 px-2 rounded-lg font-black uppercase">Active Session</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl space-y-2">
                      <span className="text-[9px] font-mono text-indigo-400 uppercase font-extrabold">Active Booklet</span>
                      <p className="text-xs font-bold text-slate-200 truncate">Core Biology Chapter 3.pdf</p>
                      <div className="w-full bg-slate-800 h-1.5 roundedOverflow overflow-hidden">
                        <div className="w-[85%] bg-violet-600 h-full rounded" />
                      </div>
                      <p className="text-[9px] text-slate-500 text-right">85% Comprehension</p>
                    </div>

                    <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl space-y-2">
                      <span className="text-[9px] font-mono text-emerald-400 uppercase font-extrabold">Consecutive Study Streak</span>
                      <p className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <Flame className="w-4 h-4 text-emerald-400" />
                        <span>14 Days Solid Streak</span>
                      </p>
                      <p className="text-[9px] text-slate-500">Spaced recall continuous loop active</p>
                    </div>

                    <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl space-y-2">
                      <span className="text-[9px] font-mono text-fuchsia-400 uppercase font-extrabold">Active Assignments Done</span>
                      <p className="text-xs font-bold text-slate-200">12 Flashcards / 3 Flowcharts</p>
                      <p className="text-[9px] text-slate-500">Total diagnostic questions: Stable</p>
                    </div>
                  </div>

                  <div className="p-5 bg-white/5 rounded-2xl text-center border border-dashed border-white/10 flex flex-col items-center justify-center p-8 space-y-2">
                    <p className="text-xs text-slate-300 font-medium">Ready to load your own textbook files?</p>
                    <button onClick={() => setShowAuthModal(true)} className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs p-2 px-4 rounded-xl transition-all cursor-pointer">
                      Get Started Inside Dashboard
                    </button>
                  </div>
                </div>
              )}

              {activePreviewTab === "tutor" && (
                <div className="space-y-4 animate-fade-in" id="preview-viewport-tutor">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex gap-2 items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-mono font-bold text-slate-300">1-on-1 Personalized AI Tutor Console</span>
                    </div>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded font-mono uppercase">Multi-Language Chat Ready</span>
                  </div>

                  <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-4 space-y-3 h-52 overflow-y-auto font-sans text-xs">
                    <div className="flex justify-start">
                      <div className="bg-black/35 p-3 rounded-2xl rounded-tl-none max-w-[80%] border border-white/5">
                        <p className="font-mono text-[8px] text-indigo-400 uppercase font-black tracking-widest">AI Tutor (Selected voice: Hindi)</p>
                        <p className="text-slate-200 mt-1">नमस्ते! मैं आपका पर्सनल ट्यूटर हूँ। अपने नोट्स से जुड़े किसी भी सवाल या समीकरण (equation) के बारे में पूछें।</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-violet-600 p-3 rounded-2xl rounded-tr-none max-w-[80%] text-white">
                        <p className="font-mono text-[8px] opacity-75 uppercase font-black text-right">Student Question</p>
                        <p className="mt-1">Explain the chemical compounds catalyst role in hindi.</p>
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <div className="bg-black/35 p-3 rounded-2xl rounded-tl-none max-w-[80%] border border-white/5">
                        <p className="font-mono text-[8px] text-indigo-400 uppercase font-black tracking-widest">AI Tutor (Selected voice: Hindi)</p>
                        <p className="text-slate-200 mt-1">उत्प्रेरक या Catalyst वह पदार्थ है जो बिना अपनी रासायनिक संरचना को बदले केमिकल रिएक्शन (chemical reaction) की गति को तेज़ कर देता है। जैसे जैविक क्रियाओं में एन्जाइम सहायक होते हैं।</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === "flashcards" && (
                <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-fade-in" id="preview-viewport-flashcards">
                  <div className="w-80 h-44 bg-gradient-to-br from-[#1e1b4b] to-[#4c1d95] rounded-3xl border-2 border-violet-500/30 flex flex-col justify-between p-6 shadow-2xl relative overflow-hidden text-center cursor-pointer hover:border-violet-400/50 transition-all">
                    <div className="flex justify-between items-center shrink-0">
                      <p className="text-[10px] font-mono font-bold text-violet-300 bg-violet-600/30 p-1 px-2.5 rounded-full">Recall Index 03</p>
                      <Sparkles className="w-4 h-4 text-violet-300 animate-spin [animation-duration:12s]" />
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center py-2">
                      <h4 className="text-sm font-semibold text-white leading-tight font-sans">
                        "What is key constant value E_max in system catalysts?"
                      </h4>
                    </div>

                    <p className="text-[9px] font-mono text-slate-500 tracking-wider">TAP CARD TO REVEAL RECALL TRUTH</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 text-[10px] p-2 rounded-xl transition-all font-bold">+ Failed Recall</button>
                    <button className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-300 text-[10px] p-2 rounded-xl transition-all font-bold">✓ Verified Recall</button>
                  </div>
                </div>
              )}

              {activePreviewTab === "mindmap" && (
                <div className="space-y-4 animate-fade-in h-[320px] flex flex-col justify-between" id="preview-viewport-mindmap">
                  <div className="bg-slate-900 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-cyan-400">Cognitive Mind Maps graph preview</span>
                    <span className="text-[8px] bg-slate-950 p-1 rounded font-mono text-slate-500">ZOOM LEVEL: 94%</span>
                  </div>

                  {/* HTML layout mock nodes diagram */}
                  <div className="flex-1 flex items-center justify-center gap-4 relative overflow-hidden" id="mindmap-nodes-container">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-dashed bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 opacity-20" />
                    
                    <div className="p-3 bg-indigo-950/40 border border-indigo-500 text-white rounded-xl text-center z-10 font-bold text-xs shrink-0 shadow-lg">
                      Syllabus Root
                    </div>

                    <span className="text-slate-500 font-mono text-xs animate-pulse">&harr;</span>

                    <div className="p-3 bg-violet-950/40 border border-violet-500 text-white rounded-xl text-center z-10 font-bold text-xs shrink-0 shadow-lg">
                      Catalysis Subsystem
                    </div>

                    <span className="text-slate-500 font-mono text-xs animate-pulse">&harr;</span>

                    <div className="p-3 bg-cyan-950/40 border border-cyan-500 text-white rounded-xl text-center z-10 font-bold text-xs shrink-0 shadow-lg">
                      Active Outcomes
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === "flowchart" && (
                <div className="space-y-4 animate-fade-in" id="preview-viewport-flowchart">
                  <div className="p-6 bg-black/40 border border-white/5 rounded-3xl text-center" id="mock-flowchart-box">
                    <p className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-widest mb-4">Pipeline Execution Sequence</p>
                    
                    <div className="inline-flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
                      <div className="p-2 bg-slate-900 border border-white/5 rounded-lg">Raw Upload (Notes)</div>
                      <span className="text-slate-600">&rarr;</span>
                      <div className="p-2 bg-slate-900 border border-white/5 rounded-lg">Tesseract Conversion</div>
                      <span className="text-slate-600">&rarr;</span>
                      <div className="p-2 bg-[#1e1b4b] border border-violet-500/30 rounded-lg">Chapter Compilation</div>
                      <span className="text-slate-600">&rarr;</span>
                      <div className="p-2 bg-[#064e3b] border border-emerald-500/30 text-emerald-300 rounded-lg">Success</div>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === "teacher" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in" id="preview-viewport-teacher">
                  <div className="aspect-video bg-slate-900 border border-white/5 rounded-2xl flex flex-col justify-between p-4 relative overflow-hidden shadow-xl" id="mock-teacher-video">
                    {/* Floating mini status badge */}
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] bg-red-600/20 text-red-400 p-0.5 px-2 rounded-full font-mono font-bold">● VIRTUAL LECTURE ENGINE</span>
                      <span className="text-[8px] font-mono text-slate-500">Pose: Presenting</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                      <img 
                        src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=256&auto=format&fit=crop" 
                        alt="Avatar" 
                        className="w-20 h-20 rounded-full border-2 border-violet-500/50 object-cover shadow-2xl animate-pulse" 
                      />
                    </div>

                    <div className="bg-black/80 p-2 rounded-xl text-[10px] leading-relaxed text-slate-200">
                      "Welcome back to Chapter 2! Today we focus on catalysts variables balancing..."
                    </div>
                  </div>

                  <div className="aspect-video bg-slate-950 border border-white/10 rounded-2xl p-4 flex flex-col justify-between" id="mock-teacher-slide">
                    <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-wider border-b border-white/5 pb-1">Slide Synchronizer Screen</span>
                    <div className="flex-1 flex flex-col justify-center text-center space-y-1">
                      <h5 className="text-[11px] font-bold text-white">Equation Catalyst Equilibrium</h5>
                      <p className="text-[9px] text-slate-400">Formula Yield = f(inputs, structural catalysts)</p>
                    </div>
                    <span className="text-[8px] text-right text-slate-600 font-mono">SCENE 2 OF 8</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. BENEFITS SECTION */}
      <section className="relative z-10 py-20 max-w-7xl mx-auto px-6" id="benefits-section">
        <div className="space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              Why Manthan360
            </span>
            <h3 className="text-3xl font-sans font-black text-white tracking-tight">
              Crafted for Cognitive Brilliance
            </h3>
            <p className="text-slate-400 text-xs">
              Every detail is tuned for modern academic requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" id="benefits-grid">
            {[
              {
                title: "Faster Learning",
                description: "Condense long-form syllabus textbooks 3x faster, keeping focus parameters healthy."
              },
              {
                title: "Better Retention",
                description: "Spaced memory schedules ensure you never forget elements once compiled."
              },
              {
                title: "Visual Learning",
                description: "Transform dry blocks of prose into flowing mind maps & node pathways instantly."
              },
              {
                title: "Exam Preparation",
                description: "Adaptive MCQ diagnostic testing targets structural weak spots before tests."
              },
              {
                title: "Personalized Study",
                description: "Receive full explanations, schedules, and virtual tutor support in 10 languages."
              }
            ].map((b, bIdx) => (
              <div 
                key={bIdx} 
                className="p-5 bg-gradient-to-t from-[#0e1329]/40 to-[#070b1e]/20 border border-white/5 rounded-3xl relative"
                id={`benefit-card-${bIdx}`}
              >
                <div className="p-2 bg-emerald-400/10 border border-emerald-500/20 text-emerald-400 rounded-xl w-fit mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-100">{b.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed font-sans mt-2">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ABOUT PROJECT SECTION */}
      <section className="relative z-10 py-16 bg-slate-950/20 border-t border-white/5 px-6" id="about-project-section">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="text-[10px] font-mono font-black text-fuchsia-400 uppercase tracking-widest bg-fuchsia-500/10 px-3 py-1.5 rounded-full border border-fuchsia-500/20">
            About the Project
          </span>
          <h3 className="text-2xl sm:text-3xl font-sans font-black text-white tracking-tight">
            Education Without Barriers
          </h3>
          
          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto font-sans" id="about-editorial-prose">
            <p>
              <strong>Manthan360</strong> was founded with a singular, humble vision: to make structural advanced education deeply visual, personal, and universally accessible across multi-cultural cohorts. Named after the Sanskrit word <em>"Manthan"</em> (deep cognitive churning and processing of wisdom), the platform acts as a secure, full-circle, offline-first classroom generator.
            </p>
            <p>
              Whether you are a college student cramming for science finals, a dedicated high school teacher seeking custom PowerPoint slides, or a lifelong learner mastering coding concepts, Manthan360 bridges the gap between text and memory. By synthesizing automated node structures, localized speech transcripts, and active recall diagnostics on-the-fly, we replace rote memorization with conceptual realization.
            </p>
          </div>
        </div>
      </section>

      {/* STUDENT FEEDBACK & TESTIMONIALS */}
      <section className="relative z-10 py-16 bg-slate-950/40 border-t border-white/5 px-6" id="testimonials-section">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-mono font-black text-violet-400 uppercase tracking-widest bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-500/20">
              Student Endorsements
            </span>
            <h3 className="text-2xl sm:text-3xl font-sans font-black text-white tracking-tight">
              Loved by Students Worldwide
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="testimonials-grid">
            <div className="p-6 bg-[#0c122c]/65 border border-white/5 hover:border-violet-500/30 rounded-3xl space-y-4 shadow-xl transition-all">
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop" 
                  alt="Student avatar 1" 
                  className="w-10 h-10 rounded-full object-cover border border-violet-500/40" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h5 className="text-xs font-bold text-slate-100">Karan Sharma</h5>
                  <span className="text-[9px] font-mono text-slate-500">CS Undergrad</span>
                </div>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm italic leading-relaxed font-sans">
                "Manthan360 completely transformed my semester prep. Uploaded my raw lecture slides, and in minutes I had flashcards and mock exams!"
              </p>
            </div>

            <div className="p-6 bg-[#0c122c]/65 border border-white/5 hover:border-violet-500/30 rounded-3xl space-y-4 shadow-xl transition-all">
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop" 
                  alt="Student avatar 2" 
                  className="w-10 h-10 rounded-full object-cover border border-violet-500/40" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h5 className="text-xs font-bold text-slate-100">Aditya Roy</h5>
                  <span className="text-[9px] font-mono text-slate-500">Engineering Major</span>
                </div>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm italic leading-relaxed font-sans">
                "The AI Presentation developer saved me hours of design work. Highly recommend to any engineering major."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="relative z-10 py-16 bg-slate-950/20 border-t border-white/5 px-6" id="faq-section">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              Platform FAQ
            </span>
            <h3 className="text-2xl sm:text-3xl font-sans font-black text-white tracking-tight">
              Standard Educational Questions
            </h3>
          </div>

          <div className="space-y-4" id="faq-accordion-list">
            {[
              {
                q: "How does the OCR extraction handle handwriting?",
                a: "Our advanced visual model can recognize clear printed and handwritten digital ink standard definitions."
              },
              {
                q: "Is the base platform free to use?",
                a: "Yes! The core learning tools, document summary generator, and practice tests are accessible standard features."
              },
              {
                q: "Which document types are supported?",
                a: "You can upload PDF, DOCX, TXT, or scanned slide images instantly."
              }
            ].map((faq, fIdx) => (
              <div key={fIdx} className="p-5 bg-slate-900/40 border border-white/5 rounded-2xl space-y-2">
                <h5 className="text-xs sm:text-sm font-bold text-slate-100 flex items-start gap-2">
                  <span className="text-violet-400 font-mono">Q.</span>
                  <span>{faq.q}</span>
                </h5>
                <p className="text-slate-400 text-xs sm:text-xs leading-relaxed pl-5 font-sans">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative z-10 py-20 bg-gradient-to-b from-[#090d23] to-[#020617] border-t border-white/5 px-6 text-center" id="ready-cta-section">
        <div className="max-w-2xl mx-auto space-y-6">
          <h3 className="text-2xl sm:text-4xl font-extrabold font-sans text-white tracking-tight leading-tight">
            Ready to level up your grades?
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Ignite your active study regime and craft cinematic virtual class tutorials immediately. No credit card required.
          </p>
          <div className="pt-4 flex justify-center">
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-95 text-white font-extrabold text-sm px-10 py-4.5 rounded-2xl transition-all cursor-pointer shadow-lg shadow-violet-500/25 flex items-center gap-2 group transform hover:-translate-y-0.5"
              id="cta-get-started-now-btn"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-white/5 bg-slate-950/80 px-6 py-12 relative z-10 text-xs" id="landing-footer">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-8">
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              <span className="font-sans font-black text-lg text-white">Manthan360</span>
            </div>
            <p className="text-slate-500 font-sans leading-relaxed">
              Synthesizing dense learning notes into active summaries, interactive quizzes, flashcard sessions, and virtual lecturer video pipelines instantly.
            </p>
          </div>

          <div className="md:col-span-3 space-y-2">
            <p className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">Contact & Help</p>
            <ul className="space-y-1 text-slate-500 font-sans">
              <li className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                <Mail className="w-3.5 h-3.5 text-violet-400" />
                <span>support@manthan360.ai</span>
              </li>
              <li className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>24/7 Security Sandbox</span>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2">
            <p className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">GitHub & Code</p>
            <ul className="space-y-1 text-slate-500 font-sans">
              <li className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                <Github className="w-3.5 h-3.5 text-fuchsia-400" />
                <a href="https://github.com/manthan360" target="_blank" rel="noopener noreferrer">Explore GitHub Repository</a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-2">
            <p className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">Legal Documents</p>
            <ul className="space-y-1 text-slate-500 font-sans">
              <li className="hover:text-white transition-colors cursor-pointer">Privacy Policy</li>
              <li className="hover:text-white transition-colors cursor-pointer">Terms & Conditions</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-600 font-mono text-[10px]" id="footer-stamp">
          <p>© 2026 Manthan360 • Upload Once. Learn Forever.</p>
          <p>Authored for Premium Spaced Repetition Study Suite</p>
        </div>
      </footer>

      {/* REACTION AUTH MODAL OVERLAY SHEET */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" id="landing-auth-overlay">
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[32px] p-8 space-y-6 relative shadow-2xl"
              id="landing-auth-modal-card"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setErrorMsg("");
                  setIsUnauthorizedDomain(false);
                }}
                className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer"
                id="close-auth-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto shadow-lg shadow-violet-500/15">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-black text-white font-sans tracking-tight">Access Manthan360 Workspace</h4>
                <p className="text-slate-400 text-xs">Choose your preferred safe connection method to initialize the session.</p>
              </div>

              {errorMsg && (
                <div className="text-left text-xs bg-rose-950/40 border border-rose-900/40 text-rose-300 p-4 rounded-xl space-y-2 font-sans" id="auth-modal-error">
                  <div className="flex items-center gap-1.5 font-bold font-mono">
                    <span>⚠️ Connection Issue</span>
                  </div>
                  <p className="leading-relaxed">{errorMsg}</p>
                  {isUnauthorizedDomain && (
                    <div className="mt-2 text-[11px] text-rose-200/90 space-y-1.5 font-mono pt-2 border-t border-rose-900/40">
                      <p className="font-bold underline">To authorise this preview domain:</p>
                      <ol className="list-decimal list-inside space-y-1 leading-normal">
                        <li>Open Firebase Project console</li>
                        <li>Head to Authentication &rarr; Settings</li>
                        <li>Under "Authorized domains", add the link below:</li>
                        <li className="text-emerald-300 select-all font-bold font-sans bg-slate-950/60 p-1.5 px-2 rounded border border-white/5 mt-1 block w-fit truncate">{window.location.hostname}</li>
                      </ol>
                      <p className="pt-2 italic text-[10px] text-rose-300/80">Tip: Bypass instantly using the sandbox student account below!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons inside Modal */}
              <div className="space-y-3" id="auth-modal-btn-group">
                
                {/* Standard Google Sign In */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-3.5 px-6 rounded-2xl tracking-wide transition-all shadow-lg shadow-violet-500/20 active:scale-98 cursor-pointer"
                  id="modal-google-auth-btn"
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-white animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.19-5.136 4.19a5.79 5.79 0 0 1-5.79-5.79 5.79 5.79 0 0 1 5.79-5.79c2.25 0 4.18 1.21 5.23 3l3.66-2.5A11.76 11.76 0 0 0 12.24 0C5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.15 0 11.24-4.47 11.24-11.24 0-.79-.08-1.56-.24-2.285H12.24z" />
                      </svg>
                      <span className="text-xs">Connect using Google Auth</span>
                    </>
                  )}
                </button>

                {/* Sandbox Demo bypass */}
                <button
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-slate-950/80 hover:bg-slate-900 border border-white/5 hover:border-violet-500/30 text-slate-300 hover:text-white font-medium py-3 px-6 rounded-2xl text-xs tracking-wide transition-all active:scale-98 cursor-pointer"
                  id="modal-demo-bypass-btn"
                >
                  <span>Student Sandbox Bypass</span>
                  <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
                </button>

              </div>

              {/* Shield lock stamp */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-1.5 text-[9px] font-mono text-slate-600 uppercase" id="modal-security-badge">
                <Shield className="w-3.5 h-3.5 text-emerald-500/60" />
                <span>SSL Authorization Sandbox Secured</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
