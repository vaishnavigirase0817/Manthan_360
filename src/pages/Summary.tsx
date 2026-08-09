import { useEffect, useState } from "react";
import { Note, SummaryData } from "../types";
import { generateNotesSummary } from "../services/api";
import { db, handleFirestoreError, OperationType } from "../services/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { BrainCircuit, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import SummaryCard from "../components/SummaryCard";
import Loader from "../components/Loader";

interface SummaryProps {
  focusedNote: Note | null;
  onUpdateNote: (updatedNote: Note) => void;
}

export default function Summary({ focusedNote, onUpdateNote }: SummaryProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!focusedNote) return;

    // If summary already exists in this note, do not re-generate
    if (focusedNote.summary) return;

    const triggerSummaryGeneration = async () => {
      setLoading(true);
      setError("");
      const notesPath = "notes";
      try {
        // Trigger Express Gemini Summarization Proxy
        const summaryData = await generateNotesSummary(focusedNote.extractedText);

        // Update Firestore Note Document with summary data
        const noteRef = doc(db, notesPath, focusedNote.id);
        await updateDoc(noteRef, {
          summary: summaryData,
          status: "completed",
          updatedAt: new Date().toISOString(),
        });

        // Callback to parent React state
        onUpdateNote({
          ...focusedNote,
          summary: summaryData,
          status: "completed",
        });
      } catch (e: any) {
        console.error("Failed to generate summary:", e);
        setError("AI summarizes failed. Verify system key configuration or try again.");
      } finally {
        setLoading(false);
      }
    };

    triggerSummaryGeneration();
  }, [focusedNote]);

  if (!focusedNote) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center" id="summary-empty-locked">
        <BrainCircuit className="w-12 h-12 text-slate-600 mb-4" />
        <h3 className="font-sans font-semibold text-slate-300">No Active Note Selected</h3>
        <p className="text-sm text-slate-500 max-w-xs mt-1">
          Please choose a study material from the Dashboard to unlock AI summarizes.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6" id="summary-page">
      {/* Page Header */}
      <div className="pointer-events-none" id="summary-page-header">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            AI Synthesis Module
          </span>
        </div>
        <h2 className="text-2xl font-sans font-black text-white mt-1">Study Summaries</h2>
      </div>

      {loading && <Loader message="Gemini AI is analyzing material context and drafting summarized formats..." />}

      {error && (
        <div id="summary-error-banner" className="bg-red-950/40 border border-red-900/60 p-4 rounded-2xl flex items-center gap-3 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && focusedNote.summary && (
        <div id="summary-result-render">
          <SummaryCard summary={focusedNote.summary} noteTitle={focusedNote.title} />
        </div>
      )}
    </div>
  );
}
