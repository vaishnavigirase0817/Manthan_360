import { useEffect, useState } from "react";
import { Note, Flashcard } from "../types";
import { generateNotesFlashcards } from "../services/api";
import { db } from "../services/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Layers, Sparkles, AlertCircle, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import Loader from "../components/Loader";

interface FlashcardsProps {
  focusedNote: Note | null;
  onUpdateNote: (updatedNote: Note) => void;
}

export default function Flashcards({ focusedNote, onUpdateNote }: FlashcardsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (!focusedNote) return;
    if (focusedNote.flashcards) return;

    const fetchFlashcards = async () => {
      setLoading(true);
      setError("");
      try {
        const cardsData = await generateNotesFlashcards(focusedNote.extractedText);

        const noteRef = doc(db, "notes", focusedNote.id);
        await updateDoc(noteRef, {
          flashcards: cardsData,
          updatedAt: new Date().toISOString(),
        });

        onUpdateNote({
          ...focusedNote,
          flashcards: cardsData,
        });
      } catch (e: any) {
        console.error(e);
        setError("Flashcards processing failed. Review network or parameters.");
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcards();
  }, [focusedNote]);

  const cards = focusedNote?.flashcards || [];

  const handleNext = () => {
    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
      }, 150);
    }
  };

  if (!focusedNote) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center" id="flash-empty-locked">
        <Layers className="w-12 h-12 text-slate-600 mb-4" />
        <h3 className="font-sans font-semibold text-slate-300">No Active Note Selected</h3>
        <p className="text-sm text-slate-500 max-w-xs mt-1">
          Please select a study material from the Dashboard to unlock flashcard revision.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6" id="flash-page-container">
      {/* Page Header */}
      <div className="pointer-events-none" id="flash-page-header">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            Active Recall Deck
          </span>
        </div>
        <h2 className="text-2xl font-sans font-black text-white mt-1">Study Flashcards</h2>
      </div>

      {loading && <Loader message="Gemini AI is parsing key statements and formatting interactive card items..." />}

      {error && (
        <div id="flash-error-banner" className="bg-red-950/40 border border-red-900/60 p-4 rounded-2xl flex items-center gap-3 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && cards.length > 0 && (
        <div className="max-w-xl mx-auto space-y-6" id="flash-deck-active">
          {/* Deck Counter Stats */}
          <div className="flex items-center justify-between px-2 text-slate-400 text-xs font-mono" id="flash-deck-status">
            <span>SUITE: {focusedNote.title}</span>
            <span>Card {currentIndex + 1} of {cards.length}</span>
          </div>

          {/* 3D Glassmorphic Flip Card Container */}
          <div
            id="flashcard-interactive-wrapper"
            onClick={() => setIsFlipped(!isFlipped)}
            className="group cursor-pointer perspective h-80 w-full relative"
          >
            <div
              id="flashcard-flipper"
              className={`w-full h-full duration-500 transform-style preserve-3d transition-all ${
                isFlipped ? "rotate-y-180" : ""
              }`}
            >
              {/* Front Side */}
              <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-900/80 to-slate-950 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-[#06b6d4]">
                  <span>Active recall question</span>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="flex-1 flex items-center justify-center text-center py-4">
                  <p className="text-base sm:text-lg font-sans font-semibold leading-relaxed text-slate-100">
                    {cards[currentIndex].question}
                  </p>
                </div>
                <p className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-wider">
                  Click / Tap to Flip Card
                </p>
              </div>

              {/* Back Side */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-[#0c0f1d] to-slate-950 border border-indigo-900/50 rounded-3xl p-8 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-[#a5b4fc]">
                  <span>Synthesized explanation</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="flex-1 flex items-center justify-center text-center py-4 overflow-y-auto">
                  <p className="text-sm sm:text-base font-sans font-medium leading-relaxed text-slate-200">
                    {cards[currentIndex].answer}
                  </p>
                </div>
                <p className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-wider">
                  Click / Tap to reveal Question
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between px-4" id="flash-navigation">
            <button
              onClick={handlePrev}
              id="flash-prev-btn"
              disabled={currentIndex === 0}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                currentIndex === 0
                  ? "opacity-30 border-slate-900 text-slate-600 bg-transparent cursor-not-allowed"
                  : "bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-300"
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            <button
              onClick={handleNext}
              id="flash-next-btn"
              disabled={currentIndex + 1 === cards.length}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                currentIndex + 1 === cards.length
                  ? "opacity-30 border-slate-900 text-slate-600 bg-transparent cursor-not-allowed"
                  : "bg-cyan-500 hover:bg-cyan-600 border-transparent text-slate-950 font-bold"
              }`}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
