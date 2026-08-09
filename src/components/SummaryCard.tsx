import { useState, useEffect } from "react";
import { SummaryData } from "../types";
import { 
  FileText, Volume2, VolumeX, List, HelpCircle, Copy, Check, Sparkles, 
  Play, Pause, Square, Headphones, Eye 
} from "lucide-react";

interface SummaryCardProps {
  summary: SummaryData;
  noteTitle: string;
}

export default function SummaryCard({ summary, noteTitle }: SummaryCardProps) {
  const [activeTab, setActiveTab] = useState<"cheat" | "points" | "detailed" | "short">("cheat");
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSynth(window.speechSynthesis);
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = () => {
    const textToCopy =
      activeTab === "cheat"
        ? summary.revisionNotes
        : activeTab === "points"
        ? summary.keyPoints.join("\n")
        : activeTab === "detailed"
        ? summary.detailedSummary
        : summary.shortSummary;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActiveText = () => {
    return activeTab === "cheat"
      ? summary.revisionNotes.replace(/[#*`_]/g, "") // remove markdown structural syntax for fluid voice speech
      : activeTab === "points"
      ? "Key Takeaways: " + summary.keyPoints.join(". ")
      : activeTab === "detailed"
      ? summary.detailedSummary
      : summary.shortSummary;
  };

  const speakText = () => {
    if (!synth) return;

    // Clear active utterance
    synth.cancel();

    const textToRead = getActiveText();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = playbackSpeed;

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    setIsSpeaking(true);
    setIsPaused(false);
    synth.speak(utterance);
  };

  const handlePause = () => {
    if (!synth) return;
    synth.pause();
    setIsPaused(true);
  };

  const handleResume = () => {
    if (!synth) return;
    synth.resume();
    setIsPaused(false);
  };

  const handleStop = () => {
    if (!synth) return;
    synth.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    // If speaking, restart speech immediately with updated velocity rate
    if (isSpeaking) {
      setTimeout(() => {
        if (!synth) return;
        synth.cancel();
        const textToRead = getActiveText();
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = speed;
        utterance.onerror = () => setIsSpeaking(false);
        utterance.onend = () => setIsSpeaking(false);
        setIsPaused(false);
        synth.speak(utterance);
      }, 100);
    }
  };

  // Raw parser of simple markdown segments
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="text-base font-bold text-violet-400 mt-4 mb-2 font-sans tracking-tight">{line.slice(4)}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-300 mt-5 mb-2 font-sans tracking-tight">{line.slice(3)}</h3>;
      }
      if (line.startsWith("# ")) {
        return <h2 key={idx} className="text-xl font-black text-white mt-6 mb-3 font-sans tracking-tight border-b border-white/5 pb-2">{line.slice(2)}</h2>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="flex items-start gap-2.5 my-1.5 text-xs leading-normal text-slate-300 font-sans">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full mt-2 shrink-0 shadow-sm shadow-violet-400" />
            <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong class='text-violet-200'>$1</strong>") }} />
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p
          key={idx}
          className="text-xs sm:text-sm leading-relaxed text-slate-400 my-2 font-sans"
          dangerouslySetInnerHTML={{
            __html: line.replace(/\*\*(.*?)\*\*/g, "<strong class='text-violet-300'>$1</strong>"),
          }}
        />
      );
    });
  };

  return (
    <div className="w-full bg-slate-900/30 border border-white/5 rounded-[24px] p-6 backdrop-blur-md" id={`summary-container-${noteTitle.replace(/\s+/g, "-")}`}>
      {/* Top Banner with Headers */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-6" id="summary-header">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-950/40 border border-violet-800/40 flex items-center justify-center text-violet-400 shadow-md">
            <FileText className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-left">
            <h3 className="font-sans font-black text-white text-base sm:text-lg">{noteTitle}</h3>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Compiled study packages</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto justify-end" id="summary-actions">
          <button
            onClick={handleCopy}
            id="summary-copy-btn"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                Copy Text
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dynamic TTS Learning Deck Console */}
      <div className="mb-6 p-4 rounded-2xl bg-black/40 border border-white/5 gap-4 flex flex-col md:flex-row md:items-center justify-between shadow-inner text-left" id="audio-learning-console">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Headphones className={`w-5 h-5 ${isSpeaking && !isPaused ? "animate-bounce" : ""}`} />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-violet-300 uppercase tracking-wider">Acoustic Learning Player</p>
            <p className="text-[11px] text-slate-400">Convert summaries or bullet lists to fluid speech reviews</p>
          </div>
        </div>

        {/* Console Play buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Speech action buttons */}
          {!isSpeaking ? (
            <button
              onClick={speakText}
              className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
            >
              <Play className="w-3.5 h-3.5" /> Speak Summary
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl">
              {isPaused ? (
                <button
                  onClick={handleResume}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase font-bold rounded-lg cursor-pointer transition-all"
                  title="Resume Speech"
                >
                  <Play className="w-3 h-3" /> Resume
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[10px] uppercase font-bold rounded-lg cursor-pointer transition-all"
                  title="Pause Speech"
                >
                  <Pause className="w-3 h-3" /> Pause
                </button>
              )}

              <button
                onClick={handleStop}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/30 text-rose-300 text-[10px] uppercase font-bold rounded-lg cursor-pointer transition-all"
                title="Stop Audios"
              >
                <Square className="w-3 h-3" /> Stop
              </button>
            </div>
          )}

          {/* Speed picker container */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-xl px-2.5 py-1.5">
            <span className="text-[10px] font-mono font-bold text-slate-400">SPEED:</span>
            <select
              value={playbackSpeed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="bg-transparent border-none text-[11px] font-mono font-bold text-violet-300 focus:outline-none cursor-pointer"
            >
              <option value="0.75" className="bg-slate-900 text-white">0.75x</option>
              <option value="1.0" className="bg-slate-900 text-white">1.0x (Normal)</option>
              <option value="1.25" className="bg-slate-900 text-white">1.25x</option>
              <option value="1.5" className="bg-slate-900 text-white">1.5x</option>
              <option value="1.75" className="bg-slate-900 text-white">1.75x</option>
              <option value="2.0" className="bg-slate-900 text-white">2.0x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5 pb-px mb-6 overflow-x-auto gap-2" id="summary-tabs-list">
        {[
          { id: "cheat", label: "Revision cheat sheet" },
          { id: "points", label: "Core facts" },
          { id: "detailed", label: "Detailed analysis" },
          { id: "short", label: "Executive overview" },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`summary-tab-btn-${tab.id}`}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (synth && isSpeaking) {
                synth.cancel();
                setIsSpeaking(false);
                setIsPaused(false);
              }
            }}
            className={`px-4 py-2 text-[10px] font-mono font-bold tracking-wider uppercase border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "border-violet-500 text-violet-300 bg-violet-955/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Screen Render */}
      <div id="summary-tab-container" className="bg-slate-950/70 border border-white/5 rounded-[20px] p-6 min-h-[300px] text-left">
        {activeTab === "cheat" && (
          <div className="prose max-w-none text-slate-200" id="summary-tab-cheat">
            <div className="flex items-center gap-2 mb-4 text-[#c084fc]">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="text-xs font-mono uppercase tracking-widest font-bold">AI Companion Guide</span>
            </div>
            {renderMarkdown(summary.revisionNotes)}
          </div>
        )}

        {activeTab === "points" && (
          <div id="summary-tab-points">
            <div className="flex items-center gap-2 mb-4 text-[#c084fc]">
              <List className="w-4 h-4 shrink-5" />
              <span className="text-xs font-mono uppercase tracking-widest font-bold">Key takeaway facts</span>
            </div>
            <ul className="space-y-3">
              {summary.keyPoints.map((pt, index) => (
                <li
                  key={index}
                  className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/20 transition-all text-left"
                >
                  <span className="w-6 h-6 rounded-full bg-violet-950 text-violet-400 border border-violet-900/60 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-xs sm:text-sm leading-relaxed text-slate-300 font-sans font-semibold">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "detailed" && (
          <div className="prose max-w-none" id="summary-tab-detailed">
            <div className="flex items-center gap-2 mb-4 text-[#c084fc]">
              <Headphones className="w-4 h-4 shrink-5" />
              <span className="text-xs font-mono uppercase tracking-widest font-bold">Comprehensive Study breakdown</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-300 font-sans font-semibold pl-2">{summary.detailedSummary}</p>
          </div>
        )}

        {activeTab === "short" && (
          <div className="prose max-w-none" id="summary-tab-short">
            <div className="flex items-center gap-2 mb-4 text-[#c084fc]">
              <Eye className="w-4 h-4 shrink-5" />
              <span className="text-xs font-mono uppercase tracking-widest font-bold font-black">Executive summary</span>
            </div>
            <p className="text-sm font-semibold leading-relaxed italic text-transparent bg-clip-text bg-gradient-to-r from-violet-200 to-fuchsia-100 font-sans border-l-2 border-violet-500 pl-4 py-1">
              "{summary.shortSummary}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
