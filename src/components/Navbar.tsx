import { auth, logoutUser } from "../services/firebase";
import { LogOut, BookOpen, Sparkles, User, Globe } from "lucide-react";
import { FirebaseUser } from "../types";
import { useLanguage, SUPPORTED_LANGUAGES } from "../context/LanguageContext";

interface NavbarProps {
  user: FirebaseUser | null;
}

export default function Navbar({ user }: NavbarProps) {
  const { selectedLanguage, setLanguage } = useLanguage();

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    }
  };


  return (
    <nav
      id="main-navbar"
      className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/20 backdrop-blur-md px-6 py-4 flex items-center justify-between animate-fade-in"
    >
      <div id="navbar-brand" className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-sans font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Manthan360
          </span>
          <p className="text-[10px] text-slate-400 font-mono tracking-wider">Learn Beyond Notes</p>
        </div>
      </div>

      <div id="navbar-actions" className="flex items-center gap-4">
        {/* Global Language Selector */}
        <div className="flex items-center gap-2 bg-slate-900/60 border border-white/5 rounded-xl px-3 py-1.5 focus-within:border-violet-500/50 transition-all shadow-inner" id="language-selector-container">
          <Globe className="w-4 h-4 text-violet-400 animate-pulse" />
          <select
            id="global-language-selector"
            value={selectedLanguage}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-950 text-slate-200">
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>

        {user ? (
          <div className="flex items-center gap-3" id="navbar-user-profile">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium text-slate-200">{user.displayName || "Manthan360 Student"}</span>
              <span className="text-xs text-slate-400 font-mono">{user.email}</span>
            </div>
            
            {user.photoURL ? (
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-violet-500/50 p-0.5">
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="rounded-full bg-slate-700 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-violet-500/50 p-2 flex items-center justify-center hover:bg-slate-750 transition-colors">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}

            <button
              id="navbar-signout"
              onClick={handleSignOut}
              className="ml-2 flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/40 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-sm font-mono text-violet-400" id="navbar-guest-token">
            🔒 Guest Authorization
          </div>
        )}
      </div>
    </nav>
  );
}
