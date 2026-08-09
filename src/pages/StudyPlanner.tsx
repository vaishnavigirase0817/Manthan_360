import { useEffect, useState } from "react";
import { Note, StudyPlan } from "../types";
import { generateNotesStudyPlan } from "../services/api";
import { db } from "../services/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { 
  CalendarRange, Sparkles, AlertCircle, RefreshCw, Clock, Check, 
  Target, Lightbulb, CheckSquare, ListTodo
} from "lucide-react";
import Loader from "../components/Loader";

interface StudyPlannerProps {
  focusedNote: Note | null;
  onUpdateNote: (updatedNote: Note) => void;
}

export default function StudyPlanner({ focusedNote, onUpdateNote }: StudyPlannerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "tips">("daily");

  useEffect(() => {
    if (!focusedNote) return;
    if (focusedNote.studyPlan) return;

    const fetchPlanner = async () => {
      setLoading(true);
      setError("");
      try {
        const planData = await generateNotesStudyPlan(focusedNote.extractedText);

        const noteRef = doc(db, "notes", focusedNote.id);
        await updateDoc(noteRef, {
          studyPlan: planData,
          updatedAt: new Date().toISOString(),
        });

        onUpdateNote({
          ...focusedNote,
          studyPlan: planData,
        });
      } catch (e: any) {
        console.error(e);
        setError("AI Study Plan generation failed. Please recompile.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlanner();
  }, [focusedNote]);

  const handleRecompile = async () => {
    if (!focusedNote) return;
    setLoading(true);
    setError("");
    try {
      const planData = await generateNotesStudyPlan(focusedNote.extractedText);
      const noteRef = doc(db, "notes", focusedNote.id);
      await updateDoc(noteRef, {
        studyPlan: planData,
        updatedAt: new Date().toISOString(),
      });
      onUpdateNote({
        ...focusedNote,
        studyPlan: planData,
      });
    } catch (e: any) {
      console.error(e);
      setError("Failed to recompile Study Planner.");
    } finally {
      setLoading(false);
    }
  };

  const plan = focusedNote?.studyPlan;

  if (!focusedNote) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]" id="planner-empty-locked">
        <CalendarRange className="w-12 h-12 text-slate-600 mb-4 animate-bounce" />
        <h3 className="font-sans font-semibold text-slate-300">No Active Note Selected</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
          Open your Study Cockpit, choose a notebook, and let the AI compile custom daily & weekly schedules to optimize material mastery.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-in" id="planner-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="planner-page-header">
        <div>
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-widest">
              Accelerated Study Schedule
            </span>
          </div>
          <h2 className="text-2xl font-sans font-black text-white mt-1">AI Study Planner</h2>
          <p className="text-slate-400 text-xs mt-0.5">Custom routines designed to match cognitive load guidelines</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {plan && (
            <div className="flex bg-slate-950 p-1 border border-white/5 rounded-2xl" id="view-mode-tabs">
              <button
                onClick={() => setViewMode("daily")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  viewMode === "daily" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Daily Plan
              </button>
              <button
                onClick={() => setViewMode("weekly")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  viewMode === "weekly" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Weekly Routine
              </button>
              <button
                onClick={() => setViewMode("tips")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  viewMode === "tips" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Cognitive Tips
              </button>
            </div>
          )}

          <button
            onClick={handleRecompile}
            disabled={loading}
            className="flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all text-xs cursor-pointer"
            title="Recompile Study Schedules"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading && <Loader message="Gemini AI is parsing material weight to build optimized hourly routines and cognitive plans..." />}

      {error && (
        <div id="planner-error-banner" className="bg-red-950/40 border border-red-900/60 p-4 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Render Study Planner Modules */}
      {!loading && plan && (
        <div className="space-y-6" id="planner-content">
          {/* Daily Schedule view */}
          {viewMode === "daily" && (
            <div className="space-y-4 max-w-3xl mx-auto" id="daily-schedule-plan">
              <h3 className="text-slate-200 font-sans font-semibold text-sm flex items-center gap-2 border-b border-white/5 pb-2">
                <Clock className="w-4 h-4 text-violet-400" /> Hourly Time blocks
              </h3>
              
              <div className="relative border-l border-violet-500/30 ml-4 space-y-6 pl-6 py-2" id="timeline-flow border">
                {plan.dailyPlan.map((item, idx) => (
                  <div key={idx} className="relative group" id={`timeline-group-${idx}`}>
                    {/* Ring timeline bullet */}
                    <span className="absolute left-[-32px] top-1 w-4 h-4 rounded-full bg-slate-950 border-2 border-violet-500 flex items-center justify-center shadow shadow-violet-500" />
                    
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-violet-500/25 transition-all space-y-2 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-xs font-mono font-bold text-violet-400">{item.time}</span>
                        <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 w-fit">
                          {item.focus}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-sans font-bold text-slate-100">{item.task}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Routines view */}
          {viewMode === "weekly" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="weekly-schedule-grid">
              {plan.weeklyPlan.map((day, dIdx) => (
                <div key={dIdx} className="p-5 rounded-2xl border border-white/5 bg-slate-950/40 text-left flex flex-col justify-between" id={`weekly-day-card-${dIdx}`}>
                  <div>
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-3">
                      <span className="w-5 h-5 rounded-md bg-violet-600/20 text-violet-400 text-[10px] font-bold font-mono flex items-center justify-center">
                        W{dIdx + 1}
                      </span>
                      <h4 className="font-sans font-black text-white text-xs sm:text-sm">{day.day}</h4>
                    </div>
                    <p className="text-slate-300 font-sans font-semibold text-xs mb-3 truncate">
                      Topic: <span className="text-violet-300 font-bold">{day.topic}</span>
                    </p>
                    <ul className="space-y-2 text-slate-400 text-xs">
                      {day.objectives.map((obj, oIdx) => (
                        <li key={oIdx} className="flex items-start gap-2 text-xs leading-relaxed font-sans">
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Memorization advice view */}
          {viewMode === "tips" && (
            <div className="max-w-2xl mx-auto space-y-4" id="productivity-tips">
              <h3 className="text-slate-200 font-sans font-semibold text-sm flex items-center gap-2 border-b border-white/5 pb-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" /> Custom Academic Strategies
              </h3>
              
              <div className="grid grid-cols-1 gap-3.5" id="tips-grid-blocks">
                {plan.tips.map((tip, tIdx) => (
                  <div key={tIdx} className="p-4 rounded-2xl border border-white/5 bg-slate-950/20 text-left flex items-start gap-3.5" id={`tip-record-${tIdx}`}>
                    <span className="text-lg mt-0.5 shrink-0 select-none">💡</span>
                    <div>
                      <p className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-500 mb-1">STRATEGY #{tIdx + 1}</p>
                      <p className="text-slate-300 text-xs leading-relaxed font-sans font-semibold">{tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
