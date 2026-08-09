import { useEffect, useState } from "react";
import { Note, Quiz, QuizQuestion, FirebaseUser } from "../types";
import { generateNotesQuiz } from "../services/api";
import { db, handleFirestoreError, OperationType } from "../services/firebase";
import { doc, getDocs, setDoc, query, collection, where, addDoc } from "firebase/firestore";
import { Award, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import QuizCard from "../components/QuizCard";
import Loader from "../components/Loader";

interface QuizProps {
  focusedNote: Note | null;
  user: FirebaseUser | null;
}

export default function QuizRoom({ focusedNote, user }: QuizProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    if (!focusedNote || !user) return;

    const findOrCreateQuiz = async () => {
      setLoading(true);
      setError("");
      const quizzesPath = "quizzes";
      try {
        // Look up if an exam quiz was already compiled for this note
        const q = query(
          collection(db, quizzesPath),
          where("noteId", "==", focusedNote.id)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          // Loaded existing quiz
          const quizDoc = snap.docs[0];
          setActiveQuiz(quizDoc.data() as Quiz);
        } else {
          // Generate new quiz through Express proxy APIs
          const questionsList = await generateNotesQuiz(focusedNote.extractedText);
          const generatedQuizId = "quiz_" + Date.now();

          const newQuiz: Quiz = {
            id: generatedQuizId,
            userId: user.uid,
            noteId: focusedNote.id,
            noteTitle: focusedNote.title,
            questions: questionsList,
            createdAt: new Date().toISOString(),
          };

          // Save new quiz to database
          await setDoc(doc(db, quizzesPath, generatedQuizId), {
            id: newQuiz.id,
            userId: newQuiz.userId,
            noteId: newQuiz.noteId,
            noteTitle: newQuiz.noteTitle,
            questions: newQuiz.questions,
            createdAt: newQuiz.createdAt,
          });

          setActiveQuiz(newQuiz);
        }
      } catch (e: any) {
        console.error(e);
        setError("AI quiz generation failed. Check API keys or text contents.");
      } finally {
        setLoading(false);
      }
    };

    findOrCreateQuiz();
  }, [focusedNote, user]);

  if (!focusedNote) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center" id="quiz-empty-locked">
        <Award className="w-12 h-12 text-slate-600 mb-4" />
        <h3 className="font-sans font-semibold text-slate-300">No Active Note Selected</h3>
        <p className="text-sm text-slate-500 max-w-xs mt-1">
          Please select a study material from the Dashboard to unlock its quiz room.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6" id="quiz-page-container">
      {/* Page Header */}
      <div className="pointer-events-none" id="quiz-page-header">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            Comprehension testing
          </span>
        </div>
        <h2 className="text-2xl font-sans font-black text-white mt-1">Study Quiz Room</h2>
      </div>

      {loading && <Loader message="Gemini AI is examining document logic to generate 10 comprehensive evaluation questions..." />}

      {error && (
        <div id="quiz-error-banner" className="bg-red-950/40 border border-red-900/60 p-4 rounded-2xl flex items-center gap-3 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && activeQuiz && (
        <div id="active-quiz-view-wrapper">
          <QuizCard
            quizId={activeQuiz.id}
            questions={activeQuiz.questions}
            noteTitle={focusedNote.title}
            user={user}
          />
        </div>
      )}
    </div>
  );
}
