import { useEffect, useState, useRef } from "react";
import { Note, FlowNode } from "../types";
import { generateNotesFlowchart } from "../services/api";
import { db } from "../services/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { 
  Share2, Sparkles, AlertCircle, PlayCircle, Download, ZoomIn, ZoomOut, 
  RefreshCw, Milestone, LayoutDashboard, Compass, Eye, MapPin 
} from "lucide-react";
import Loader from "../components/Loader";
import { ReactFlow, Controls, Background, useNodesState, useEdgesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng } from "html-to-image";

interface FlowchartProps {
  focusedNote: Note | null;
  onUpdateNote: (updatedNote: Note) => void;
}

export default function Flowchart({ focusedNote, onUpdateNote }: FlowchartProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [activeWalkthroughIndex, setActiveWalkthroughIndex] = useState<number | null>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const stages = focusedNote?.flowchart || [];

  useEffect(() => {
    if (!focusedNote) return;
    if (focusedNote.flowchart) {
      loadFlowchartData();
      return;
    }

    const fetchFlowchart = async () => {
      setLoading(true);
      setError("");
      try {
        const flowchartData = await generateNotesFlowchart(focusedNote.extractedText);

        const noteRef = doc(db, "notes", focusedNote.id);
        await updateDoc(noteRef, {
          flowchart: flowchartData,
          updatedAt: new Date().toISOString(),
        });

        onUpdateNote({
          ...focusedNote,
          flowchart: flowchartData,
        });
      } catch (e: any) {
        console.error(e);
        setError("AI Flowchart compiling failed. Review contents.");
      } finally {
        setLoading(false);
      }
    };

    fetchFlowchart();
  }, [focusedNote]);

  // Sync ReactFlow nodes/edges when flowchart stages change
  useEffect(() => {
    if (stages.length > 0) {
      loadFlowchartData();
    }
  }, [stages]);

  const loadFlowchartData = () => {
    if (!focusedNote?.flowchart) return;
    const currentStages = focusedNote.flowchart;

    // Calculate interactive vertical & horizontal spacing for pristine node rendering
    const mappedNodes = currentStages.map((stage, idx) => {
      // Alternate left/right x alignment for visual interest
      const xOffset = 250 + (idx % 2 === 0 ? -40 : 40);
      const yOffset = idx * 160 + 50;

      return {
        id: stage.id,
        type: "default",
        data: {
          label: (
            <div 
              className={`p-3 text-left transition-all rounded-xl duration-300 ${
                selectedStepId === stage.id 
                  ? "border border-violet-500 shadow-lg shadow-violet-500/20 bg-slate-900" 
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono font-bold tracking-widest text-violet-400 uppercase bg-violet-950/50 px-2 py-0.5 rounded-full">
                  STEP {idx + 1}
                </span>
                <span className="text-[8px] font-mono text-slate-500">#{stage.id}</span>
              </div>
              <h4 className="text-xs font-bold font-sans text-slate-100 pr-2 line-clamp-2 leading-relaxed">
                {stage.label}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 lines-clamp-3 font-sans font-normal leading-relaxed">
                {stage.description}
              </p>
            </div>
          ),
        },
        position: { x: xOffset, y: yOffset },
        style: {
          background: "rgba(15, 23, 42, 0.8)",
          color: "#f1f5f9",
          border: selectedStepId === stage.id ? "2px solid #8b5cf6" : "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "1px",
          width: 250,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(12px)",
        },
      };
    });

    // Create connected sequential edges
    const mappedEdges: any[] = [];
    currentStages.forEach((stage, idx) => {
      if (stage.next && Array.isArray(stage.next) && stage.next.length > 0) {
        stage.next.forEach((nextId) => {
          if (currentStages.some((s) => s.id === nextId)) {
            mappedEdges.push({
              id: `edge-${stage.id}-${nextId}`,
              source: stage.id,
              target: nextId,
              animated: true,
              style: { stroke: "#8b5cf6", strokeWidth: 2 },
              type: "smoothstep",
            });
          }
        });
      } else if (idx < currentStages.length - 1) {
        // Fallback connecting sequence
        mappedEdges.push({
          id: `edge-fallback-${stage.id}-${currentStages[idx + 1].id}`,
          source: stage.id,
          target: currentStages[idx + 1].id,
          animated: true,
          style: { stroke: "#3b82f6", strokeWidth: 1.5 },
          type: "smoothstep",
        });
      }
    });

    setNodes(mappedNodes);
    setEdges(mappedEdges);
  };

  const handleExportPNG = () => {
    if (!flowRef.current) return;
    setLoading(true);
    // Find the ReactFlow container viewport element
    const element = flowRef.current.querySelector(".react-flow__renderer") as HTMLElement || flowRef.current;
    
    toPng(element, {
      backgroundColor: "#020617",
      style: {
        transform: "scale(1)",
        width: `${element.offsetWidth}px`,
        height: `${element.offsetHeight}px`,
      },
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `${focusedNote?.title.replace(/\s+/g, "_") || "flowchart"}_flowchart.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Export failed:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleRecompile = async () => {
    if (!focusedNote) return;
    setLoading(true);
    setError("");
    try {
      const flowchartData = await generateNotesFlowchart(focusedNote.extractedText);
      const noteRef = doc(db, "notes", focusedNote.id);
      await updateDoc(noteRef, {
        flowchart: flowchartData,
        updatedAt: new Date().toISOString(),
      });
      onUpdateNote({
        ...focusedNote,
        flowchart: flowchartData,
      });
    } catch (err: any) {
      console.error(err);
      setError("AI Flowchart recompiling failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (stages.length === 0) return;
    let nextIdx = 0;
    if (activeWalkthroughIndex !== null) {
      nextIdx = (activeWalkthroughIndex + 1) % stages.length;
    }
    setActiveWalkthroughIndex(nextIdx);
    setSelectedStepId(stages[nextIdx].id);
  };

  if (!focusedNote) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]" id="flowchart-empty-locked">
        <Share2 className="w-12 h-12 text-slate-600 mb-4 animate-bounce" />
        <h3 className="font-sans font-semibold text-slate-300">No Active Study Notes Selected</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed">
          Unlock process flows by selecting your notes catalog in the central Cockpit workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-in" id="flowchart-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="flowchart-page-header">
        <div>
          <div className="flex items-center gap-2">
            <Milestone className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-widest">
              Sequential Process Logics
            </span>
          </div>
          <h2 className="text-2xl font-sans font-black text-white mt-1">Interactive Process Flowcharts</h2>
          <p className="text-slate-400 text-xs mt-0.5">Chronological, scrollable flowchart nodes auto-sequenced by Gemini</p>
        </div>
        
        {/* Actions bar */}
        <div className="flex items-center gap-2">
          {stages.length > 0 && (
            <>
              <button
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-500/5"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                {activeWalkthroughIndex === null ? "Start Walkthrough" : `Step ${activeWalkthroughIndex + 1} Walkthrough`}
              </button>

              <button
                onClick={handleExportPNG}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 rounded-xl transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                Export PNG
              </button>
            </>
          )}

          <button
            onClick={handleRecompile}
            disabled={loading}
            className="flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all text-xs cursor-pointer"
            title="Recompile Flowchart Nodes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading && <Loader message="Gemini AI is decoding text chronologies and structuring high-performance flow modules..." />}

      {error && (
        <div id="flowchart-error-banner" className="bg-red-950/40 border border-red-900/60 p-4 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main interactive diagram workspace */}
      {!loading && stages.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="flowchart-workspace">
          {/* Timeline navigation rail (Left) */}
          <div className="lg:col-span-1 space-y-3 max-h-[550px] overflow-y-auto pr-1" id="flowchart-steps-sidebar">
            <p className="text-[10px] font-mono uppercase text-slate-500 tracking-widest pl-2">Timeline Progression</p>
            {stages.map((stage, idx) => {
              const isSelected = selectedStepId === stage.id;
              return (
                <div
                  key={stage.id}
                  onClick={() => {
                    setSelectedStepId(stage.id === selectedStepId ? null : stage.id);
                    setActiveWalkthroughIndex(idx);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? "bg-violet-950/20 border-violet-500/60 shadow-lg shadow-violet-500/5 text-white"
                      : "bg-[#030712]/50 border-white/5 hover:border-white/10 hover:bg-[#030712] text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold ${
                      isSelected ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400"
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="text-xs font-bold font-sans truncate flex-1">{stage.label}</span>
                  </div>
                  {isSelected && (
                    <p className="text-[10px] text-slate-400 mt-2 font-normal leading-relaxed animate-fade-in pr-1">
                      {stage.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Infinite Canvas Container (Right) */}
          <div className="lg:col-span-3 flex flex-col space-y-2" id="canvas-column">
            <div 
              ref={flowRef}
              id="flowchart-canvas"
              className="w-full h-[500px] border border-white/10 bg-slate-950/50 backdrop-blur-md rounded-[24px] overflow-hidden relative shadow-inner shrink-0"
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                className="font-sans"
                nodeTypes={{}}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="rgba(139, 92, 246, 0.15)" gap={20} size={1} />
                <Controls className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-lg" />
              </ReactFlow>

              {/* Float hint info */}
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-white/5 rounded-xl px-3 py-1.5 pointer-events-none text-[10px] text-slate-400 flex items-center gap-1.5">
                <Compass className="w-3 h-3 text-violet-400 animate-spin" />
                <span>Scroll to Zoom • Left-Click & Drag to Pan Canvas</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
