import { FirebaseUser, Note } from "../types";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import NoteUploader from "../components/NoteUploader";

interface UploadNotesProps {
  user: FirebaseUser | null;
  onUploaded: (note: Note) => void;
  setActiveTab: (tab: string) => void;
}

export default function UploadNotes({ user, onUploaded, setActiveTab }: UploadNotesProps) {
  return (
    <div className="w-full space-y-6" id="upload-notes-page">
      {/* Page Header */}
      <div className="flex items-center justify-between pointer-events-none" id="upload-page-header">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              Study Resource Bay
            </span>
          </div>
          <h2 className="text-2xl font-sans font-black text-white mt-1">Upload Revision Notes</h2>
        </div>
        <button
          onClick={() => setActiveTab("dashboard")}
          id="upload-back-btn"
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-350 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>

      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/10 backdrop-blur-md" id="upload-card-wrapper">
        <NoteUploader user={user} onUploaded={onUploaded} />
      </div>
    </div>
  );
}
