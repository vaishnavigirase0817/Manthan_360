import { useEffect, useState } from "react";
import { Note, MindNode } from "../types";
import { generateNotesMindmap } from "../services/api";
import { db } from "../services/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { 
  GitFork, Sparkles, AlertCircle, RefreshCw, Search, ChevronRight, 
  ChevronDown, Minimize2, Maximize2, HelpCircle, Compass
} from "lucide-react";
import Loader from "../components/Loader";
import { motion, AnimatePresence } from "motion/react";

interface MindMapProps {
  focusedNote: Note | null;
  onUpdateNote: (updatedNote: Note) => void;
}

// Helper to check if a node or any of its children matches the search query
function matchesSearch(node: MindNode, searchTerm: string): boolean {
  if (!searchTerm) return true;
  const term = searchTerm.toLowerCase();
  if (node.label.toLowerCase().includes(term)) return true;
  if (node.children) {
    return node.children.some(child => matchesSearch(child, searchTerm));
  }
  return false;
}

// Recursive MindMap Node component
interface TreeNodeProps {
  node: MindNode;
  level: number;
  searchTerm: string;
  defaultExpanded?: boolean;
  key?: any;
}

function TreeNode({ node, level, searchTerm, defaultExpanded = true }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const term = searchTerm.trim().toLowerCase();
  const hasMatch = term ? node.label.toLowerCase().includes(term) : false;
  const hasChildren = node.children && node.children.length > 0;

  // Auto-expand if search matches children, so the results are visible
  useEffect(() => {
    if (term) {
      const matchChildren = node.children?.some(child => matchesSearch(child, term));
      if (matchChildren || hasMatch) {
        setIsExpanded(true);
      }
    }
  }, [term, node.children, hasMatch]);

  const toggleExpand = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  // Skip rendering this node if there is a search term and neither this nor its descendants match
  if (term && !matchesSearch(node, term)) {
    return null;
  }

  // Highlight matched search term text
  const renderHighlightedText = (text: string) => {
    if (!term) return text;
    const parts = text.split(new RegExp(`(${term})`, "gi"));
    return (
      <span className="font-sans">
        {parts.map((part, i) => 
          part.toLowerCase() === term 
            ? <mark key={i} className="bg-yellow-400 text-slate-900 rounded-[2px] px-1 font-bold font-sans">{part}</mark>
            : part
        )}
      </span>
    );
  };

  // Custom styling based on hierarchy level
  const levelStyles = (lvl: number, expanded: boolean, activeMatch: boolean) => {
    const base = "flex items-start gap-2 p-3 rounded-xl border transition-all select-none ";
    const matchBorder = activeMatch ? "border-amber-400/80 bg-amber-900/10 shadow-md shadow-amber-500/5 " : "";

    if (lvl === 0) {
      // Root Node style
      return base + matchBorder + "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 border-violet-400/40 text-white font-extrabold shadow-lg";
    }
    if (lvl === 1) {
      // Category Branch
      return base + matchBorder + (expanded ? "bg-violet-950/40 border-violet-500/50 text-slate-100" : "bg-slate-900/60 border-white/5 text-slate-300 hover:border-violet-500/30");
    }
    // Sub-leaf nodes
    return base + matchBorder + "bg-slate-950/60 border-white/5 text-slate-300 pl-4 py-2 hover:border-blue-500/30 transition-all";
  };

  return (
    <div className="flex flex-col space-y-2 relative" style={{ marginLeft: level > 0 ? "24px" : "0px" }}>
      {/* Decorative vertical connection line */}
      {level > 0 && (
        <div className="absolute left-[-16px] top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-violet-500/40 to-indigo-500/10" />
      )}
      {/* Decorative horizontal bridge */}
      {level > 0 && (
        <div className="absolute left-[-16px] top-[18px] w-4 h-[1.5px] bg-violet-500/40" />
      )}

      {/* Node Row */}
      <div 
        onClick={toggleExpand}
        className={`${levelStyles(level, isExpanded, hasMatch)} ${hasChildren ? "cursor-pointer" : ""}`}
      >
        {hasChildren ? (
          <span className="mt-0.5 text-violet-400 shrink-0">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        ) : (
          <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-indigo-400/80" />
        )}
        <span className={`${level === 0 ? "text-sm" : "text-xs"} font-semibold leading-relaxed font-sans`}>
          {renderHighlightedText(node.label)}
        </span>
      </div>

      {/* Children elements with opening/closing animation */}
      {hasChildren && (
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden space-y-2 mt-1"
            >
              {node.children?.map((child, idx) => (
                <TreeNode 
                  key={idx} 
                  node={child} 
                  level={level + 1} 
                  searchTerm={searchTerm} 
                  defaultExpanded={defaultExpanded}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export default function MindMap({ focusedNote, onUpdateNote }: MindMapProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [globalExpanded, setGlobalExpanded] = useState(true);

  useEffect(() => {
    if (!focusedNote) return;
    if (focusedNote.mindMap) return;

    const fetchMindmap = async () => {
      setLoading(true);
      setError("");
      try {
        const mindmapData = await generateNotesMindmap(focusedNote.extractedText);

        const noteRef = doc(db, "notes", focusedNote.id);
        await updateDoc(noteRef, {
          mindMap: mindmapData,
          updatedAt: new Date().toISOString(),
        });

        onUpdateNote({
          ...focusedNote,
          mindMap: mindmapData,
        });
      } catch (e: any) {
        console.error(e);
        setError("AI mindmap compiling failed. Review contents.");
      } finally {
        setLoading(false);
      }
    };

    fetchMindmap();
  }, [focusedNote]);

  const handleRecompile = async () => {
    if (!focusedNote) return;
    setLoading(true);
    setError("");
    try {
      const mindmapData = await generateNotesMindmap(focusedNote.extractedText);
      const noteRef = doc(db, "notes", focusedNote.id);
      await updateDoc(noteRef, {
        mindMap: mindmapData,
        updatedAt: new Date().toISOString(),
      });
      onUpdateNote({
        ...focusedNote,
        mindMap: mindmapData,
      });
    } catch (e: any) {
      console.error(e);
      setError("Failed to recompile AI mindmap.");
    } finally {
      setLoading(false);
    }
  };

  const tree = focusedNote?.mindMap;

  if (!focusedNote) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]" id="mindmap-empty-locked">
        <GitFork className="w-12 h-12 text-slate-600 mb-4 animate-bounce" />
        <h3 className="font-sans font-semibold text-slate-300">No Active Note Selected</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
          Unlock cognitive concept networks by selecting your notes catalog in the Dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-in" id="mindmap-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="mindmap-page-header">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-widest">
              Cognitive Mind Mapping
            </span>
          </div>
          <h2 className="text-2xl font-sans font-black text-white mt-1">Hierarchical Mind Maps</h2>
          <p className="text-slate-400 text-xs mt-0.5">Understand core categories and fact linkages in nested views</p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          {tree && (
            <>
              <button
                onClick={() => setGlobalExpanded(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 rounded-xl transition-all cursor-pointer"
                title="Expand All Nodes"
              >
                <Maximize2 className="w-3.5 h-3.5 text-violet-400" />
                Expand All
              </button>
              <button
                onClick={() => setGlobalExpanded(false)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 rounded-xl transition-all cursor-pointer"
                title="Collapse All Nodes"
              >
                <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
                Collapse All
              </button>
            </>
          )}

          <button
            onClick={handleRecompile}
            disabled={loading}
            className="flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all text-xs cursor-pointer"
            title="Recompile Mind Map"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading && <Loader message="Gemini AI is parsing concept connections and building a responsive hierarchical network..." />}

      {error && (
        <div id="mindmap-error-banner" className="bg-red-950/40 border border-red-900/60 p-4 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && tree && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="mindmap-grid">
          {/* Main Controls Panel (Left or Full depending on size) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md space-y-4">
              <span className="text-[10px] font-mono uppercase text-violet-400 tracking-widest block font-bold">
                Nodes Filtering
              </span>
              
              {/* Beautiful Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Query map branches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-xs bg-black/40 border border-white/5 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all font-sans"
                />
              </div>

              <div className="p-4 rounded-2xl bg-black/20 border border-white/5 text-[11px] text-slate-400 leading-relaxed font-sans space-y-2">
                <div className="flex items-start gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                  <span>Click on any category node with a chevron to expand or collapse its children elements.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 mt-0.5 shrink-0" />
                  <span>Interactive search highlights matching terms in real-time and auto-reveals hidden leaves.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Mind Map Visual Viewport (Right) */}
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c122c]/50 to-[#020617]/50 backdrop-blur-md overflow-x-auto min-h-[450px]" id="mindmap-workspace-canvas">
            <div className="min-w-[400px] space-y-4 max-w-full">
              {/* Dynamic MindMap Recursive Engine */}
              <TreeNode 
                node={tree} 
                level={0} 
                searchTerm={searchTerm} 
                key={globalExpanded ? "expanded" : "collapsed"}
                defaultExpanded={globalExpanded}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
