import React, { useEffect, useState } from "react";
import { FirebaseUser, Note } from "../types";
import { collection, query, where, getDocs, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../services/firebase";
import { 
  BookOpen, Award, Layers, Sparkles, FolderOpen, Calendar, ArrowRight, Play, 
  Search, Trash2, Download, AlertCircle, CheckCircle2, ChevronDown, CheckSquare, Square
} from "lucide-react";
import Loader from "../components/Loader";
import { useLanguage } from "../context/LanguageContext";
import { TRANSLATIONS } from "../translations";

interface DashboardProps {
  user: FirebaseUser | null;
  onSelectNote: (note: Note) => void;
  focusedNote: Note | null;
  onUpdateNote?: (note: Note | null) => void;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ user, onSelectNote, focusedNote, onUpdateNote, setActiveTab }: DashboardProps) {
  const { selectedLanguage } = useLanguage();
  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.English;

  const [notes, setNotes] = useState<Note[]>([]);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search & Filter & Selection States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"dateDesc" | "dateAsc" | "nameAsc" | "nameDesc">("dateDesc");
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());

  // Confirmations & loaders & toasts
  const [deleteConfirmNote, setDeleteConfirmNote] = useState<Note | null>(null);
  const [deleteConfirmMultiple, setDeleteConfirmMultiple] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      const notesPath = "notes";
      const attemptsPath = "quizAttempts";
      try {
        // Fetch notes owned by current user
        const notesQuery = query(
          collection(db, notesPath),
          where("userId", "==", user.uid)
        );
        const notesSnap = await getDocs(notesQuery);
        const loadedNotes: Note[] = [];
        notesSnap.forEach((docSnap) => {
          loadedNotes.push(docSnap.data() as Note);
        });

        // Sort descending by creation date client side to avoid manual index requirements
        loadedNotes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotes(loadedNotes);

        // Fetch quiz attempts owned by user
        const attemptsQuery = query(
          collection(db, attemptsPath),
          where("userId", "==", user.uid)
        );
        const attemptsSnap = await getDocs(attemptsQuery);
        setTotalAttempts(attemptsSnap.size);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, notesPath);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Toast trigger
  const triggerAutoToast = (text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Delete Individual Note
  const handleDeleteSingle = async () => {
    if (!deleteConfirmNote) return;
    setIsDeleting(true);
    try {
      const targetId = deleteConfirmNote.id;

      // 1. Delete main note doc
      await deleteDoc(doc(db, "notes", targetId));

      // 2. Query & delete related quizzes
      const quizQuery = query(collection(db, "quizzes"), where("noteId", "==", targetId));
      const quizSnap = await getDocs(quizQuery);
      const batch = writeBatch(db);
      quizSnap.forEach((d) => {
        batch.delete(d.ref);
      });

      // 3. Query & delete related chat sessions
      const chatQuery = query(collection(db, "chatSessions"), where("noteId", "==", targetId));
      const chatSnap = await getDocs(chatQuery);
      chatSnap.forEach((d) => {
        batch.delete(d.ref);
      });

      await batch.commit();

      // Clear selection if deleted note is the focused one
      if (focusedNote?.id === targetId && onUpdateNote) {
        onUpdateNote(null);
      }

      // Update local states
      setNotes((prev) => prev.filter((n) => n.id !== targetId));
      setSelectedNoteIds((prev) => {
        const copy = new Set(prev);
        copy.delete(targetId);
        return copy;
      });

      triggerAutoToast(t.deleteSuccess);
    } catch (err) {
      console.error("Deletion failure:", err);
      triggerAutoToast(t.deleteError, true);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmNote(null);
    }
  };

  // Delete Multiple Notes
  const handleDeleteMultiple = async () => {
    if (selectedNoteIds.size === 0) return;
    setIsDeleting(true);
    try {
      const idsToDelete: string[] = Array.from(selectedNoteIds);

      for (const targetId of idsToDelete) {
        await deleteDoc(doc(db, "notes", targetId));

        const quizQuery = query(collection(db, "quizzes"), where("noteId", "==", targetId));
        const quizSnap = await getDocs(quizQuery);
        const batch = writeBatch(db);
        quizSnap.forEach((d) => {
          batch.delete(d.ref);
        });

        const chatQuery = query(collection(db, "chatSessions"), where("noteId", "==", targetId));
        const chatSnap = await getDocs(chatQuery);
        chatSnap.forEach((d) => {
          batch.delete(d.ref);
        });

        await batch.commit();

        if (focusedNote?.id === targetId && onUpdateNote) {
          onUpdateNote(null);
        }
      }

      setNotes((prev) => prev.filter((n) => !selectedNoteIds.has(n.id)));
      setSelectedNoteIds(new Set());
      triggerAutoToast(t.deleteSuccess);
    } catch (err) {
      console.error("Bulk deletion failure:", err);
      triggerAutoToast(t.deleteError, true);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmMultiple(false);
    }
  };

  // Dynamic filter / sort computations
  const filteredNotes = notes
    .filter((note) => {
      const queryLower = searchQuery.toLowerCase();
      const matchesSearch = 
        note.title.toLowerCase().includes(queryLower) ||
        (note.fileName && note.fileName.toLowerCase().includes(queryLower)) ||
        (note.extractedText && note.extractedText.toLowerCase().includes(queryLower));

      if (showRecentOnly) {
        // Created within the last 48 hours to be considered recent
        const noteAgeMs = Date.now() - new Date(note.createdAt).getTime();
        const fortyEightHoursInMs = 48 * 60 * 60 * 1000;
        return matchesSearch && noteAgeMs <= fortyEightHoursInMs;
      }
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "dateDesc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "dateAsc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "nameAsc") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "nameDesc") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

  // Checkbox functions
  const handleToggleSelectAll = () => {
    if (filteredNotes.length === 0) return;
    const allSelected = filteredNotes.every((n) => selectedNoteIds.has(n.id));
    if (allSelected) {
      // Unselect all of the currently filtered items
      setSelectedNoteIds((prev) => {
        const copy = new Set(prev);
        filteredNotes.forEach((n) => copy.delete(n.id));
        return copy;
      });
    } else {
      // Select all of the currently filtered items
      setSelectedNoteIds((prev) => {
        const copy = new Set(prev);
        filteredNotes.forEach((n) => copy.add(n.id));
        return copy;
      });
    }
  };

  const handleToggleSelectCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNoteIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) {
        copy.delete(id);
      } else {
        copy.add(id);
      }
      return copy;
    });
  };

  if (loading) {
    return <Loader message="Compiling your study cockpit..." />;
  }

  const allFilteredAreSelected = filteredNotes.length > 0 && filteredNotes.every((n) => selectedNoteIds.has(n.id));

  return (
    <div className="w-full space-y-8 animate-fade-in" id="dashboard-container">
      
      {/* Toast Alert Feedback */}
      {toast && (
        <div 
          id="dashboard-toast-feedback"
          className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl border backdrop-blur-md animate-slide-in transition-all ${
            toast.isError
              ? "bg-rose-950/90 border-rose-500/30 text-rose-200"
              : "bg-emerald-950/90 border-emerald-500/30 text-emerald-200"
          }`}
        >
          {toast.isError ? <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />}
          <span className="text-xs font-bold font-sans">{toast.text}</span>
        </div>
      )}

      {/* Individual Delete Confirmer */}
      {deleteConfirmNote && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" id="single-delete-modal">
          <div className="bg-[#0f172a] border border-white/10 rounded-[24px] p-6 max-w-sm w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h4 className="text-md sm:text-lg font-bold font-sans">Delete Study Note?</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              "{deleteConfirmNote.title}"<br /><br />
              Are you sure you want to delete this note? This will also purge all related quizzes, chat sessions, flashcards, slide presentations, mind maps, and diagnostics.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteConfirmNote(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-slate-300 transition-all cursor-pointer"
              >
                {t.cancelBtn}
              </button>
              <button
                onClick={handleDeleteSingle}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-xs font-bold rounded-xl text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : t.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multiple Delete Confirmer */}
      {deleteConfirmMultiple && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" id="bulk-delete-modal">
          <div className="bg-[#0f172a] border border-white/10 rounded-[24px] p-6 max-w-sm w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h4 className="text-md sm:text-lg font-bold font-sans">Delete Selected Notes?</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete the <strong>{selectedNoteIds.size}</strong> selected study notes? This action is permanent and clears all related AI modules.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteConfirmMultiple(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-slate-300 transition-all cursor-pointer"
              >
                {t.cancelBtn}
              </button>
              <button
                onClick={handleDeleteMultiple}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-xs font-bold rounded-xl text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : t.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div
        id="dashboard-welcome-banner"
        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform pointer-events-none">
          <svg className="w-64 h-64 text-violet-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>

        <div className="space-y-4 relative z-10">
          <span className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-xs font-semibold inline-block border border-violet-500/30 font-sans tracking-wide">
            Active Study Cockpit
          </span>
          <h2 className="text-3xl sm:text-4xl font-sans font-black text-white leading-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">{user?.displayName || "Student"}</span>!
          </h2>
          <p className="text-slate-400 text-sm max-w-sm">
            Review stats, pull up recent OCR extractions, or activate learning modules with the generative sidebar.
          </p>
        </div>
        <div className="shrink-0 relative z-10">
          <button
            onClick={() => setActiveTab("upload")}
            id="dash-upload-action"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-6 py-3.5 rounded-2xl transition-all cursor-pointer shadow-lg shadow-violet-500/30"
          >
            <FolderOpen className="w-4 h-4 shrink-0" />
            {t.uploadButton}
          </button>
        </div>
      </div>

      {/* Grid of Key Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="dashboard-statistics">
        {/* Card 1: Total Notes */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center gap-4" id="stat-total-notes">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <BookOpen className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-white">{notes.length}</span>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mt-0.5">{t.dashboard}</p>
          </div>
        </div>

        {/* Card 2: Quizzes Attempted */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center gap-4" id="stat-quiz-attempts">
          <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-white">{totalAttempts}</span>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mt-0.5">{t.quiz}</p>
          </div>
        </div>

        {/* Card 3: Active Note Focused */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center gap-4" id="stat-active-material">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Layers className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate pr-2">
              {focusedNote ? focusedNote.title : "None Active"}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mt-0.5">Active Workspace</p>
          </div>
        </div>
      </div>

      {/* Grid: Study Modules Selection or Empty State */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="dashboard-main-section">
        {/* Column 1 & 2: Study Materials */}
        <div className="lg:col-span-2 space-y-6" id="dashboard-materials-panel">
          
          <div className="space-y-4" id="materials-header-block">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-violet-400" />
                <h3 className="font-sans font-bold text-slate-100 text-base">{t.studyNotes}</h3>
                <span className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">{notes.length} Available</span>
              </div>

              {/* Bulk action buttons */}
              {notes.length > 0 && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    {allFilteredAreSelected ? <CheckSquare className="w-3.5 h-3.5 text-violet-400" /> : <Square className="w-3.5 h-3.5" />}
                    <span>{t.selectAll}</span>
                  </button>

                  <button
                    onClick={() => setDeleteConfirmMultiple(true)}
                    disabled={selectedNoteIds.size === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-950/20 hover:bg-rose-900 border-rose-500/30 text-xs font-semibold text-rose-300 hover:text-rose-100 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-950/20 disabled:hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.deleteSelected} ({selectedNoteIds.size})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Premium Search and Filtering Controls Row */}
            {notes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3" id="materials-ux-controls">
                
                {/* Search notes bar */}
                <div className="relative sm:col-span-6">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-500/70 transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Sort selector dropdown */}
                <div className="relative sm:col-span-3">
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500/70 transition-all appearance-none cursor-pointer"
                  >
                    <option value="dateDesc">{t.sortByDate} (Newest)</option>
                    <option value="dateAsc">{t.sortByDate} (Oldest)</option>
                    <option value="nameAsc">{t.sortByName} (A-Z)</option>
                    <option value="nameDesc">{t.sortByName} (Z-A)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>

                {/* Recent notes filter toggle */}
                <button
                  onClick={() => setShowRecentOnly(!showRecentOnly)}
                  className={`w-full sm:col-span-3 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    showRecentOnly
                      ? "bg-violet-950/40 border-violet-500/50 text-violet-300"
                      : "bg-slate-900/60 border-white/10 text-slate-450 hover:bg-slate-800/60 text-slate-200"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t.recentNotesFilter}</span>
                </button>
              </div>
            )}
          </div>

          {notes.length === 0 ? (
            <div className="min-h-[220px] rounded-3xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-center p-8" id="materials-empty-box">
              <BookOpen className="w-10 h-10 text-slate-600 mb-4" />
              <h4 className="font-sans font-semibold text-slate-300">No Custom Study Notes Recorded</h4>
              <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                {t.emptyNotes}
              </p>
              <button
                onClick={() => setActiveTab("upload")}
                id="empty-action-btn"
                className="mt-6 text-xs font-sans font-bold bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-500/25 animate-pulse"
              >
                Go to Upload Console
              </button>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="min-h-[220px] rounded-3xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-center p-8" id="materials-empty-filtered">
              <Search className="w-8 h-8 text-slate-550 mb-3" />
              <h4 className="font-sans font-medium text-slate-400 text-sm">No Match Found for "{searchQuery}"</h4>
              <p className="text-[11px] text-slate-500 mt-1">Try adjusting search letters or resetting recent notes filters.</p>
              <button
                onClick={() => { setSearchQuery(""); setShowRecentOnly(false); }}
                className="mt-4 px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/10 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in" id="materials-list">
              {filteredNotes.map((note) => {
                const isActive = focusedNote?.id === note.id;
                const isChecked = selectedNoteIds.has(note.id);
                return (
                  <div
                    key={note.id}
                    id={`note-catalog-card-${note.id}`}
                    onClick={() => onSelectNote(note)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between h-[180px] group relative ${
                      isActive
                        ? "bg-violet-950/25 border-violet-500 shadow-lg shadow-violet-500/10 hover:border-violet-400"
                        : "bg-white/5 border-white/10 hover:border-violet-500/50 hover:bg-white/10"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Multi select checkbox */}
                          <div 
                            onClick={(e) => handleToggleSelectCard(note.id, e)}
                            className="bg-[#020617]/80 hover:bg-violet-950 p-1.5 rounded-lg border border-white/10 transition-colors"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 text-violet-400" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
                            )}
                          </div>

                          <span className="text-[9px] font-mono text-slate-400 bg-black/40 border border-white/5 px-2 py-0.5 rounded-md uppercase">
                            {note.fileName ? note.fileName.split(".").pop() : "txt"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${note.status === "completed" ? "bg-emerald-400" : "bg-violet-400 animate-pulse"}`} />
                          <span className="text-[10px] font-mono text-slate-400 capitalize">{note.status}</span>
                        </div>
                      </div>

                      <h4 className="font-sans font-bold text-slate-100 text-xs sm:text-sm mt-3 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                        {note.title}
                      </h4>
                    </div>

                    {/* Quick premium action strip row with Open, Download, Delete */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* Open/View */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectNote(note);
                          }}
                          className="p-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-white transition-all text-[11px] font-bold flex items-center gap-1 shadow-md shadow-violet-500/25"
                          title="Open Material"
                        >
                          <Play className="w-3 h-3 shrink-0" />
                          <span className="hidden xs:inline">{t.openBtn}</span>
                        </button>

                        {/* Download */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (note.fileUrl) {
                              window.open(note.fileUrl, "_blank");
                            } else {
                              // Direct dynamic download fallback of notes text
                              const blob = new Blob([note.extractedText], { type: "text/plain;charset=utf-8" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `${note.title.replace(/\s+/g, "_")}_notes.txt`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              triggerAutoToast("Text content downloaded successfully.");
                            }
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg text-slate-300 transition-all border border-white/5"
                          title="Download Original / Extracted Text"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmNote(note);
                          }}
                          className="p-1.5 bg-rose-950/20 hover:bg-rose-900 text-rose-400 hover:text-rose-100 border border-rose-500/20 rounded-lg transition-all"
                          title="Delete Material"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 3: Active Revision Dashboard Workspace */}
        <div className="space-y-4" id="dashboard-workspace-helper">
          <div className="flex items-center gap-2 pointer-events-none">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h3 className="font-sans font-bold text-slate-100 text-base">Module Launcher</h3>
          </div>

          <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md space-y-4" id="workspace-action-card">
            {focusedNote ? (
              <div className="space-y-4" id="workspace-unlocked">
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-sans font-black">Selected Subject</span>
                  <p className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">{focusedNote.title}</p>
                </div>
                
                <span className="text-xs font-serif text-slate-400 leading-relaxed block">
                  Select a practice module to study revisions and testing resources:
                </span>

                <div className="grid grid-cols-1 gap-2" id="workspace-links">
                  {[
                    { id: "summary", label: "Summaries & Cheat Sheets" },
                    { id: "flashcards", label: "Revision Flashcard Deck" },
                    { id: "quiz", label: "Interactive Exam Quiz" },
                    { id: "tutor", label: "Consult AI Study Tutor" },
                    { id: "mindmap", label: "Visual Mind Map Tree" },
                    { id: "flowchart", label: "Process Flowchart Stages" },
                  ].map((module) => (
                    <button
                      key={module.id}
                      id={`ws-launcher-btn-${module.id}`}
                      onClick={() => setActiveTab(module.id)}
                      className="w-full flex items-center justify-between text-left p-3 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 hover:border-violet-500/30 transition-all text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                    >
                      <span>{module.label}</span>
                      <Play className="w-3 h-3 text-violet-400 animate-pulse" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6" id="workspace-locked">
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Initialize a study material by selecting an listed card on the left directory or compiling a new file.
                </p>
                <button
                  onClick={() => setActiveTab("upload")}
                  id="workspace-lock-action"
                  className="text-xs font-bold font-sans bg-violet-650 hover:bg-violet-600 border border-white/10 px-4 py-2.5 rounded-xl text-white transition-all cursor-pointer shadow-md shadow-violet-550/20"
                >
                  Create Study Notes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
