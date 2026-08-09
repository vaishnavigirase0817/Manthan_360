import { loginWithGoogle } from "../services/firebase";
import { Sparkles, GraduationCap, Code, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setIsUnauthorizedDomain(false);
    try {
      const user = await loginWithGoogle();
      onLoginSuccess(user);
    } catch (e: any) {
      console.error(e);
      const isAuthDomainErr = e?.code === "auth/unauthorized-domain" || String(e).includes("unauthorized-domain");
      if (isAuthDomainErr) {
        setIsUnauthorizedDomain(true);
        setError(`This preview domain '${window.location.hostname}' is not authorized in your Firebase Project configuration. Please add it to your Authorized Domains in the Firebase Console.`);
      } else {
        setError(e?.message || "Authorization denied or cancelled. Please review browser popup credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="login-page-container"
      className="min-h-screen bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden px-4"
    >
      {/* Dynamic Animated Nebula Background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-700" />

      {/* Main Glassmorphic Panel */}
      <motion.div
        id="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-slate-900/40 p-8 rounded-[32px] border border-white/10 backdrop-blur-xl text-center space-y-6 shadow-2xl relative z-10"
      >
        {/* Glowing Platform Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        {/* Catchy Hero Text */}
        <div id="login-brand-meta">
          <span className="text-[10px] font-mono font-bold text-violet-300 uppercase tracking-widest bg-violet-500/20 px-3 py-1.5 rounded-full border border-violet-500/30">
            Learn Beyond Notes
          </span>
          <h1 className="text-3xl font-sans font-black text-white mt-4 tracking-tight">
            Upload Notes. Learn Smarter.
          </h1>
          <p className="text-slate-400 text-xs mt-3 font-sans px-2 leading-relaxed">
            Transform notes into summaries, flowcharts, mind maps, quizzes, flashcards, and AI-powered learning experiences.
          </p>
        </div>

        {error && (
          <div id="login-error-banner" className="text-left text-xs text-rose-300 font-sans bg-rose-950/40 border border-rose-900/40 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold font-mono">
              <span>⚠️ Action Required</span>
            </div>
            <p className="leading-relaxed">{error}</p>
            {isUnauthorizedDomain && (
              <div className="mt-2 text-[11px] text-rose-200/90 space-y-1.5 font-mono pt-2 border-t border-rose-900/40">
                <p className="font-bold underline">To resolve in Firebase Console:</p>
                <ol className="list-decimal list-inside space-y-1 leading-normal">
                  <li>Open console for your Firebase Project</li>
                  <li>Go to <span className="text-white">Authentication</span> &rarr; <span className="text-white">Settings</span></li>
                  <li>Under <span className="text-white">Authorized domains</span>, add:</li>
                  <li className="text-emerald-300 select-all font-bold font-sans bg-slate-950/60 p-1 px-2 rounded-md border border-white/5 mt-1 block w-fit shrink-0">{window.location.hostname}</li>
                </ol>
                <p className="pt-2 italic text-[10px] text-rose-300/80">Tip: Click the Demo Account button below to test instantly!</p>
              </div>
            )}
          </div>
        )}

        {/* Standard Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          id="login-google-btn"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-4 px-6 rounded-2xl tracking-wide transition-all shadow-lg shadow-violet-500/20 active:scale-98 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-white animate-spin" />
          ) : (
            <>
              {/* Simple beautiful SVG for Google logo */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.19-5.136 4.19a5.79 5.79 0 0 1-5.79-5.79 5.79 5.79 0 0 1 5.79-5.79c2.25 0 4.18 1.21 5.23 3l3.66-2.5A11.76 11.76 0 0 0 12.24 0C5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.15 0 11.24-4.47 11.24-11.24 0-.79-.08-1.56-.24-2.285H12.24z"
                />
              </svg>
              <span>Connect with Google Auth</span>
            </>
          )}
        </button>

        {/* Demo Bypass Option */}
        <button
          onClick={() => {
            onLoginSuccess({
              uid: "demo_student_manthan360",
              email: "vaishnavigirase802@gmail.com",
              displayName: "Demo Student",
              photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
            });
          }}
          disabled={loading}
          id="login-demo-bypass-btn"
          className="w-full flex items-center justify-center gap-2 bg-slate-950/80 hover:bg-slate-900 border border-white/5 hover:border-violet-500/30 text-slate-300 hover:text-white font-medium py-3.5 px-6 rounded-2xl text-xs tracking-wide transition-all active:scale-98 cursor-pointer"
        >
          <span>Use Web Sandbox / Demo Account</span>
          <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
        </button>

        {/* Visual Pillars */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5" id="login-perks">
          <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/5">
            <GraduationCap className="w-5 h-5 text-indigo-400 mb-1" />
            <span className="text-[11px] font-semibold text-slate-300">Active Recall</span>
            <span className="text-[9px] text-slate-500 font-mono">Quizzes & Cards</span>
          </div>

          <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/5">
            <Code className="w-5 h-5 text-fuchsia-400 mb-1" />
            <span className="text-[11px] font-semibold text-slate-300">Cognitive Trees</span>
            <span className="text-[9px] text-slate-500 font-mono">Flowcharts & Maps</span>
          </div>
        </div>
      </motion.div>

      {/* Credit Footer */}
      <p className="absolute bottom-5 text-slate-600 text-xs font-mono" id="login-copyright">
        Manthan360 • Learn Beyond Notes
      </p>
    </div>
  );
}
