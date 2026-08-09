import { useState, useEffect, useRef } from "react";
import { Note, FirebaseUser, SlideItem } from "../types";
import { generateNotesSlides } from "../services/api";
import { db } from "../services/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, 
  ChevronRight, ChevronLeft, Video, AlertCircle, Settings,
  Sliders, ArrowUpRight, Check, MonitorPlay, Zap
} from "lucide-react";
import Loader from "../components/Loader";

interface LearningVideosProps {
  focusedNote: Note | null;
  onUpdateNote: (note: Note) => void;
  user: FirebaseUser | null;
}

type StyleTheme = "cyberpunk" | "cosmic" | "forest" | "minimal" | "sunset";

export default function LearningVideos({ focusedNote, onUpdateNote, user }: LearningVideosProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Player state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [narrationSpeed, setNarrationSpeed] = useState(1);
  const [theme, setTheme] = useState<StyleTheme>("cosmic");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  const [slideProgress, setSlideProgress] = useState(0); // 0 to 100 for current slide duration

  const progressIntervalRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load SpeechSynthesis voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        // Find a default English or nice sounding voice
        const defaultVoice = voices.find(v => v.lang.includes("en-US") && v.name.includes("Natural")) || 
                             voices.find(v => v.lang.includes("en")) || 
                             voices[0];
        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
        }
      }
    };

    loadVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      cancelSpeech();
    };
  }, []);

  // Stop narration
  const cancelSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (currentUtteranceRef.current) {
      currentUtteranceRef.current = null;
    }
  };

  // Autoplay and slide progress timer logic
  useEffect(() => {
    if (isPlaying) {
      // Clear existing interval
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      
      // Start or resume speech narration of current slide
      speakNarration();

      // Start progress timer bar (roughly simulating speech duration or slide timing)
      const totalSteps = 100;
      const durationMs = 12000; // 12 seconds default slide estimation if speech is too short/long
      const stepMs = durationMs / totalSteps;

      progressIntervalRef.current = setInterval(() => {
        setSlideProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressIntervalRef.current);
            // Auto transition to next slide if playing
            handleNextSlide();
            return 0;
          }
          return prev + 1;
        });
      }, stepMs);
    } else {
      // Paused
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.pause();
      }
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, currentSlideIndex]);

  // Speak slide narration helper
  const speakNarration = () => {
    if (!focusedNote || !focusedNote.slides || focusedNote.slides.length === 0) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    cancelSpeech();

    if (isMuted) return;

    const currentSlide = focusedNote.slides[currentSlideIndex];
    const speechText = currentSlide.narration;

    const utterance = new SpeechSynthesisUtterance(speechText);
    
    // Assign voice
    if (selectedVoiceName) {
      const voice = availableVoices.find(v => v.name === selectedVoiceName);
      if (voice) utterance.voice = voice;
    }

    utterance.rate = narrationSpeed;

    utterance.onend = () => {
      // Let standard progress timer trigger slide advance, or speed it up
      setSlideProgress(100);
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    
    // In case speech is paused, resume
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };

  const generateSlidesWorkflow = async () => {
    if (!focusedNote || loading) return;
    setLoading(true);
    setError("");
    try {
      const deck = await generateNotesSlides(focusedNote.extractedText);
      
      // Update in Firestore
      await updateDoc(doc(db, "notes", focusedNote.id), {
        slides: deck,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      onUpdateNote({
        ...focusedNote,
        slides: deck,
        updatedAt: new Date().toISOString(),
      });

      setCurrentSlideIndex(0);
      setSlideProgress(0);
    } catch (e: any) {
      console.error("Failed to compile slides:", e);
      setError(e.message || "Failed to compile animated video slideshow. Verify your server configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextSlide = () => {
    if (!focusedNote || !focusedNote.slides) return;
    cancelSpeech();
    setSlideProgress(0);
    if (currentSlideIndex < focusedNote.slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      // Ended the video
      setIsPlaying(false);
      setCurrentSlideIndex(0);
    }
  };

  const handlePrevSlide = () => {
    if (!focusedNote || !focusedNote.slides) return;
    cancelSpeech();
    setSlideProgress(0);
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // Resume synthesis if checked
      if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        setIsPlaying(true);
      }
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      // Fast replay speech on unmute
      setTimeout(() => {
        if (isPlaying) {
          speakNarration();
        }
      }, 50);
    } else {
      setIsMuted(true);
      cancelSpeech();
    }
  };

  const handleRestartVideo = () => {
    cancelSpeech();
    setSlideProgress(0);
    setCurrentSlideIndex(0);
    setIsPlaying(true);
  };

  if (!focusedNote) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center" id="videos-no-note-container">
        <Video className="w-12 h-12 text-slate-600 mb-4 animate-bounce" />
        <h3 className="font-sans font-semibold text-slate-300">No Target Subject Active</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Select an uploaded note notebook from the Dashboard to compile structural slide concepts and generate an interactive video learning experience.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8" id="videos-loading-bay">
        <Loader message="AI Director is synthesizing study summaries, creating slide frames, and scripting custom narrations..." />
      </div>
    );
  }

  const slides = focusedNote.slides || [];
  const activeSlide = slides[currentSlideIndex];

  // Define Themes styling arrays
  const themeClasses: Record<StyleTheme, { container: string; card: string; accent: string; title: string; bullets: string }> = {
    cosmic: {
      container: "bg-slate-950 border-violet-900/40 shadow-violet-950/20",
      card: "bg-gradient-to-br from-slate-900/60 via-slate-950/80 to-indigo-950/20 border border-violet-500/20",
      accent: "text-violet-400 bg-violet-950/40 border-violet-800/40",
      title: "text-white bg-clip-text text-transparent bg-gradient-to-r from-violet-200 via-white to-indigo-200",
      bullets: "text-slate-300 border-l border-violet-500/30 pl-4",
    },
    cyberpunk: {
      container: "bg-black border-cyan-800/60 shadow-cyan-950/20",
      card: "bg-gradient-to-br from-black via-[#080f14] to-[#120419] border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/5",
      accent: "text-pink-400 bg-pink-950/40 border-pink-700/40 font-mono",
      title: "text-cyan-300 font-sans tracking-tight uppercase border-b border-cyan-900/40 pb-2",
      bullets: "text-emerald-300 border-l-2 border-pink-500/60 pl-4 font-mono",
    },
    forest: {
      container: "bg-[#040d0c] border-emerald-900/40 shadow-emerald-950/10",
      card: "bg-gradient-to-br from-emerald-950/40 via-slate-950 to-[#0e211b]/40 border border-emerald-700/20",
      accent: "text-emerald-400 bg-emerald-950/50 border-emerald-800/40",
      title: "text-teal-50 bg-clip-text text-transparent bg-gradient-to-r from-emerald-100 to-white",
      bullets: "text-slate-300 border-l border-emerald-500/20 pl-4",
    },
    minimal: {
      container: "bg-slate-900 border-slate-700/45",
      card: "bg-slate-900/90 border border-slate-800",
      accent: "text-slate-200 bg-slate-800/60 border-slate-700/40",
      title: "text-white font-sans",
      bullets: "text-slate-400 border-l border-slate-700 pl-4",
    },
    sunset: {
      container: "bg-[#0d070b] border-pink-900/40 shadow-pink-950/10",
      card: "bg-gradient-to-br from-slate-950 via-[#180a13] to-[#240c11]/40 border border-pink-500/20",
      accent: "text-orange-400 bg-orange-950/40 border-orange-850/40",
      title: "text-white bg-clip-text text-transparent bg-gradient-to-r from-rose-200 via-white to-orange-200",
      bullets: "text-rose-100/90 border-l border-rose-500/30 pl-4",
    },
  };

  return (
    <div className="w-full space-y-6 animate-fade-in text-left" id="animated-videos-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="videos-header">
        <div>
          <div className="flex items-center gap-2">
            <MonitorPlay className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-widest">
              AI Dynamic Media
            </span>
          </div>
          <h2 className="text-2xl font-sans font-black text-white mt-1">Animated Slide Learning Videos</h2>
          <p className="text-slate-400 text-xs">Transform study raw texts into narrated slideshow video presentations</p>
        </div>

        {slides.length > 0 && (
          <button
            onClick={generateSlidesWorkflow}
            className="text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl border border-white/10 flex items-center gap-2 transition-all cursor-pointer"
            id="regenerate-slides-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Re-Compile Slides
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 flex items-start gap-3 text-red-200 text-sm" id="videos-error-alert">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {slides.length === 0 ? (
        /* Empty Slide State / Initialize Compilation */
        <div className="p-10 rounded-2xl border border-white/10 bg-white/5 text-center flex flex-col items-center justify-center max-w-xl mx-auto" id="videos-compilation-lobby">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5 animate-pulse">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-sans font-bold text-white leading-tight">Generate Interactive Video Workshop</h3>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            Let the Gemini cognitive engine organize your target materials under 5 structural slide layouts with professional voice descriptions and descriptive illustrations.
          </p>

          <button
            onClick={generateSlidesWorkflow}
            className="mt-6 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-500/20"
            id="compile-video-deck-btn"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            Compile Slide Narratives
          </button>
        </div>
      ) : (
        /* Video Player Interface */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="video-theater-layout">
          {/* Main Cinematic Video Presentation Screen */}
          <div className="lg:col-span-2 space-y-4" id="visual-presentation-viewport">
            {/* Aspect Widescreen Screen Container */}
            <div 
              className={`relative overflow-hidden rounded-3xl border shadow-2xl aspect-video transition-all duration-500 ${themeClasses[theme].container}`}
              id="presentation-screen"
            >
              {/* Virtual Moving particles/grid matching theme */}
              <div className="absolute inset-0 opacity-15 pointer-events-none z-0">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
                <div className="w-full h-full bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
              </div>

              {/* Dynamic Theme ambient orb glows */}
              <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[100px] pointer-events-none z-0 opacity-50 bg-violet-600/20" />
              {isPlaying && (
                <div className="absolute -bottom-[20%] -right-[10%] w-[45%] h-[45%] rounded-full blur-[90px] pointer-events-none z-0 opacity-40 bg-indigo-500/30 animate-pulse" style={{ animationDuration: "8s" }} />
              )}

              {/* Slide Core Content frame */}
              <div className="absolute inset-0 flex flex-col justify-between p-8 sm:p-10 z-10" id="slide-stage">
                {/* Upper Status Line */}
                <div className="flex items-center justify-between" id="slide-header">
                  <div className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-widest uppercase border ${themeClasses[theme].accent}`}>
                    Slide {currentSlideIndex + 1} / {slides.length}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span>AI Synthesized Topic</span>
                  </div>
                </div>

                {/* Central Concept & Bullets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center flex-1 my-4" id="slide-core-info">
                  {/* Text panel */}
                  <div className="md:col-span-3 space-y-4 text-left">
                    <h3 className={`text-xl sm:text-2xl font-black leading-tight ${themeClasses[theme].title}`} id="slide-topic-title">
                      {activeSlide.title}
                    </h3>
                    
                    <ul className="space-y-2.5" id="slide-bullet-list">
                      {activeSlide.bullets.map((b, idx) => (
                        <li 
                          key={idx} 
                          className={`text-xs sm:text-sm leading-relaxed transition-all duration-300 ${themeClasses[theme].bullets} font-medium`}
                          style={{ transitionDelay: `${idx * 150}ms` }}
                        >
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Accents / Illustrated prompt box */}
                  <div className="md:col-span-2" id="slide-illustration-frame">
                    <div className={`p-4 rounded-2xl bg-black/40 border border-white/5 text-left relative overflow-hidden group`}>
                      <span className="text-[8px] font-mono uppercase text-slate-500 tracking-wider block">Visual Model Concept</span>
                      <p className="text-[11px] text-violet-300 font-mono italic mt-1 leading-normal line-clamp-3">
                        "{activeSlide.illustrationPrompt}"
                      </p>
                      
                      <div className="mt-3 p-3 bg-white/5 border border-white/5 rounded-xl text-left">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Key Axiom</span>
                        <p className="text-xs font-semibold text-slate-100 line-clamp-2">
                          {activeSlide.accentText}
                        </p>
                      </div>

                      {/* Accent pulse indicator when narration active */}
                      {isPlaying && (
                        <div className="absolute top-2 right-2 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lower timeline tracking bar */}
                <div className="w-full space-y-2" id="slide-footer-timeline">
                  {/* Spoken subtitle display strip */}
                  <div className="bg-black/60 px-4 py-2.5 border border-white/5 rounded-xl flex items-center justify-between" id="video-subtitle-bar">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-sans max-w-[85%]">
                      <Zap className={`w-3.5 h-3.5 text-yellow-400 ${isPlaying ? "animate-bounce" : ""}`} />
                      <p className="line-clamp-1 italic text-slate-300">"{activeSlide.narration}"</p>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 shrink-0">Subtitles Live</span>
                  </div>

                  {/* Slide progression bar line */}
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden" id="video-timeline-line">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-100"
                      style={{ width: `${slideProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Media Video console dashboard */}
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 flex flex-wrap items-center justify-between gap-4" id="video-controls-console">
              {/* Left group: Slide selector buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                  className="w-9 h-9 border border-white/5 bg-slate-950/40 text-slate-400 hover:text-white rounded-xl flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-xs font-mono font-bold text-slate-300 px-2 min-w-[70px] text-center">
                  Slide {currentSlideIndex + 1} / {slides.length}
                </div>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="w-9 h-9 border border-white/5 bg-slate-950/40 text-slate-400 hover:text-white rounded-xl flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Middle core play trigger buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRestartVideo}
                  title="Restart video"
                  className="p-3 border border-white/5 bg-slate-950/40 text-slate-400 hover:text-white rounded-xl cursor-pointer transition-all"
                  id="media-restart-btn"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  id="media-play-pause-btn"
                  className={`px-5 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    isPlaying 
                      ? "bg-amber-500 hover:bg-amber-400 text-slate-950" 
                      : "bg-violet-600 hover:bg-violet-500 text-white"
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-slate-950 stroke-none" /> Pause Presentation
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white stroke-none" /> Play Presentation
                    </>
                  )}
                </button>

                <button
                  onClick={handleToggleMute}
                  title={isMuted ? "Unmute Spoken AI Voice" : "Mute Spoken AI Voice"}
                  className="p-3 border border-white/5 bg-slate-950/40 text-slate-400 hover:text-white rounded-xl cursor-pointer transition-all"
                  id="media-mute-btn"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Right panel voice adjustors */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-black/20 border border-white/5 px-2.5 py-1.5 rounded-xl">
                  <span className="text-[9px] font-mono text-slate-500">SPEED:</span>
                  <select
                    value={narrationSpeed}
                    onChange={(e) => {
                      setNarrationSpeed(parseFloat(e.target.value));
                      // Fast restart speech if speaking to inject new speed
                      if (isPlaying) {
                        setTimeout(() => speakNarration(), 50);
                      }
                    }}
                    className="bg-transparent border-none text-xs font-bold font-sans text-slate-300 focus:outline-none cursor-pointer"
                    id="speech-speed-selector"
                  >
                    <option value="0.75" className="bg-slate-950 text-slate-200">0.75x</option>
                    <option value="1" className="bg-slate-950 text-slate-200">1.0x</option>
                    <option value="1.25" className="bg-slate-950 text-slate-200">1.25x</option>
                    <option value="1.5" className="bg-slate-950 text-slate-200">1.5x</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Presentation Theme and Voice Configuration */}
          <div className="space-y-6" id="video-configuration-panel">
            {/* Visual themes select */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/10 space-y-3" id="presentation-style-box">
              <h4 className="text-slate-100 font-sans font-bold text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-violet-400" /> Custom Presentation Style
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">Modify the visualization background aesthetics directly in real-time:</p>

              <div className="grid grid-cols-2 gap-2 pt-1" id="themes-grid">
                {(["cosmic", "cyberpunk", "forest", "sunset", "minimal"] as StyleTheme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-3 py-2 border rounded-xl text-xs font-semibold capitalize text-center transition-all cursor-pointer ${
                      theme === t 
                        ? "bg-violet-600/10 border-violet-500 text-violet-300 font-bold" 
                        : "bg-black/20 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Speaking Voice setup */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/10 space-y-3" id="voice-config-box">
              <h4 className="text-slate-100 font-sans font-bold text-sm flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-400" /> Speech Engine Configuration
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">Choose your synthesized reader voice preference from available browser engines:</p>

              {availableVoices.length === 0 ? (
                <div className="bg-black/20 border border-white/5 p-3 rounded-xl text-center text-[10px] text-slate-500" id="voices-fallback">
                  System voices loading... Using standard system assistant voice.
                </div>
              ) : (
                <div className="space-y-1.5" id="voices-selector">
                  <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Voice Name</label>
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => {
                      setSelectedVoiceName(e.target.value);
                      if (isPlaying) {
                        setTimeout(() => speakNarration(), 50);
                      }
                    }}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500 cursor-pointer"
                    id="sys-voices-dropdown"
                  >
                    {availableVoices
                      .filter(v => v.lang.includes("en") || v.lang.includes("en-US") || v.lang === "en")
                      .map((voice) => (
                        <option key={voice.name} value={voice.name} className="bg-slate-950 text-slate-300">
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="p-3 bg-violet-600/10 border border-violet-500/15 rounded-xl" id="tts-notes">
                <p className="text-[10px] text-violet-300 leading-relaxed font-sans">
                  <strong>Slide Auto-Flow Lock:</strong> Autoplay progresses dynamically. Subtitles stay aligned in real-time as slide timelines tick.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
