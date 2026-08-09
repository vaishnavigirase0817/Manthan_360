import { useEffect, useState } from "react";
import { FirebaseUser, Note, DiagnosticsData } from "../types";
import { getUserProgress, UserProgress } from "../services/gamification";
import { db } from "../services/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { generateNotesDiagnostics } from "../services/api";
import { 
  TrendingUp, Sparkles, Trophy, Flame, Award, Calendar, Layers, 
  ChevronRight, Brain, Milestone, HelpCircle, CheckCircle, 
  AlertTriangle, CheckSquare, BarChart3, RefreshCw, Compass, Check
} from "lucide-react";
import Loader from "../components/Loader";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from "recharts";

interface ProgressAnalyticsProps {
  user: FirebaseUser | null;
  focusedNote?: Note | null;
  onUpdateNote?: (note: Note) => void;
}

interface AttemptData {
  noteTitle: string;
  noteId?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  createdAt: string;
}

type TabType = "overall" | "diagnostics";

export default function ProgressAnalytics({ user, focusedNote, onUpdateNote }: ProgressAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overall");
  
  // Overall Gamification states
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  
  // Notes catalog for diagnostics targeting
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(focusedNote || null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState("");
  
  // Interactive Roadmap completed milestones state (client side tracker mapped to note storage)
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>({});

  // Sync selectedNote when focusedNote updates
  useEffect(() => {
    if (focusedNote) {
      setSelectedNote(focusedNote);
    }
  }, [focusedNote]);

  // Load analytics and notes directory
  useEffect(() => {
    if (!user) return;

    const loadAnalyticsData = async () => {
      setLoading(true);
      try {
        // 1. Fetch live gamification profile
        const prog = await getUserProgress(user.uid);
        setProgress(prog);

        // 2. Fetch all historic quiz attempts
        const attemptsQ = query(
          collection(db, "quizAttempts"),
          where("userId", "==", user.uid)
        );
        const attemptsSnap = await getDocs(attemptsQ);
        const fetchedAttempts: AttemptData[] = [];
        
        attemptsSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const tQ = data.totalQuestions || 10;
          fetchedAttempts.push({
            noteTitle: data.noteTitle || "Unidentified Note",
            noteId: data.noteId || "",
            score: data.score || 0,
            totalQuestions: tQ,
            percentage: Math.round(((data.score || 0) / tQ) * 100),
            createdAt: data.createdAt || new Date().toISOString()
          });
        });

        // Sort ascending chronologically
        fetchedAttempts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setAttempts(fetchedAttempts);

        // 3. Fetch user notes
        const notesQ = query(
          collection(db, "notes"),
          where("userId", "==", user.uid)
        );
        const notesSnap = await getDocs(notesQ);
        const fetchedNotes: Note[] = [];
        notesSnap.forEach((docSnap) => {
          fetchedNotes.push(docSnap.data() as Note);
        });
        
        fetchedNotes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setUserNotes(fetchedNotes);

        // Set default selected note
        if (!selectedNote && fetchedNotes.length > 0) {
          setSelectedNote(fetchedNotes[0]);
        }
      } catch (err) {
        console.error("Failed to load progress analytics data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [user]);

  // Load selected note completion roadmap states
  useEffect(() => {
    if (selectedNote) {
      // Sync ticked checkboxes
      const ticks: Record<string, boolean> = {};
      const noteTicks = (selectedNote as any).roadmapCompletedTicks || [];
      noteTicks.forEach((m: string) => {
        ticks[m] = true;
      });
      setCompletedMilestones(ticks);
    }
  }, [selectedNote]);

  // Compile cognitive study diagnostics
  const runDiagnosticAnalysis = async () => {
    if (!selectedNote || !user) return;
    setLoadingDiagnostics(true);
    setDiagnosticError("");
    try {
      // Filter quiz attempts for this specific note to pass as context
      const noteQuizAttempts = attempts.filter(att => att.noteId === selectedNote.id || att.noteTitle === selectedNote.title);
      
      const analysis = await generateNotesDiagnostics(selectedNote.extractedText, noteQuizAttempts);
      
      // Update in Firestore
      await updateDoc(doc(db, "notes", selectedNote.id), {
        diagnostics: analysis,
        updatedAt: new Date().toISOString(),
      });

      const updated = {
        ...selectedNote,
        diagnostics: analysis,
        updatedAt: new Date().toISOString(),
      };

      // Bubble up to overall React state
      if (onUpdateNote) {
        onUpdateNote(updated);
      }
      setSelectedNote(updated);

      // Refresh local userNotes list
      setUserNotes(prev => prev.map(n => n.id === selectedNote.id ? updated : n));
    } catch (e: any) {
      console.error("Diagnostic error:", e);
      setDiagnosticError(e.message || "Diagnostic compilation failed. Re-verify network parameters.");
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  // Toggle milestone checklist
  const handleToggleMilestone = async (milestone: string) => {
    if (!selectedNote || !selectedNote.diagnostics) return;

    const isCurrentlyChecked = !!completedMilestones[milestone];
    const newTicks = { ...completedMilestones, [milestone]: !isCurrentlyChecked };
    setCompletedMilestones(newTicks);

    // Filter checked milestones to array
    const ticksArray = Object.keys(newTicks).filter(k => newTicks[k]);

    // Recalculate dynamic mastery score based on completes
    // Basics worth 5% each, Intermediate 10% each, Advanced 15% each. Let's make it a nice logical progressive math!
    const basicMils = selectedNote.diagnostics.basics;
    const interMils = selectedNote.diagnostics.intermediate;
    const advMils = selectedNote.diagnostics.advanced;

    let basicDone = 0;
    basicMils.forEach(m => { if (newTicks[m]) basicDone++; });
    
    let interDone = 0;
    interMils.forEach(m => { if (newTicks[m]) interDone++; });

    let advDone = 0;
    advMils.forEach(m => { if (newTicks[m]) advDone++; });

    // Dynamic understanding, revision, quiz scores
    const quizCount = attempts.filter(a => a.noteId === selectedNote.id || a.noteTitle === selectedNote.title).length;
    const computedRevision = Math.min(100, Math.round(((basicDone + interDone + advDone) / 9) * 100));
    const computedUnderstanding = Math.min(100, 75 + basicDone * 5 + interDone * 3);
    const computedQuizScore = selectedNote.diagnostics.quizScore || (quizCount > 0 ? 80 : 0);
    const compositeMastery = Math.round((computedUnderstanding * 0.35) + (computedRevision * 0.35) + (computedQuizScore * 0.30));

    const updatedDiagnostics: DiagnosticsData = {
      ...selectedNote.diagnostics,
      revisionScore: computedRevision,
      understandingScore: computedUnderstanding,
      masteryScore: compositeMastery
    };

    try {
      // Update in Firestore
      await updateDoc(doc(db, "notes", selectedNote.id), {
        roadmapCompletedTicks: ticksArray,
        diagnostics: updatedDiagnostics,
        updatedAt: new Date().toISOString()
      });

      const updated = {
        ...selectedNote,
        diagnostics: updatedDiagnostics,
        roadmapCompletedTicks: ticksArray,
        updatedAt: new Date().toISOString()
      } as any;

      if (onUpdateNote) {
        onUpdateNote(updated);
      }
      setSelectedNote(updated);
      setUserNotes(prev => prev.map(n => n.id === selectedNote.id ? updated : n));
    } catch (e) {
      console.error("Failed to sync milestone checklist:", e);
    }
  };

  if (loading) {
    return <Loader message="Compiling cumulative profile dynamics, diagnostic scores, and roadmap checklists..." />;
  }

  // Fallbacks for chart displays
  const defaultAttempts: AttemptData[] = attempts.length > 0 ? attempts : [
    { noteTitle: "Intro Quiz", score: 6, totalQuestions: 10, percentage: 60, createdAt: "2026-06-10T10:00:00Z" },
    { noteTitle: "Core Concepts", score: 8, totalQuestions: 10, percentage: 80, createdAt: "2026-06-11T12:00:00Z" },
    { noteTitle: "Advanced Theory", score: 9, totalQuestions: 10, percentage: 90, createdAt: "2026-06-12T02:00:00Z" },
  ];

  // Calculate cumulative growth plots
  const cumulativeXPData = defaultAttempts.map((attempt, idx) => {
    const itemXP = 20 + attempt.score * 25 + (attempt.score === attempt.totalQuestions ? 50 : 0);
    const prevXP = idx > 0 ? (attempts.slice(0, idx).reduce((acc, cur) => acc + (20 + cur.score * 25 + (cur.score === cur.totalQuestions ? 50 : 0)), 0)) : 0;
    return {
      name: `Test ${idx + 1}`,
      XP: prevXP + itemXP,
      "Score Accuracy (%)": attempt.percentage,
    };
  });

  // Calculate pie split
  const topicCounts: Record<string, number> = {};
  defaultAttempts.forEach((att) => {
    const key = att.noteTitle.split(" ")[0] || "General";
    topicCounts[key] = (topicCounts[key] || 0) + 1;
  });

  const pieChartData = Object.keys(topicCounts).map((key) => ({
    name: key,
    value: topicCounts[key],
  }));

  const PIE_COLORS = ["#8b5cf6", "#a78bfa", "#3b82f6", "#06b6d4", "#ec4899", "#f59e0b"];

  const totalUserXP = progress?.xp || 0;
  const currentLvl = progress?.level || 1;
  const currentLvlXP = totalUserXP % 300;
  const nextLvlPct = Math.round((currentLvlXP / 300) * 100);

  return (
    <div className="w-full space-y-6 animate-fade-in text-slate-100" id="analytics-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4" id="analytics-header">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-widest">
              Performance Insights
            </span>
          </div>
          <h2 className="text-2xl font-sans font-black text-white mt-1">Academics & Diagnostics</h2>
          <p className="text-slate-400 text-xs">Visualize user XP logs, diagnose gaps, list roadmap milestones</p>
        </div>

        {/* Tab Switcher buttons */}
        <div className="flex items-center bg-slate-950 border border-white/10 p-1 rounded-xl shrink-0" id="analytics-tabs">
          <button
            onClick={() => setActiveTab("overall")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "overall" 
                ? "bg-violet-600 text-white" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Overall Progress & XP
          </button>
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "diagnostics" 
                ? "bg-violet-600 text-white" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Cognitive Diagnostics
          </button>
        </div>
      </div>

      {activeTab === "overall" ? (
        /* Overall Progress & Achievements View */
        <div className="space-y-6 animate-fade-in" id="overall-profile-viewport">
          {/* Hero Row widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="gamified-profile-hero">
            {/* Level sphere indicator */}
            <div className="p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-[#120f26]/80 to-slate-950/80 backdrop-blur-md flex items-center gap-4.5" id="profile-lvl-bubble">
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                  <circle 
                    cx="40" cy="40" r="34" 
                    stroke="#8b5cf6" strokeWidth="6" fill="transparent" 
                    strokeDasharray={2 * Math.PI * 34} 
                    strokeDashoffset={2 * Math.PI * 34 * (1 - nextLvlPct / 100)} 
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-white">{currentLvl}</span>
                  <span className="text-[8px] font-mono uppercase text-violet-400 font-bold">LEVEL</span>
                </div>
              </div>
              
              <div className="space-y-1 flex-1 text-left">
                <h3 className="text-xs font-bold text-slate-100">Dynamic Student Tiers</h3>
                <p className="text-[10px] font-mono text-slate-400">{totalUserXP} Cumulative XP</p>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-violet-500 h-full rounded-full animate-pulse" style={{ width: `${nextLvlPct}%` }} />
                </div>
                <p className="text-[9px] font-mono text-violet-400">{300 - currentLvlXP} XP to Level {currentLvl + 1}</p>
              </div>
            </div>

            {/* Daily Streak stats */}
            <div className="p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-[#101923]/60 to-slate-950/80 backdrop-blur-md flex items-center gap-4 text-left" id="profile-streak-bubble">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                <Flame className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-mono font-bold uppercase text-slate-500 tracking-wider">Streaks Log</p>
                <h4 className="text-lg font-black text-white">{progress?.streak || 1} Days Active</h4>
                <p className="text-[10px] text-slate-500">Practice quizzes daily to unlock perfect score multipliers.</p>
              </div>
            </div>

            {/* Trophy Count */}
            <div className="p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-[#1b1223]/60 to-slate-950/80 backdrop-blur-md flex items-center gap-4 text-left" id="profile-trophy-bubble">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-mono font-bold uppercase text-slate-500 tracking-wider">Accomplishments</p>
                <h4 className="text-lg font-black text-white">{(progress?.badges || []).length} / 6 Earned</h4>
                <p className="text-[10px] text-slate-500">Participate in cognitive recall trials to unseal premium trophies.</p>
              </div>
            </div>
          </div>

          {/* Plots Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="overall-charts">
            {/* XP Growth Plot */}
            <div className="lg:col-span-8 p-6 rounded-3xl border border-white/10 bg-[#030712]/60 backdrop-blur-md text-left space-y-3" id="xp-growths-plot">
              <h3 className="text-slate-200 font-sans font-bold text-sm flex items-center gap-1.5">
                <Milestone className="w-4 h-4 text-violet-400" /> Cognitive Growth Rate & XP Accumulations
              </h3>
              <p className="text-slate-400 text-xs">Accumulated recall points and learning dynamics plotted consecutively.</p>

              <div className="h-[250px] w-full shrink-0" id="progress-chart-holder">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cumulativeXPData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
                    <Tooltip contentStyle={{ background: "#090d16", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: "11px" }} />
                    <Legend />
                    <Line type="monotone" dataKey="XP" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#c084fc" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject Division Pie */}
            <div className="lg:col-span-4 p-6 rounded-3xl border border-white/10 bg-[#030712]/60 backdrop-blur-md text-left space-y-3" id="subject-pie-plot">
              <h3 className="text-slate-200 font-sans font-bold text-sm flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" /> Focus Splits
              </h3>
              <p className="text-slate-400 text-xs">Aesthetic distribution mapping note domains accessed.</p>

              <div className="h-[180px]" id="pie-chart-holder">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#090d16", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center pt-2" id="pie-labels">
                {pieChartData.map((data, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-300 bg-white/5 py-1 px-2.5 rounded-full border border-white/5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    {data.name} ({data.value})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Badges Gallery View */}
          <div className="p-6 rounded-3xl border border-white/10 bg-[#030712]/60 backdrop-blur-md text-left space-y-4" id="inventory-badges">
            <h3 className="text-slate-200 font-sans font-bold text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-yellow-500" /> Honor Inventory & Achievements
            </h3>
            <p className="text-slate-400 text-xs">Visual badges earned as you successfully demonstrate topic recall.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4" id="badges-grid">
              {progress?.badges && progress.badges.length > 0 ? (
                progress.badges.map((b, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-black/40 border border-violet-500/10 text-center flex flex-col items-center justify-center space-y-2 hover:border-violet-500/40 transition-all duration-300" id={`badge-cell-${idx}`}>
                    <span className="text-2xl animate-pulse">{b.icon}</span>
                    <h4 className="text-[11px] font-sans font-extrabold text-slate-200 uppercase tracking-wider truncate max-w-full leading-none">{b.label}</h4>
                    <p className="text-[9px] text-slate-500 leading-tight font-sans block truncate max-w-full">{b.desc}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-slate-600 text-xs flex flex-col items-center justify-center gap-2" id="empty-inventory">
                  <HelpCircle className="w-8 h-8 text-slate-700" />
                  <span>Earn specialized trophies by achieving score percentages above 80% on interactive quizzes!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Cognitive Diagnostics Module View */
        <div className="space-y-6 animate-fade-in text-left" id="diagnostics-viewport">
          {/* Target Note Selector card panel */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="diagnostics-target-selector">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-violet-400 font-bold uppercase tracking-wider">Select Notebook Scope</span>
              <h3 className="text-slate-100 font-sans font-black text-sm">Target Subject Diagnostic Hud</h3>
            </div>

            {userNotes.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No notes uploaded yet. Go to upload panel to compile files first.</span>
            ) : (
              <select
                value={selectedNote?.id || ""}
                onChange={(e) => {
                  const found = userNotes.find(n => n.id === e.target.value);
                  if (found) setSelectedNote(found);
                }}
                className="bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500 cursor-pointer min-w-[200px]"
                id="notes-dropdown-selector"
              >
                {userNotes.map((n) => (
                  <option key={n.id} value={n.id} className="bg-slate-950 text-slate-300">
                    {n.title.slice(0, 32)}{n.title.length > 32 ? "..." : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedNote ? (
            !selectedNote.diagnostics ? (
              /* If no diagnostic exists yet, show call-to-action compiler run */
              <div className="p-10 rounded-2xl border border-white/10 bg-white/5 text-center flex flex-col items-center justify-center max-w-xl mx-auto" id="diagnostics-scanner-lock shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-violet-650/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5 animate-pulse">
                  <Brain className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-sans font-bold text-white">Generate Cognitive Diagnostic Report</h3>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                  Analyze your active notebook: "{selectedNote.title}". We will inspect paragraph complexity, evaluate test performance metrics (if any exist), and map out visual mastery curves, milestones and gaps.
                </p>

                {diagnosticError && (
                  <p className="text-rose-400 text-xs bg-red-950/20 p-2.5 rounded-lg border border-red-900/30 mt-4 max-w-sm">
                    {diagnosticError}
                  </p>
                )}

                <button
                  onClick={runDiagnosticAnalysis}
                  disabled={loadingDiagnostics}
                  className="mt-6 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-500/25 disabled:opacity-40"
                  id="trigger-scanner-btn"
                >
                  {loadingDiagnostics ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Diagnosing Notes Concepts...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 shrink-0" /> Run AI Diagnostic Scanner
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Diagnostics Dashboard Active viewport */
              <div className="space-y-6" id="diagnostic-dashboard-active">
                
                {/* 1. CONCEPT MASTERY SCORES HUD */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="concept-mastery-score-hud">
                  {/* composite mastery circle */}
                  <div className="p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#1b122c]/80 to-slate-950/90 flex flex-col items-center justify-center text-center shadow-lg shadow-violet-500/5 md:col-span-1 border-violet-500/30 relative overflow-hidden" id="composite-score-gauge">
                    <div className="absolute top-2 left-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                    </div>

                    <span className="text-[9px] font-mono text-violet-400 font-extrabold uppercase tracking-widest block mb-1">Composite Subject Mastery</span>
                    
                    <div className="relative flex items-center justify-center my-3 shrink-0">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                        <circle 
                          cx="48" cy="48" r="40" 
                          stroke="#a78bfa" strokeWidth="8" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 40} 
                          strokeDashoffset={2 * Math.PI * 40 * (1 - selectedNote.diagnostics.masteryScore / 100)} 
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <span className="absolute text-3xl font-black text-white">{selectedNote.diagnostics.masteryScore}%</span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-normal max-w-[140px]">Dynamic aggregate of text completions & practice quiz attempts.</p>
                  </div>

                  {/* Individual breakdown gauges */}
                  <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4" id="breakdown-scores-hud">
                    {/* Gauge 1: Understanding */}
                    <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/60 flex flex-col justify-between" id="score-understanding">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-violet-400 tracking-wider font-bold uppercase">Understanding Score</span>
                          <Brain className="w-4 h-4 text-violet-400 shrink-0" />
                        </div>
                        <h4 className="text-2xl font-black text-white font-sans mt-2">{selectedNote.diagnostics.understandingScore}%</h4>
                        <p className="text-[10px] text-slate-500 mt-1 lines-clamp-2 leading-relaxed">Evaluation of textbook comprehension, logical divisions, and mindmap study time.</p>
                      </div>

                      <div className="w-full bg-black/40 rounded-full h-2 mt-4 overflow-hidden">
                        <div className="bg-violet-400 h-full rounded-full" style={{ width: `${selectedNote.diagnostics.understandingScore}%` }} />
                      </div>
                    </div>

                    {/* Gauge 2: Revision */}
                    <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/60 flex flex-col justify-between" id="score-revision">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-rose-400 tracking-wider font-bold uppercase">Revision Score</span>
                          <CheckSquare className="w-4 h-4 text-rose-400 shrink-0" />
                        </div>
                        <h4 className="text-2xl font-black text-white font-sans mt-2">{selectedNote.diagnostics.revisionScore}%</h4>
                        <p className="text-[10px] text-slate-500 mt-1 lines-clamp-2 leading-relaxed">Revision completed mapped to checklist milestones achieved on the learning roadmap.</p>
                      </div>

                      <div className="w-full bg-black/40 rounded-full h-2 mt-4 overflow-hidden">
                        <div className="bg-rose-400 h-full rounded-full" style={{ width: `${selectedNote.diagnostics.revisionScore}%` }} />
                      </div>
                    </div>

                    {/* Gauge 3: Quiz Score */}
                    <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/60 flex flex-col justify-between" id="score-quiz">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-cyan-400 tracking-wider font-bold uppercase">Quiz score</span>
                          <Award className="w-4 h-4 text-cyan-400 shrink-0" />
                        </div>
                        <h4 className="text-2xl font-black text-white font-sans mt-2">
                          {selectedNote.diagnostics.quizScore > 0 ? `${selectedNote.diagnostics.quizScore}%` : "0%"}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1 lines-clamp-2 leading-relaxed">Comprehension testing outputs achieved. Take the AI exam quiz to feed this metric.</p>
                      </div>

                      <div className="w-full bg-black/40 rounded-full h-2 mt-4 overflow-hidden">
                        <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${selectedNote.diagnostics.quizScore}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid 2: Roadmaps & Gaps core panels */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2" id="roadmaps-and-gaps">
                  
                  {/* 2. KNOWLEDGE GAP DETECTOR PANEL */}
                  <div className="lg:col-span-5 p-6 rounded-3xl border border-white/10 bg-[#030712]/60 backdrop-blur-md space-y-4" id="gap-detector-panel">
                    <h3 className="text-slate-200 font-sans font-bold text-sm flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> AI Knowledge Gap Detector
                    </h3>
                    <p className="text-slate-400 text-xs">Weak concepts identified. Perform recommended quick corrective study actions:</p>

                    <div className="space-y-4" id="gaps-list">
                      {selectedNote.diagnostics.weakConcepts && selectedNote.diagnostics.weakConcepts.length > 0 ? (
                        selectedNote.diagnostics.weakConcepts.map((item, index) => (
                          <div 
                            key={index} 
                            className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl space-y-2 relative"
                            id={`gap-card-${index}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-sans font-extrabold text-xs text-amber-300 capitalize">
                                {item.concept}
                              </span>
                              <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-mono">
                                weak topic
                              </span>
                            </div>
                            
                            <p className="text-[11px] text-slate-400 leading-normal">
                              <strong>Diagnostic Reason:</strong> {item.reason}
                            </p>

                            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]" id={`gap-footer-${index}`}>
                              <span className="text-slate-500 font-sans">
                                Review: <strong className="text-white font-medium">{item.revisionTopic}</strong>
                              </span>
                              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5 border border-amber-500/20 bg-amber-950/20 px-2 py-1 rounded-lg">
                                <Compass className="w-3.5 h-3.5" /> {item.suggestedAction}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-xs text-slate-500" id="no-gaps">
                          No cognitive gaps found! Keep up the smart work.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. PERSONALIZED LEARNING ROADMAP TREE */}
                  <div className="lg:col-span-7 p-6 rounded-3xl border border-white/10 bg-[#030712]/60 backdrop-blur-md space-y-4" id="learning-roadmap-panel">
                    <h3 className="text-slate-200 font-sans font-bold text-sm flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <Compass className="w-4 h-4 text-emerald-400" /> Personalized Learning Path & Roadmap
                    </h3>
                    <p className="text-slate-400 text-xs">Track your progression stages. Check off milestones once mastered to build overall score:</p>

                    <div className="space-y-6 relative pl-4 before:content-[''] before:absolute before:left-[21px] before:top-3 before:bottom-3 before:w-px before:bg-white/5" id="roadmap-tree">
                      
                      {/* PHASE 1: BASICS */}
                      <div className="space-y-3 relative" id="roadmap-phase-1">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[14px] h-[14px] rounded-full bg-violet-500 shadow-sm shadow-violet-500 z-10 shrink-0" />
                          <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-violet-300">Phase 1: Basics & Foundations</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 pl-3.5" id="roadmap-phase-1-milestones">
                          {selectedNote.diagnostics.basics.map((miles, idx) => {
                            const isDone = !!completedMilestones[miles];
                            return (
                              <button
                                key={idx}
                                onClick={() => handleToggleMilestone(miles)}
                                className={`w-full flex items-center justify-between text-left p-3.5 rounded-xl border transition-all text-xs cursor-pointer select-none ${
                                  isDone 
                                    ? "bg-violet-950/15 border-violet-500/50 text-slate-100 font-bold" 
                                    : "bg-black/20 border-white/5 text-slate-400 hover:bg-white/5"
                                }`}
                                id={`miles-btn-basic-${idx}`}
                              >
                                <span className="pr-4 leading-normal">{miles}</span>
                                <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 ${isDone ? "bg-violet-500 border-violet-400 text-white" : "border-slate-700 bg-transparent"}`}>
                                  {isDone && <Check className="w-3.5 h-3.5" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* PHASE 2: INTERMEDIATE */}
                      <div className="space-y-3 relative" id="roadmap-phase-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[14px] h-[14px] rounded-full bg-indigo-500 shadow-sm shadow-indigo-500 z-10 shrink-0" />
                          <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-300">Phase 2: Intermediate Core Mechanisms</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 pl-3.5" id="roadmap-phase-2-milestones">
                          {selectedNote.diagnostics.intermediate.map((miles, idx) => {
                            const isDone = !!completedMilestones[miles];
                            return (
                              <button
                                key={idx}
                                onClick={() => handleToggleMilestone(miles)}
                                className={`w-full flex items-center justify-between text-left p-3.5 rounded-xl border transition-all text-xs cursor-pointer select-none ${
                                  isDone 
                                    ? "bg-indigo-950/20 border-indigo-500/55 text-slate-100 font-bold" 
                                    : "bg-black/20 border-white/5 text-slate-400 hover:bg-white/5"
                                }`}
                                id={`miles-btn-inter-${idx}`}
                              >
                                <span className="pr-4 leading-normal">{miles}</span>
                                <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 ${isDone ? "bg-indigo-500 border-indigo-400 text-white" : "border-slate-700 bg-transparent"}`}>
                                  {isDone && <Check className="w-3.5 h-3.5" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* PHASE 3: ADVANCED */}
                      <div className="space-y-3 relative" id="roadmap-phase-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[14px] h-[14px] rounded-full bg-emerald-500 shadow-sm shadow-emerald-500 z-10 shrink-0" />
                          <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-300">Phase 3: Advanced Concepts & Troubleshooting</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 pl-3.5" id="roadmap-phase-3-milestones">
                          {selectedNote.diagnostics.advanced.map((miles, idx) => {
                            const isDone = !!completedMilestones[miles];
                            return (
                              <button
                                key={idx}
                                onClick={() => handleToggleMilestone(miles)}
                                className={`w-full flex items-center justify-between text-left p-3.5 rounded-xl border transition-all text-xs cursor-pointer select-none ${
                                  isDone 
                                    ? "bg-emerald-950/20 border-emerald-500/50 text-slate-100 font-bold" 
                                    : "bg-black/20 border-white/5 text-slate-400 hover:bg-white/5"
                                }`}
                                id={`miles-btn-adv-${idx}`}
                              >
                                <span className="pr-4 leading-normal">{miles}</span>
                                <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 ${isDone ? "bg-emerald-500 border-emerald-400 text-white" : "border-slate-700 bg-transparent"}`}>
                                  {isDone && <Check className="w-3.5 h-3.5" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            )
          ) : (
            <div className="p-8 text-center text-slate-500 bg-white/5 rounded-2xl" id="diagnostic-empty-state">
              No active note has been selected. Go to Dashboard and pick a notebook first to unlock cognitive mapping details.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
