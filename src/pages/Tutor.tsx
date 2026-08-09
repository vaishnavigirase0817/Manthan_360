import { useState, useEffect, useRef, FormEvent } from "react";
import { Note, FirebaseUser, ChatMessage } from "../types";
import { getTutorCorrection } from "../services/api";
import { db } from "../services/firebase";
import { doc, getDocs, setDoc, query, collection, where } from "firebase/firestore";
import { MessageSquare, Send, Sparkles, User, AlertCircle, Bot } from "lucide-react";
import Loader from "../components/Loader";

interface TutorProps {
  focusedNote: Note | null;
  user: FirebaseUser | null;
}

export default function Tutor({ focusedNote, user }: TutorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingSession, setFetchingSession] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sessionId = focusedNote && user ? `chat_${focusedNote.id}_${user.uid}` : "";

  // Scroll to bottom helper
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat session from Firestore
  useEffect(() => {
    if (!focusedNote || !user) return;

    const loadChatSession = async () => {
      setFetchingSession(true);
      setError("");
      try {
        const q = query(
          collection(db, "chatSessions"),
          where("id", "==", sessionId)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          const sessionData = snap.docs[0].data();
          setMessages(sessionData.messages || []);
        } else {
          // Initialize a brand new session with a friendly tutor welcoming message
          const initialMessage: ChatMessage = {
            role: "assistant",
            content: `Hello! I am your dedicated Manthan360 Study Tutor for: "${focusedNote.title}". I have reviewed your scanned content. You can ask me to define terms, summarize logic, explain complex stages, or test your retrieval. What topic should we clarify first?`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };

          // Store in Firestore
          await setDoc(doc(db, "chatSessions", sessionId), {
            id: sessionId,
            userId: user.uid,
            noteId: focusedNote.id,
            messages: [initialMessage],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          setMessages([initialMessage]);
        }
      } catch (e: any) {
        console.error("Firestore Chat Load Error:", e);
        setError("Failed to retreive tutor chat logs.");
      } finally {
        setFetchingSession(false);
      }
    };

    loadChatSession();
  }, [focusedNote, user]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading || !focusedNote || !user) return;

    const userMessageText = inputValue.trim();
    setInputValue("");
    setError("");

    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Fetch response from Gemini Express API Tutor Route
      const tutorAnswer = await getTutorCorrection(updatedMessages, focusedNote.extractedText);

      const newTutorMessage: ChatMessage = {
        role: "assistant",
        content: tutorAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const finalMessages = [...updatedMessages, newTutorMessage];
      setMessages(finalMessages);

      // Save updated messages chain back into Firestore
      await setDoc(doc(db, "chatSessions", sessionId), {
        id: sessionId,
        userId: user.uid,
        noteId: focusedNote.id,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      console.error("Gemini AI Tutor Error:", e);
      setError("Tutoring system connection lost. Check credentials or internet connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!focusedNote) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center" id="tutor-empty-locked">
        <MessageSquare className="w-12 h-12 text-slate-600 mb-4" />
        <h3 className="font-sans font-semibold text-slate-300">No Active Note Selected</h3>
        <p className="text-sm text-slate-500 max-w-xs mt-1">
          Please select a study material from the Dashboard to activate your custom AI Tutor conversation room.
        </p>
      </div>
    );
  }

  if (fetchingSession) {
    return <Loader message="Reconnecting to your custom study chat logs..." />;
  }

  return (
    <div className="w-full flex flex-col h-[calc(100vh-140px)] border border-slate-800 bg-slate-900/10 backdrop-blur-md rounded-3xl overflow-hidden" id="tutor-page-wrapper">
      {/* Tutor Lobby Header */}
      <div id="tutor-chat-header" className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-400 to-purple-500 flex items-center justify-center text-white">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
              AI Classroom Companion
            </span>
            <h3 className="text-slate-100 text-sm font-sans font-bold max-w-xs sm:max-w-md truncate leading-tight">
              {focusedNote.title}
            </h3>
          </div>
        </div>
        <span className="hidden sm:inline-flex text-[9px] font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-900/30 px-2.5 py-1 rounded-full uppercase">
          Strict Context Lock
        </span>
      </div>

      {error && (
        <div id="tutor-error-banner" className="bg-red-950/30 border-b border-red-900/40 px-6 py-3 flex items-center gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Messages Scroll Box */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/10 scrollbar-thin scrollbar-thumb-slate-900" id="tutor-messages-box">
        {messages.map((m, index) => {
          const isAssistant = m.role === "assistant";
          return (
            <div
              key={index}
              id={`tutor-msg-${index}`}
              className={`flex items-start gap-3.5 max-w-[85%] ${isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                  isAssistant
                    ? "bg-slate-950 border-slate-800 text-cyan-400"
                    : "bg-cyan-950/80 border-cyan-800/40 text-cyan-200"
                }`}
              >
                {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="space-y-1">
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isAssistant
                      ? "bg-slate-900/80 border border-slate-800/80 text-slate-100 font-sans"
                      : "bg-gradient-to-tr from-cyan-950/40 to-indigo-950/20 border border-cyan-900/40 text-cyan-50"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                <span className={`block text-[9px] font-mono text-slate-500 ${isAssistant ? "text-left" : "text-right"}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-4 mr-auto max-w-[80%]" id="tutor-thinking-indicator">
            <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 text-cyan-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/55 border border-slate-800/60 flex items-center gap-2">
              <div className="flex gap-1 items-center" id="typing-dots">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce shrink-0" style={{ animationDelay: "0ms" }} />
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce shrink-0" style={{ animationDelay: "150ms" }} />
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce shrink-0" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs text-slate-400 font-mono pl-1">AI Tutor is drafting answer...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSendMessage} id="tutor-input-form" className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-2 focus-within:border-cyan-500 transition-all">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask question about Mitosis, Biology mechanisms, definitions..."
            className="flex-1 bg-transparent border-none text-slate-100 text-sm font-sans focus:outline-none pl-3 placeholder:text-slate-600"
            disabled={loading}
            id="tutor-input-field"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            id="tutor-send-btn"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              inputValue.trim() && !loading
                ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow shadow-cyan-500/10"
                : "bg-slate-900 text-slate-600 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </form>
    </div>
  );
}
