import { useState } from "react";
import { QuizQuestion, FirebaseUser } from "../types";
import { Award, CheckCircle, XCircle, ArrowRight, RotateCcw, Sparkles, Flame, Trophy, Calendar } from "lucide-react";
import { doc, addDoc, collection } from "firebase/firestore";
import { db } from "../services/firebase";
import { awardXPAndLogQuiz, UserProgressUpdate } from "../services/gamification";

interface QuizCardProps {
  quizId: string;
  questions: QuizQuestion[];
  noteTitle: string;
  user: FirebaseUser | null;
  onAttemptSaved?: () => void;
}

export default function QuizCard({ quizId, questions, noteTitle, user, onAttemptSaved }: QuizCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ questionIndex: number; selectedOption: string; isCorrect: boolean }[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gamifiedUpdate, setGamifiedUpdate] = useState<UserProgressUpdate | null>(null);

  const currentQuestion = questions[currentIndex];

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return; // Prevent changing after clicking
    setSelectedOption(option);
  };

  const handleNext = async () => {
    if (!selectedOption) return;

    // Log answer
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    const updateAnswers = [...answers, { questionIndex: currentIndex, selectedOption, isCorrect }];
    setAnswers(updateAnswers);

    setSelectedOption(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);

      // Save attempt to FireStore
      if (user) {
        setSaving(true);
        try {
          const score = updateAnswers.filter((a) => a.isCorrect).length;
          // 1. Log quiz attempt history
          await addDoc(collection(db, "quizAttempts"), {
            userId: user.uid,
            quizId: quizId,
            noteTitle: noteTitle,
            score: score,
            totalQuestions: questions.length,
            answers: updateAnswers,
            createdAt: new Date().toISOString(),
          });

          // 2. Award gamification XP & check badges/levels
          const updateResult = await awardXPAndLogQuiz(user.uid, score, questions.length);
          setGamifiedUpdate(updateResult);

          if (onAttemptSaved) onAttemptSaved();
        } catch (e) {
          console.error("Failed to commit quiz attempt:", e);
        } finally {
          setSaving(false);
        }
      }
    }
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers([]);
    setIsFinished(false);
    setGamifiedUpdate(null);
  };

  const score = answers.filter((a) => a.isCorrect).length;
  const percentage = Math.round((score / questions.length) * 100);

  // Gamified custom messaging
  const getFeedbackDetails = () => {
    if (percentage >= 90) return { title: "Outstanding Scholar!", desc: "Excellent work, your conceptual layout is pristine.", color: "text-emerald-400" };
    if (percentage >= 70) return { title: "Exam Ready!", desc: "Great retention! You've captured the core takeaways.", color: "text-violet-400" };
    if (percentage >= 50) return { title: "Making Progress", desc: "Decent grasp. Take a quick look at the flashcards to master the gaps.", color: "text-yellow-400" };
    return { title: "Needs Revision", desc: "No worries! Reset, review the AI summary notes and try again.", color: "text-rose-400" };
  };

  const feedback = getFeedbackDetails();

  return (
    <div className="w-full bg-slate-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-md" id={`quiz-container-${quizId}`}>
      {!isFinished ? (
        <div id="quiz-runner" className="space-y-6">
          {/* Header Stats */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4" id="quiz-runner-header">
            <div>
              <span className="text-xs font-mono font-semibold text-violet-400 uppercase tracking-widest">
                AI Knowledge Quiz
              </span>
              <h3 className="text-slate-200 text-sm font-sans mt-0.5 max-w-xs sm:max-w-md truncate">{noteTitle}</h3>
            </div>
            <span className="text-[11px] font-mono font-bold bg-slate-950 px-3 py-1.5 rounded-full border border-white/10 text-slate-400">
              Question <span className="text-violet-405">{currentIndex + 1}</span> of {questions.length}
            </span>
          </div>

          {/* Progress Tracker Line */}
          <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden" id="quiz-runner-progress-track">
            <div
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="bg-slate-950/40 p-6 border border-white/5 rounded-2xl" id="quiz-question-box">
            <h4 className="text-base sm:text-lg font-sans font-medium text-slate-100 leading-relaxed">
              {currentQuestion.question}
            </h4>
          </div>

          {/* Options Selection Menu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="quiz-options-list">
            {currentQuestion.options.map((option, index) => {
              const charOption = String.fromCharCode(65 + index); // A, B, C, D
              const isSelected = selectedOption === option;
              const isIncorrectChoice = isSelected && option !== currentQuestion.correctAnswer;
              const isCorrectAnswerReveal = selectedOption !== null && option === currentQuestion.correctAnswer;

              return (
                <button
                  key={index}
                  id={`quiz-option-btn-${index}`}
                  onClick={() => handleOptionSelect(option)}
                  disabled={selectedOption !== null}
                  className={`flex items-start text-left gap-4 p-4 rounded-xl border transition-all ${
                    isCorrectAnswerReveal
                      ? "bg-emerald-950/20 border-emerald-800 text-emerald-300"
                      : isIncorrectChoice
                      ? "bg-rose-950/25 border-rose-800 text-rose-300"
                      : isSelected
                      ? "bg-violet-950/40 border-violet-500 text-violet-200"
                      : "bg-slate-950/50 hover:bg-slate-900 border-white/5 text-slate-300 hover:text-white"
                  } cursor-pointer`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                      isCorrectAnswerReveal
                        ? "bg-emerald-900 text-emerald-200"
                        : isIncorrectChoice
                        ? "bg-rose-900 text-rose-200"
                        : isSelected
                        ? "bg-violet-900/60 text-violet-300"
                        : "bg-slate-900 border border-white/5 text-slate-400"
                    }`}
                  >
                    {charOption}
                  </span>
                  <span className="text-sm pt-0.5 leading-tight">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Option Answer Feedbacks */}
          {selectedOption !== null && (
            <div
              id="quiz-explanation"
              className={`p-4 rounded-2xl flex items-start gap-3 border ${
                selectedOption === currentQuestion.correctAnswer
                  ? "bg-emerald-950/15 border-emerald-900/30 text-emerald-300"
                  : "bg-rose-950/20 border-rose-900/30 text-rose-300"
              }`}
            >
              {selectedOption === currentQuestion.correctAnswer ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold">Correct response!</span> +25 XP credited to your profile.
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold">Incorrect response.</span> The correct answer was:{" "}
                    <span className="font-semibold text-emerald-300">"{currentQuestion.correctAnswer}"</span>.
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex justify-end pt-2" id="quiz-runner-footer">
            <button
              onClick={handleNext}
              id="quiz-next-btn"
              disabled={!selectedOption}
              className={`flex items-center gap-2 font-semibold text-sm py-3 px-6 rounded-xl transition-all ${
                selectedOption
                  ? "bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/10 cursor-pointer"
                  : "bg-slate-950 text-slate-600 border border-white/5 cursor-not-allowed"
              }`}
            >
              {currentIndex + 1 === questions.length ? "Finish Exam" : "Next Question"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div id="quiz-summary-card" className="space-y-6 animate-fade-in">
          {/* Finish Header */}
          <div className="text-center py-6 border-b border-white/5" id="quiz-summary-header">
            <Award className="w-16 h-16 mx-auto text-yellow-500 animate-bounce mb-4" />
            <h3 className={`text-2xl font-sans font-black ${feedback.color}`}>{feedback.title}</h3>
            <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">{feedback.desc}</p>

            {/* Score Ring */}
            <div className="inline-flex flex-col items-center justify-center p-6 border border-white/5 bg-slate-950/50 rounded-full mt-6" id="quiz-score-badge">
              <span className="text-3xl font-black text-white">{score} / {questions.length}</span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#a78bfa] mt-1 font-bold">Accuracy: {percentage}%</span>
            </div>
          </div>

          {/* Gamified Rewards HUD Panel */}
          {gamifiedUpdate && (
            <div className="bg-violet-950/20 border border-violet-500/20 rounded-2xl p-5 max-w-md mx-auto space-y-4 shadow-xl" id="gamified-rewards-hud">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] font-mono uppercase text-violet-400 font-bold tracking-widest">Active Gamification Recap</span>
                <span className="text-xs font-mono font-bold text-violet-300">Level {gamifiedUpdate.progress.level}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-slate-300">XP point balance:</span>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono">+{gamifiedUpdate.xpGained} XP</span>
              </div>

              {gamifiedUpdate.leveledUp && (
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-500/20 via-violet-500/10 to-transparent border border-amber-500/30 rounded-xl animate-bounce">
                  <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">LEVEL UP UPGRADE!</p>
                    <p className="text-[10px] text-slate-300">Advanced to master ranking LEVEL {gamifiedUpdate.progress.level}</p>
                  </div>
                </div>
              )}

              {gamifiedUpdate.newBadges.length > 0 && (
                <div className="space-y-2 text-left pt-2 border-t border-white/5">
                  <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-violet-400" /> UNSEALED ACADEMIC BADGES
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {gamifiedUpdate.newBadges.map((badge, bIdx) => (
                      <span key={bIdx} className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                        🏅 {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Review answers */}
          <div id="quiz-answers-review" className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400 border-b border-white/5 pb-2">
              <Sparkles className="w-4 h-4 shrink-0 text-violet-400" />
              <span className="text-xs font-mono uppercase tracking-wider font-bold">Answer keys breakdown</span>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800" id="review-questions-list">
              {questions.map((quiz, index) => {
                const ans = answers.find((a) => a.questionIndex === index);
                const checkCorrect = ans?.isCorrect ?? false;

                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl border bg-slate-950/40 space-y-2 text-left"
                    style={{ borderColor: checkCorrect ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)" }}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`w-5 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                        checkCorrect ? "bg-emerald-950 text-emerald-400" : "bg-rose-951 text-rose-400"
                      }`}>
                        Q{index + 1}
                      </span>
                      <p className="text-xs font-semibold text-slate-200 leading-relaxed font-sans">{quiz.question}</p>
                    </div>
                    <div className="pl-7 text-[11px] space-y-1 font-sans">
                      <p className="text-slate-400">
                        Your input: <span className={checkCorrect ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>"{ans?.selectedOption}"</span>
                      </p>
                      {!checkCorrect && (
                        <p className="text-emerald-400 font-semibold">
                          Expected target: <span className="font-bold">"{quiz.correctAnswer}"</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Score retake container */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5 shadow-inner" id="quiz-summary-footer">
            <span className="text-slate-400 text-xs font-mono">
              {saving ? "🔄 Writing data records..." : "✅ Profile log saved"}
            </span>
            <button
              id="quiz-retake-btn"
              onClick={handleRetake}
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-white/5 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white font-semibold py-2.5 px-6 rounded-xl text-xs tracking-wider transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              Retake Exam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
