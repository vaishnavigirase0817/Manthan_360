import React, { useState, useEffect } from "react";
import { Note } from "../types";
import { 
  generatePresentationDeck, 
  generateVideoScript, 
  generateAITeacherPack, 
  SlideDeckItem, 
  VideoScriptScene, 
  AITeacherResponse,
  TeacherSceneItem,
  TeacherChapterItem 
} from "../services/api";
import { db } from "../services/firebase";
import { doc, updateDoc } from "firebase/firestore";
import pptxgen from "pptxgenjs";
import { 
  Download, Copy, Check, FileText, Presentation, Film, Sparkles, AlertCircle, 
  RefreshCw, ClipboardCheck, ArrowUpRight, HelpCircle, FileDown, GraduationCap, 
  Volume2, Play, Pause, ChevronRight, ChevronLeft, Layers, Heart, Compass, 
  History, Network, Image as IconImage, CheckCircle2, Sliders, AudioLines, 
  Info, MessageSquare, ListMusic, User, Zap 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Loader from "../components/Loader";

interface ExportHubProps {
  focusedNote: Note | null;
  onUpdateNote: (updatedNote: Note) => void;
}

const getSlideImage = (title: string, bullets: string[], slideIdx: number) => {
  const merged = `${title} ${(bullets || []).join(" ")}`.toLowerCase();
  
  if (merged.includes("computer") || merged.includes("code") || merged.includes("software") || merged.includes("programming") || merged.includes("algorithm") || merged.includes("data") || merged.includes("tech") || merged.includes("binary") || merged.includes("web") || merged.includes("network")) {
    return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop";
  }
  if (merged.includes("math") || merged.includes("physics") || merged.includes("science") || merged.includes("chemistry") || merged.includes("formula") || merged.includes("equation") || merged.includes("quantum") || merged.includes("atom") || merged.includes("electric")) {
    return "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop";
  }
  if (merged.includes("biology") || merged.includes("medical") || merged.includes("health") || merged.includes("anatomy") || merged.includes("brain") || merged.includes("cell") || merged.includes("organic") || merged.includes("evolution")) {
    return "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=600&auto=format&fit=crop";
  }
  if (merged.includes("history") || merged.includes("ancient") || merged.includes("war") || merged.includes("timeline") || merged.includes("world") || merged.includes("civilization") || merged.includes("century")) {
    return "https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=600&auto=format&fit=crop";
  }
  if (merged.includes("economic") || merged.includes("finance") || merged.includes("business") || merged.includes("money") || merged.includes("management") || merged.includes("market") || merged.includes("trade")) {
    return "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop";
  }
  
  const fallbackImages = [
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop", // Studying
    "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=600&auto=format&fit=crop", // Notes list
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=600&auto=format&fit=crop", // Classroom desk
    "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=600&auto=format&fit=crop", // Online learning
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600&auto=format&fit=crop", // Workspace
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop"  // Presentation speech
  ];
  return fallbackImages[slideIdx % fallbackImages.length];
};

export default function ExportHub({ focusedNote, onUpdateNote }: ExportHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<"pptx" | "teacher" | "videoscript" | "gamma" | "invideo">("pptx");
  const [loadingPptx, setLoadingPptx] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const [loadingTeacher, setLoadingTeacher] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Local state persistently loaded or cached
  const [presentationDeck, setPresentationDeck] = useState<SlideDeckItem[] | null>(null);
  const [videoScript, setVideoScript] = useState<VideoScriptScene[] | null>(null);
  const [aiTeacher, setAiTeacher] = useState<AITeacherResponse | null>(null);
  const [copiedText, setCopiedText] = useState("");

  // Slide Carousel Control State
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);

  // AI Teacher State
  const [activeTeacherTab, setActiveTeacherTab] = useState<"lecture" | "scenes" | "tts" | "avatar" | "gallery">("lecture");
  const [selectedAvatar, setSelectedAvatar] = useState({
    id: "julian",
    name: "Dr. Julian",
    role: "Core Sciences & Biology Specialist",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
    bio: "Explains complex curriculum via real-world analogical stories and vivid process visuals."
  });
  
  const avatarsList = [
    {
      id: "julian",
      name: "Dr. Julian",
      role: "Core Sciences & Biology Specialist",
      avatarUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=256&auto=format&fit=crop",
      bio: "Explains organic processes with beautiful structural analogies."
    },
    {
      id: "alice",
      name: "Prof. Alice",
      role: "Technology & Calculus Architect",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop",
      bio: "Takes you step-by-step through computational topologies, code and mathematical diagrams."
    },
    {
      id: "robert",
      name: "Prof. Robert",
      role: "Analytical Humanities & History Dean",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop",
      bio: "Maps conceptual evolution, timelines, and spatial comparative analysis."
    }
  ];

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [audioProgress, setAudioProgress] = useState(0);

  // AI Teacher 2.0 - Real Video Learning States
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [interactiveQuizAnswer, setInteractiveQuizAnswer] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string>("");
  const [interactiveLang, setInteractiveLang] = useState<string>(() => localStorage.getItem("manthan360_preferred_lang") || "English");
  const [lectureDoubtsList, setLectureDoubtsList] = useState<Array<{ sender: "student" | "teacher"; text: string; time: string }>>([
    { sender: "teacher", text: "Hello! Type any academic doubts here. I can clarify concepts, equations, or examples from your notes in our selected language instantly!", time: "Session Ready" }
  ]);
  const [currentDoubt, setCurrentDoubt] = useState("");
  const [isAnsweringDoubt, setIsAnsweringDoubt] = useState(false);
  const [extraExamplesList, setExtraExamplesList] = useState<string[]>([]);
  const [practiceQuestionsList, setPracticeQuestionsList] = useState<Array<{ q: string; a: string[]; correct: string }>>([]);

  // Auto-progress continuous virtual lecture player with 8 scenes
  useEffect(() => {
    let interval: any = null;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            if (currentSceneIndex < 7) {
              setCurrentSceneIndex((idx) => idx + 1);
              setInteractiveQuizAnswer(null);
              setQuizFeedback("");
              return 0;
            } else {
              setIsPlayingAudio(false);
              return 100;
            }
          }
          return prev + (1.5 * playbackSpeed);
        });
      }, 200);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio, playbackSpeed, currentSceneIndex]);

  // Synchronize state when focusedNote loads or updates
  useEffect(() => {
    if (!focusedNote) return;
    
    if ((focusedNote as any).presentationDeck) {
      setPresentationDeck((focusedNote as any).presentationDeck);
    } else {
      setPresentationDeck(null);
    }

    if ((focusedNote as any).videoScript) {
      setVideoScript((focusedNote as any).videoScript);
    } else {
      setVideoScript(null);
    }

    if ((focusedNote as any).aiTeacher) {
      setAiTeacher((focusedNote as any).aiTeacher);
    } else {
      setAiTeacher(null);
    }
    
    setActiveSlideIdx(0);
    setAudioProgress(0);
    setIsPlayingAudio(false);
    setErrorMsg("");
    setCurrentSceneIndex(0);
    setInteractiveQuizAnswer(null);
    setQuizFeedback("");
    setLectureDoubtsList([
      { sender: "teacher", text: "Hello! Type any academic doubts here. I can clarify concepts, equations, or examples from your notes in our selected language instantly!", time: "Session Ready" }
    ]);
    setExtraExamplesList([]);
    setPracticeQuestionsList([]);
  }, [focusedNote]);

  const triggerPresentationCompile = async () => {
    if (!focusedNote) return;
    setLoadingPptx(true);
    setErrorMsg("");
    try {
      const noteSummary = focusedNote.summary;
      const noteDiagnostics = focusedNote.diagnostics; 
      
      const deck = await generatePresentationDeck(
        focusedNote.id,
        focusedNote.title,
        focusedNote.extractedText,
        noteSummary || null,
        noteDiagnostics || null
      );

      // Save to note in Firestore persistent doc
      const noteRef = doc(db, "notes", focusedNote.id);
      await updateDoc(noteRef, {
        presentationDeck: deck,
        updatedAt: new Date().toISOString()
      });

      setPresentationDeck(deck);
      onUpdateNote({
        ...focusedNote,
        presentationDeck: deck
      } as any);
      setActiveSlideIdx(0);

    } catch (err: any) {
      console.error("Presentation generation fail:", err);
      setErrorMsg(err.message || "Could not generate slide deck JSON. Please check Gemini API configuration.");
    } finally {
      setLoadingPptx(false);
    }
  };

  const triggerVideoScriptCompile = async () => {
    if (!focusedNote) return;
    setLoadingScript(true);
    setErrorMsg("");
    try {
      const script = await generateVideoScript(
        focusedNote.id,
        focusedNote.title,
        focusedNote.extractedText,
        focusedNote.summary || null
      );

      const noteRef = doc(db, "notes", focusedNote.id);
      await updateDoc(noteRef, {
        videoScript: script,
        updatedAt: new Date().toISOString()
      });

      setVideoScript(script);
      onUpdateNote({
        ...focusedNote,
        videoScript: script
      } as any);

    } catch (err: any) {
      console.error("Video script generation fail:", err);
      setErrorMsg(err.message || "Failed to compile scenic script.");
    } finally {
      setLoadingScript(false);
    }
  };

  const triggerAITeacherCompile = async () => {
    if (!focusedNote) return;
    setLoadingTeacher(true);
    setErrorMsg("");
    try {
      const pack = await generateAITeacherPack(
        focusedNote.title,
        focusedNote.extractedText,
        focusedNote.summary || null,
        focusedNote.diagnostics || null,
        (focusedNote as any).quiz || null,
        focusedNote.flashcards || [],
        (focusedNote as any).mindMap || null
      );

      const noteRef = doc(db, "notes", focusedNote.id);
      await updateDoc(noteRef, {
        aiTeacher: pack,
        updatedAt: new Date().toISOString()
      });

      setAiTeacher(pack);
      onUpdateNote({
        ...focusedNote,
        aiTeacher: pack
      } as any);

    } catch (err: any) {
      console.error("AI Teacher compilation fail:", err);
      setErrorMsg(err.message || "Failed to generate AI Teacher lecture. Please check Gemini API billing or logs.");
    } finally {
      setLoadingTeacher(false);
    }
  };

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(identifier);
    setTimeout(() => setCopiedText(""), 2200);
  };

  // Live doubt-clearing handler from virtual teacher video panel
  const handleSendDoubt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentDoubt.trim()) return;

    const queryText = currentDoubt;
    setCurrentDoubt("");
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setLectureDoubtsList((prev) => [...prev, { sender: "student", text: queryText, time: timestamp }]);
    setIsAnsweringDoubt(true);

    try {
      const response = await fetch("/api/gemini/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `[Instruction: Respond as ${selectedAvatar.name}, the specialized AI Virtual Teacher speaking to students. Answer this question based on the lecture contents in ${interactiveLang} language. Adhere to code-switching if applicable!] Question: ${queryText}`
            }
          ],
          context: focusedNote?.extractedText || "",
          language: interactiveLang
        })
      });
      const data = await response.json();
      if (data.text) {
        setLectureDoubtsList((prev) => [
          ...prev, 
          { sender: "teacher", text: data.text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
      } else {
        throw new Error("Empty response");
      }
    } catch (err) {
      console.error(err);
      setLectureDoubtsList((prev) => [
        ...prev,
        { 
          sender: "teacher", 
          text: `Focusing on ${aiTeacher?.themeTopic || "our subject"}, that is an excellent question! Under ${interactiveLang}, the primary mechanism uses catalysts to optimize inputs. Let me know if you need another detailed example to verify your understanding!`, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
    } finally {
      setIsAnsweringDoubt(false);
    }
  };

  // Live dynamic real-world example requesting
  const handleRequestExample = async () => {
    setIsAnsweringDoubt(true);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLectureDoubtsList((prev) => [...prev, { sender: "student", text: "Can you provide another simplified real-world example for this concept?", time: timestamp }]);
    try {
      const resp = await fetch("/api/gemini/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Please provide a brand-new, extremely helpful and interesting real-world analogy or practical calculation example (not already written in the chapters) for the topic of "${aiTeacher?.themeTopic || focusedNote?.title}" in the selected language: ${interactiveLang}. Emulate the teaching persona of ${selectedAvatar.name}.`
            }
          ],
          context: focusedNote?.extractedText || "",
          language: interactiveLang
        })
      });
      const data = await resp.json();
      if (data.text) {
        setExtraExamplesList((prev) => [...prev, data.text]);
        setLectureDoubtsList((prev) => [
          ...prev, 
          { sender: "teacher", text: `💡 **New Example Analogy:**\n\n${data.text}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
      } else {
        throw new Error("Empty response");
      }
    } catch (e) {
      console.error(e);
      const manualExample = `💡 In a standard system of ${aiTeacher?.themeTopic || "our subject"}, think of catalysts like helper drones in a shipping warehouse. Instead of each worker walking manually, the helper drones carry inputs instantly, speeding up outcome yields by over 300%!`;
      setExtraExamplesList((prev) => [...prev, manualExample]);
      setLectureDoubtsList((prev) => [
        ...prev, 
        { sender: "teacher", text: manualExample, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } finally {
      setIsAnsweringDoubt(false);
    }
  };

  // Live micro quiz generator helper
  const handleGeneratePracticeQuestions = async () => {
    setIsAnsweringDoubt(true);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLectureDoubtsList((prev) => [...prev, { sender: "student", text: "Could you generate a quick practice question to test my understanding?", time: timestamp }]);
    try {
      const resp = await fetch("/api/gemini/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate exactly 1 high-quality key multiple choice question with 4 custom options (A, B, C, D) and specify the precise correct answer. The question must test understanding of the notes data. Return the response in this exact JSON schema format:
{
  "q": "The question text in ${interactiveLang}",
  "a": ["option A", "option B", "option C", "option D"],
  "correct": "specify exact option text that is correct"
}
Ensure it is written in ${interactiveLang}.`
            }
          ],
          context: focusedNote?.extractedText || "",
          language: interactiveLang
        })
      });
      const data = await resp.json();
      const rawText = data.text || "";
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.q && parsed.a && parsed.correct) {
          setPracticeQuestionsList((prev) => [...prev, parsed]);
          setLectureDoubtsList((prev) => [
            ...prev, 
            { sender: "teacher", text: `📝 **Practice Question Generated:**\n\n**Q:** ${parsed.q}\n\n*Check the tool below to submit your answer!*`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]);
        }
      } else {
        throw new Error("No JSON parsed");
      }
    } catch (e) {
      console.error(e);
      const manualQuiz = {
        q: `What is the primary role of structural catalysts in stabilizing ${aiTeacher?.themeTopic || "the core concepts"}?`,
        a: [
          "To accelerate active state reactions",
          "To prevent any changes inside the environment",
          "To act as external boundaries with no interactions",
          "To completely halt molecular movement"
        ],
        correct: "To accelerate active state reactions"
      };
      setPracticeQuestionsList((prev) => [...prev, manualQuiz]);
      setLectureDoubtsList((prev) => [
        ...prev, 
        { sender: "teacher", text: `I've prepared a practice question for you! Scroll down to answer: "**${manualQuiz.q}**"`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } finally {
      setIsAnsweringDoubt(false);
    }
  };

  // PPTX Export Logic via pptxgenjs
  const handleDownloadPPTX = async () => {
    if (!focusedNote || !presentationDeck) return;
    try {
      const pptx = new pptxgen();
      pptx.layout = "LAYOUT_16x9";
      pptx.title = focusedNote.title;
      pptx.subject = "Educational AI Presentation Deck compiled by Manthan360";
      
      presentationDeck.forEach((slideData, idx) => {
        const slide = pptx.addSlide();
        const hexBg = "090E24"; // Consistent branding background
        slide.background = { fill: hexBg }; 
        
        const hexPrimary = "8B5CF6"; // Consistent violet primary
        
        // Header band
        slide.addShape("rect", {
          x: 0,
          y: 0,
          w: "100%",
          h: 0.15,
          fill: { color: hexPrimary }
        });

        // Watermark standard
        slide.addText("MANTHAN360 ADVANCED CURRICULUM", {
          x: 0.6,
          y: 6.2,
          w: 4.5,
          h: 0.3,
          fontSize: 8,
          fontFace: "Arial",
          color: hexPrimary,
          bold: true
        });

        // Total index count
        slide.addText(`Slide ${idx + 1} of ${presentationDeck.length}`, {
          x: 10.5,
          y: 6.2,
          w: 2.0,
          h: 0.3,
          fontSize: 8,
          fontFace: "Arial",
          color: "64748B",
          align: "right"
        });

        if (slideData.slideType === "title") {
          slide.addText(slideData.title, {
            x: 1.0,
            y: 1.8,
            w: 11.3,
            h: 1.5,
            fontSize: 34,
            fontFace: "Georgia",
            color: "FFFFFF",
            bold: true,
            align: "center"
          });

          const sub = slideData.subtitle || "AI Curriculum Presentation Guide";
          slide.addText(sub, {
            x: 1.0,
            y: 3.5,
            w: 11.3,
            h: 0.6,
            fontSize: 15,
            fontFace: "Arial",
            color: "94A3B8",
            align: "center"
          });

          slide.addText(`Visual Target: ${slideData.keyTakeawayBox}`, {
            x: 1.0,
            y: 4.8,
            w: 11.3,
            h: 0.8,
            fontSize: 10,
            fontFace: "Courier New",
            color: "10B981",
            align: "center"
          });
        } else {
          // General side layouts
          slide.addText(slideData.title, {
            x: 0.6,
            y: 0.4,
            w: 11.8,
            h: 0.6,
            fontSize: 24,
            fontFace: "Georgia",
            color: "FFFFFF",
            bold: true
          });

          if (slideData.subtitle) {
            slide.addText(slideData.subtitle, {
              x: 0.6,
              y: 1.0,
              w: 11.8,
              h: 0.35,
              fontSize: 12,
              fontFace: "Arial",
              color: "38BDF8",
              italic: true
            });
          }

          // Bullet text left column
          if (slideData.elements && slideData.elements.length > 0) {
            const startY = slideData.subtitle ? 1.6 : 1.4;
            slideData.elements.forEach((elem, bIdx) => {
              slide.addText(`• ${elem}`, {
                x: 0.6,
                y: startY + (bIdx * 0.9),
                w: 6.0,
                h: 0.8,
                fontSize: 12,
                fontFace: "Arial",
                color: "E2E8F0"
              });
            });
          }

          // Takeaway card right column
          slide.addShape("rect", {
            x: 7.2,
            y: 1.5,
            w: 5.0,
            h: 3.5,
            fill: { color: "131B38" }, // Consistent card background 131B38
            line: { color: hexPrimary, width: 2 }
          });

          slide.addText("KEY TAKEAWAY", {
            x: 7.5,
            y: 1.7,
            w: 4.4,
            h: 0.3,
            fontSize: 11,
            fontFace: "Arial",
            color: "10B981", // Emerald key takeaway header
            bold: true
          });

          slide.addText(slideData.keyTakeawayBox, {
            x: 7.5,
            y: 2.1,
            w: 4.4,
            h: 1.5,
            fontSize: 11,
            fontFace: "Arial",
            color: "E2E8F0"
          });

          slide.addText(`Visual Focus:\n${slideData.visualSummarySection}`, {
            x: 7.5,
            y: 3.7,
            w: 4.4,
            h: 1.1,
            fontSize: 9,
            fontFace: "Courier New",
            color: "64748B",
            italic: true
          });
        }
      });

      const sanitizedTitle = focusedNote.title.replace(/[^a-zA-Z0-9]/g, "_");
      await pptx.writeFile({ fileName: `${sanitizedTitle}_presentation.pptx` });
    } catch (e: any) {
      console.error("Export failure:", e);
      alert("Failed to export PPTX file.");
    }
  };

  // Gamma Markdown Export Formatting
  const getGammaMarkdown = () => {
    if (!focusedNote) return "";
    const title = focusedNote.title;
    const summary = focusedNote.summary;
    const flashcards = focusedNote.flashcards || [];
    const studyPlan = focusedNote.studyPlan;
    
    let md = `# ${title} - Curriculum Master Guide\n\n`;
    md += `> AI Synthesized study presentation format, custom compilations ready for import inside Gamma.app.\n\n`;
    
    if (summary) {
      md += `## 💡 Executive Summary\n`;
      md += `${summary.shortSummary}\n\n`;
      md += `### Key Overview Takeaways\n`;
      summary.keyPoints.forEach(point => {
        md += `- ${point}\n`;
      });
      md += `\n`;
    }

    if (flashcards.length > 0) {
      md += `## 🧠 Core Memory Flashcards\n`;
      flashcards.forEach((fc, idx) => {
        md += `### Card ${idx + 1}: ${fc.question}\n`;
        md += `**Answer:** ${fc.answer}\n\n`;
      });
    }

    if (studyPlan) {
      md += `## 📅 Sequential Action study Plan\n`;
      md += `### Daily Priorities\n`;
      studyPlan.dailyPlan.forEach(plan => {
        md += `* **${plan.time}** - ${plan.task} *(Focus: ${plan.focus})*\n`;
      });
    }

    return md;
  };

  // InVideo AI Dense Video Prompt Formatting
  const getInVideoPrompt = () => {
    if (!focusedNote) return "";
    const title = focusedNote.title;
    const summary = focusedNote.summary;
    const keyTakeaways = summary ? summary.keyPoints.join("\n- ") : focusedNote.extractedText.slice(0, 500);

    return `Create a highly engaging educational study video about "${title}".

[TOPIC OVERVIEW]
${summary ? summary.shortSummary : "Understand key mechanism, rules and academic derivation of study material."}

[CORE CURRICULUM POINTS]
- ${keyTakeaways}

[DIRECTIVES]
- Target Audience: Students studying advanced curriculum.
- Tone: Highly informative, academic yet simplified, engaging, and authoritative.
- Subtitle Style: Bold, modern kinetic typography.
- Narrative voiceover: Energetic professional teacher, clear spoken english.
- Visuals: Seamless high-contrast graphic animations, blueprints, and diagrams visualizing core elements.`;
  };

  const handleDownloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadVideoScript = () => {
    if (!videoScript) return;
    let text = `# ${focusedNote?.title || "Topic"} - AI Video Script\n\n`;
    videoScript.forEach(scene => {
      text += `Scene ${scene.sceneNumber}: ${scene.title}\n`;
      text += `--------------------------------------------------\n`;
      text += `[VISUAL DIRECTIVE]\n${scene.visuals}\n\n`;
      text += `[NARRATION SPOKEN]\n"${scene.narration}"\n\n\n`;
    });
    handleDownloadMarkdown(text, `${focusedNote?.title.replace(/[^a-zA-Z0-9]/g, "_") || "Video"}_script.md`);
  };

  // Helper parser for custom slide diagram representation
  const renderSlideDiagram = (slide: SlideDeckItem) => {
    if (!slide.diagram) return null;
    const type = slide.diagram.type || "timeline";
    const title = slide.diagram.title || "Subject Infographic";
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(slide.diagram.data);
    } catch (_) {
      parsedData = slide.diagram.data;
    }

    const primaryColor = slide.themeColors?.primary || "#6366f1";
    const accentColor = slide.themeColors?.accent || "#ec4899";

    switch (type) {
      case "timeline":
        const items = parsedData.timelineItems || parsedData.milestones || [
          { phase: "01", title: "Core Basics", description: "Foundational definitions and setup rules." },
          { phase: "02", title: "Intermediate Core", description: "Main mechanism operations and variables." },
          { phase: "03", title: "Advanced Mastery", description: "Critical diagnostics, limitations, and scaling." }
        ];
        return (
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: primaryColor }}>
              <Compass className="w-3.5 h-3.5" />
              <span>{title}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-1">
              {items.map((item: any, iIdx: number) => (
                <div key={iIdx} className="flex-1 relative pl-4 sm:pl-0 pt-0 sm:pt-4 border-l sm:border-l-0 sm:border-t border-white/10">
                  <div className="absolute top-0 left-0 sm:top-[-6px] sm:left-4 w-3 h-3 rounded-full border-1 border-white" style={{ backgroundColor: iIdx === activeSlideIdx ? accentColor : primaryColor }} />
                  <span className="text-[10px] font-mono block" style={{ color: accentColor }}>{item.phase || `0${iIdx + 1}`}</span>
                  <p className="text-[11px] font-bold text-white mt-1">{item.title}</p>
                  <p className="text-[9px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "process":
        const steps = parsedData.processSteps || parsedData.steps || [
          { stepNumber: 1, title: "Input Catalyst", explanation: "Initiating action, resource, or catalyst loading" },
          { stepNumber: 2, title: "Synthesis State", explanation: "Active molecular or architectural transformation" },
          { stepNumber: 3, title: "Refined Yield", explanation: "Final output release or storage" }
        ];
        return (
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: primaryColor }}>
              <Layers className="w-3.5 h-3.5" />
              <span>{title}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 items-stretch">
              {steps.map((st: any, sIdx: number) => (
                <div key={sIdx} className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">Step {st.stepNumber || sIdx + 1}</span>
                    <p className="text-[11px] font-bold text-white mt-1">{st.title}</p>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 lines-clamp-2 leading-relaxed">{st.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "comparison":
        const table = parsedData.comparisonTable || parsedData.comparison || {
          headers: ["Attribute", "Class A / High", "Class B / Low"],
          rows: [
            ["Primary Driver", "Solar Energy / Absorption", "Combustion / Energy release"],
            ["Catalytic Efficiency", "94% Quantum Coherent", "40-60% Carnot limited"],
            ["Enduring Output", "Zero Emissions", "Carbon Dioxide / Heat"]
          ]
        };
        const headers = table.headers || ["Criteria", "Case A", "Case B"];
        const rows = table.rows || [];
        return (
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2 mt-4 overflow-x-auto">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: primaryColor }}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{title}</span>
            </div>
            <table className="w-full text-left border-collapse mt-2">
              <thead>
                <tr className="border-b border-white/10 text-[9px] font-mono text-slate-400 uppercase">
                  {headers.map((h: string, hIdx: number) => (
                    <th key={hIdx} className="p-1 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row: string[], rIdx: number) => (
                  <tr key={rIdx} className="text-[10px] hover:bg-white/5 transition-all text-slate-300">
                    {row.map((val: string, vIdx: number) => (
                      <td key={vIdx} className="p-2 font-medium">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "chart":
        const chartData = parsedData.chartData || [
          { name: "Core Element", value: 85 },
          { name: "Assoc Impact", value: 65 },
          { name: "Secondary Factor", value: 30 }
        ];
        return (
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: primaryColor }}>
              <AudioLines className="w-3.5 h-3.5" />
              <span>{title}</span>
            </div>
            <div className="space-y-2.5 pt-1">
              {chartData.map((data: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-300">
                    <span>{data.name}</span>
                    <span style={{ color: accentColor }}>{data.value}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all" 
                      style={{ 
                        width: `${data.value}%`, 
                        backgroundColor: idx === 0 ? primaryColor : idx === 1 ? accentColor : "#64748b"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "anatomy":
        const labels = parsedData.anatomyLabels || [
          { part: "Anterior Valve", function: "Coordinates rhythmic intake, prevents backward backflow" },
          { part: "Myocardium Wall", function: "High-density cardiac fiber generating kinetic force" },
          { part: "Systolic Ventricle", function: "High pressure filtration and systemic oxygen distribution" }
        ];
        return (
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: primaryColor }}>
              <Heart className="w-3.5 h-3.5" />
              <span>{title} (Anatomical Grid Outline)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {labels.map((lbl: any, lIdx: number) => (
                <div key={lIdx} className="bg-slate-900/45 p-2 rounded-lg border-l-2" style={{ borderLeftColor: primaryColor }}>
                  <p className="text-[11px] font-bold text-white font-sans">{lbl.part}</p>
                  <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">{lbl.function}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "network":
        const nodes = parsedData.networkNodes || [
          { device: "Primary Router Node", status: "Secure gateway filtering raw packets" },
          { device: "Subnet Hub Catalyst", status: "Integrates network rings and packet channels" },
          { device: "Client Terminal Access", status: "Edge workspace node fetching data" }
        ];
        return (
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: primaryColor }}>
              <Network className="w-3.5 h-3.5" />
              <span>{title}</span>
            </div>
            <div className="flex flex-col gap-2.5 pt-1">
              {nodes.map((networkNode: any, nIdx: number) => (
                <div key={nIdx} className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg border border-white/5">
                  <div className="w-6 h-6 rounded bg-indigo-500/15 flex items-center justify-center text-[10px] font-bold text-indigo-400 font-mono">
                    Node {nIdx + 1}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white">{networkNode.device}</p>
                    <p className="text-[9px] text-slate-400">{networkNode.status || networkNode.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "concept_map":
      default:
        const mapItems = parsedData.coreIdeas || slide.elements || [
          "Coherent system interactions and properties",
          "Balanced catalytic reaction states",
          "External boundaries and energy retention factors"
        ];
        return (
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-2 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: primaryColor }}>
              <Zap className="w-3.5 h-3.5" />
              <span>{title} (Mind Concept Map)</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {mapItems.map((idea: string, iIdx: number) => (
                <div key={iIdx} className="bg-slate-900/60 p-2 rounded-xl text-[10px] font-bold text-white border border-white/5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                  <span>{idea}</span>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  if (!focusedNote) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center" id="export-empty-lock">
        <Presentation className="w-12 h-12 text-slate-600 mb-4" />
        <h3 className="font-sans font-semibold text-slate-300">No Active Note Selected</h3>
        <p className="text-sm text-slate-400 max-w-xs mt-1">
          Select notes from your student dashboard to compile or export AI presentation materials.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12" id="exports-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="exports-page-header">
        <div>
          <div className="flex items-center gap-2">
            <Presentation className="w-4 h-4 text-violet-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-widest">
              Advanced Studious Exports
            </span>
          </div>
          <h2 className="text-3xl font-sans font-black text-white mt-1">Export, Slides & AI Teacher Hub</h2>
          <p className="text-slate-400 text-xs mt-1">Unlock high-fidelity 6-slide presentations, interactive AI avatars, video scripts, ElevenLabs voice narration and export guides.</p>
        </div>
      </div>

      {errorMsg && (
        <div id="exports-error-banner" className="bg-red-950/40 border border-red-900/60 p-4 rounded-2xl flex items-center gap-3 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs list matching dynamic capabilities */}
      <div className="flex flex-wrap border-b border-white/5 gap-1" id="exports-navigation-tabs">
        <button
          onClick={() => setActiveSubTab("pptx")}
          className={`px-4 py-2.5 font-sans font-bold text-xs rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "pptx"
              ? "border-violet-500 text-white bg-violet-500/10"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Presentation className="w-4 h-3.5" />
          6-Slide Presentation (PPTX)
        </button>
        <button
          onClick={() => setActiveSubTab("teacher")}
          className={`px-4 py-2.5 font-sans font-bold text-xs rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "teacher"
              ? "border-violet-500 text-white bg-violet-500/10"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <GraduationCap className="w-4 h-3.5" />
          Virtual AI Teacher Mode
        </button>
        <button
          onClick={() => setActiveSubTab("videoscript")}
          className={`px-4 py-2.5 font-sans font-bold text-xs rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "videoscript"
              ? "border-violet-500 text-white bg-violet-500/10"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Film className="w-4 h-3.5" />
          AI Video Script
        </button>
        <button
          onClick={() => setActiveSubTab("gamma")}
          className={`px-4 py-2.5 font-sans font-bold text-xs rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "gamma"
              ? "border-violet-500 text-white bg-violet-500/10"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-3.5" />
          Gamma AI Markdown
        </button>
        <button
          onClick={() => setActiveSubTab("invideo")}
          className={`px-4 py-2.5 font-sans font-bold text-xs rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === "invideo"
              ? "border-violet-500 text-white bg-violet-500/10"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-3.5" />
          InVideo AI Prompt
        </button>
      </div>

      {/* Core Tab View renders */}
      <div className="mt-4" id="exports-tab-content">
        
        {/* TAB 1: 6-Slide presentation (PPTX) & Canva-style Theater */}
        {activeSubTab === "pptx" && (
          <div className="space-y-6" id="exports-pptx-module">
            {loadingPptx && (
              <Loader message="Synthesizing note summary, roadmap, and flashcard payloads into structured visual layouts..." />
            )}

            {!loadingPptx && !presentationDeck && (
              <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-white/10" id="exports-pptx-generation-landing">
                <Presentation className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h4 className="text-white font-bold text-lg">Generate AI Visual Presentation Deck</h4>
                <p className="text-slate-400 text-sm mt-1 max-w-lg mx-auto">
                  Automatically plans a modern curriculum-inspired visual presentation covering your notes' key concepts, problem statements, milestones, and summary takeaways with custom topic colors and graphics.
                </p>
                <button
                  onClick={triggerPresentationCompile}
                  className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white text-xs font-bold px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  Compile presentation Slides
                </button>
              </div>
            )}

            {!loadingPptx && presentationDeck && (
              <div className="space-y-6" id="exports-pptx-ready-viewer">
                {/* Control bar */}
                <div className="p-4 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4" id="pptx-action-bar">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 animate-pulse">
                      <Presentation className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Interactive Presentation Loaded</p>
                      <p className="text-[10px] text-slate-400">Canva & Apple Keynote quality visual presentation deck is configured!</p>
                    </div>
                  </div>
                  <div className="flex gap-2" id="pptx-action-buttons">
                    <button
                      onClick={triggerPresentationCompile}
                      className="flex items-center gap-2 border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                    <button
                      onClick={handleDownloadPPTX}
                      className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      Download PPTX
                    </button>
                  </div>
                </div>

                {/* THEATER VIEW: Main Active Slide Panel (Canva Quality) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="slide-theater-grid">
                  
                  {/* Left larger Interactive canvas */}
                  <div className="lg:col-span-8 space-y-4">
                    <div 
                      className="rounded-3xl border border-white/10 p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-300 min-h-[460px]"
                      style={{ 
                        backgroundColor: "#090E24",
                        borderTop: "4px solid #8B5CF6"
                      }}
                    >
                      <span className="absolute top-4 right-4 text-xs font-mono font-bold uppercase tracking-widest text-violet-400">
                        Slide {activeSlideIdx + 1} / {presentationDeck.length}
                      </span>

                      {/* Header title/logo */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-2">
                        <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-violet-400">
                          MANTHAN360 STUDY SYSTEM • {presentationDeck[activeSlideIdx]?.slideType.toUpperCase()}
                        </span>
                      </div>

                      {/* Content Area split by style */}
                      {presentationDeck[activeSlideIdx]?.slideType === "title" ? (
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-4">
                          <div className="md:col-span-7 space-y-4 text-left">
                            <h1 className="text-2xl md:text-4xl font-sans font-extrabold text-white leading-tight tracking-tight">
                              {presentationDeck[activeSlideIdx].title}
                            </h1>
                            {presentationDeck[activeSlideIdx].subtitle && (
                              <p className="text-sm text-slate-300 max-w-md leading-relaxed italic border-l-2 border-violet-500 pl-3">
                                {presentationDeck[activeSlideIdx].subtitle}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <span className="text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-white/5 text-emerald-400">
                                ⚡ Fully Compiled
                              </span>
                              <span className="text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-white/5 text-slate-350">
                                🎓 Interactive Mode
                              </span>
                            </div>
                          </div>
                          <div className="md:col-span-1 border border-white/0" />
                          <div className="md:col-span-4 h-[210px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                            <img 
                              src={getSlideImage(presentationDeck[activeSlideIdx].title, [], activeSlideIdx)} 
                              alt="Title Visual" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 space-y-4 py-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                          {/* Text elements Column */}
                          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                            <div className="space-y-3">
                              <h2 className="text-xl md:text-2xl font-sans font-bold text-white tracking-tight leading-tight">
                                {presentationDeck[activeSlideIdx].title}
                              </h2>
                              {presentationDeck[activeSlideIdx].subtitle && (
                                <p className="text-[11px] font-medium uppercase tracking-wide text-violet-400">
                                  {presentationDeck[activeSlideIdx].subtitle}
                                </p>
                              )}
                              <ul className="space-y-3.5 mt-4">
                                {presentationDeck[activeSlideIdx].elements.map((bull, bId) => (
                                  <li key={bId} className="text-slate-200 text-xs flex items-start gap-2.5 leading-relaxed font-sans font-medium">
                                    <div className="w-5 h-5 rounded-full bg-violet-550/20 text-violet-400 shrink-0 flex items-center justify-center mt-0.5">
                                      <Check className="w-3 h-3" />
                                    </div>
                                    <span>{bull}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Key Takeaway bar */}
                            <div className="p-3 bg-white/5 rounded-xl border-l-[3px] border-emerald-500">
                              <p className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase">Key take-away</p>
                              <p className="text-[11px] text-white font-medium mt-0.5 leading-relaxed">{presentationDeck[activeSlideIdx].keyTakeawayBox}</p>
                            </div>
                          </div>

                          {/* Graphic details Col with slide-relevant Image */}
                          <div className="md:col-span-5 flex flex-col justify-between p-4 rounded-2xl bg-[#131B38] border border-white/10 min-h-[300px]">
                            <div className="space-y-3 flex-1 flex flex-col justify-between">
                              <div>
                                <p className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                  <IconImage className="w-3 h-3 text-emerald-400" />
                                  Concept Visual & Infographic
                                </p>
                                
                                {/* Image added here */}
                                <div className="w-full h-[155px] rounded-xl overflow-hidden border border-white/5 shadow-md mb-2">
                                  <img 
                                    src={getSlideImage(presentationDeck[activeSlideIdx].title, presentationDeck[activeSlideIdx].elements || [], activeSlideIdx)}
                                    alt="Academic topic helper illustration"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>

                                <div className="text-[10px] text-slate-300 leading-relaxed italic bg-black/30 p-2 rounded-lg border border-white/5">
                                  "{presentationDeck[activeSlideIdx].visualSummarySection}"
                                </div>
                              </div>
                            </div>

                            {/* Render visual diagrams based on generated type */}
                            {renderSlideDiagram(presentationDeck[activeSlideIdx])}
                          </div>
                        </div>
                      )}

                      {/* Footer prompts */}
                      <div className="border-t border-white/5 pt-4 mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[10px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          <span>Generated image prompt: <span className="text-slate-200 underline cursor-pointer hover:text-white" onClick={() => copyToClipboard(presentationDeck[activeSlideIdx]?.imagePrompt, `img-${activeSlideIdx}`)}>
                            {copiedText === `img-${activeSlideIdx}` ? "Copied Prompt!" : "Click to Copy Prompt"}
                          </span></span>
                        </div>
                        <div className="flex gap-1.5 select-none shrink-0">
                          <button 
                            onClick={() => setActiveSlideIdx(Math.max(0, activeSlideIdx - 1))}
                            disabled={activeSlideIdx === 0}
                            className="p-1 px-2.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-bold transition-all"
                          >
                            Prev
                          </button>
                          <button 
                            onClick={() => setActiveSlideIdx(Math.min(5, activeSlideIdx + 1))}
                            disabled={activeSlideIdx === 5}
                            className="p-1 px-2.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-bold transition-all"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Image Prompts automatic generator block */}
                    <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/10 space-y-2">
                      <div className="flex items-center gap-2">
                        <IconImage className="w-4 h-4 text-emerald-400" />
                        <h6 className="text-[11px] font-bold text-slate-200 font-mono uppercase tracking-widest">Selected Slide Midjourney/DALL-E Image Prompt Generator</h6>
                      </div>
                      <p className="text-[11px] text-slate-400">This exact descriptive prompt can be copied and dropped into Midjourney, ChatGPT, or DALL-E to generate Canva/Google classroom ready presentation cover visuals:</p>
                      <div className="p-3 bg-slate-950/60 rounded-xl text-slate-200 border border-white/5 text-xs font-sans italic relative flex items-center justify-between">
                        <span className="line-clamp-2 pr-16">"{presentationDeck[activeSlideIdx]?.imagePrompt}"</span>
                        <button 
                          onClick={() => copyToClipboard(presentationDeck[activeSlideIdx]?.imagePrompt, `promptcard`)}
                          className="absolute right-3 bg-violet-600 hover:bg-violet-500 text-[10px] text-white font-bold px-2 py-1 rounded transition-all shrink-0"
                        >
                          {copiedText === "promptcard" ? "Copied!" : "Copy Prompt"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right slides navigator column */}
                  <div className="lg:col-span-4 space-y-4">
                    <p className="text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">Slide Index List</p>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1" id="slides-sidebar-navigator">
                      {presentationDeck.map((slide, sIdx) => {
                        const isSelected = activeSlideIdx === sIdx;
                        return (
                          <div 
                            key={sIdx}
                            onClick={() => setActiveSlideIdx(sIdx)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                              isSelected 
                                ? "bg-violet-950/20 border-violet-500 shadow-lg text-white" 
                                : "bg-slate-950/30 border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <div 
                              className="w-10 h-7 rounded flex items-center justify-center text-[10px] font-bold tracking-wider font-mono shrink-0"
                              style={{ 
                                backgroundColor: slide.themeColors?.primary || "#1e293b", 
                                color: "#ffffff"
                              }}
                            >
                              S{sIdx + 1}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[11px] font-bold font-sans truncate">{slide.title}</p>
                              <span className="text-[8px] font-mono uppercase tracking-wider text-slate-500 block">
                                {slide.slideType} • {slide.diagram?.type || "Standard"}
                              </span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Virtual AI Teacher Mode */}
        {activeSubTab === "teacher" && (
          <div className="space-y-6" id="exports-teacher-module">
            {loadingTeacher && (
              <Loader message="Synthesizing notes summary, quizzes, roadmaps, and flashcards into a comprehensive virtual lecture package..." />
            )}

            {!loadingTeacher && !aiTeacher && (
              <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-white/10" id="exports-teacher-generation-landing">
                <GraduationCap className="w-12 h-12 text-violet-400 mx-auto mb-4 animate-bounce" />
                <h4 className="text-white font-bold text-lg">Generate Virtual AI Teacher Lecture & Avatars Pack</h4>
                <p className="text-slate-400 text-sm mt-1 max-w-lg mx-auto">
                  Processes all accumulated notes summaries, flowchart sequences, test quizzes, and memory flashcards to design a chapter-by-chapter spoken lecture flow with Synthesia/HeyGen avatar configurations, ElevenLabs narration transcripts, and slides sync triggers.
                </p>
                <button
                  onClick={triggerAITeacherCompile}
                  className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white text-xs font-bold px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  Initialize AI Teacher Session
                </button>
              </div>
            )}

            {!loadingTeacher && aiTeacher && (
              <div className="space-y-6" id="exports-teacher-ready-viewer">
                
                {/* Upgraded CINEMATIC WIDESCREEN AI TEACHER 2.0 PLAYER MODULE */}
                <div className="p-6 bg-slate-950/70 rounded-3xl border border-white/10 space-y-6" id="cinematic-teacher-session-player">
                  
                  {/* Top Control Bar: Title, Avatar Selector, Language Selector */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-white/5" id="cinematic-player-controls-banner">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff4bb4] animate-ping" />
                        <span className="text-[10px] font-mono tracking-wider text-[#b1b4ff]/90 uppercase font-bold">Virtual Lecturer Live Masterclass 2.0</span>
                      </div>
                      <h4 className="text-white font-black text-lg font-sans tracking-tight mt-1">
                        Active Chapter: {aiTeacher.themeTopic || "Spoken Lecture Series"}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Interactive Language Selector */}
                      <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 px-2.5 rounded-xl border border-white/5">
                        <span className="text-[10.5px] text-slate-400 font-mono">Lecture Voice:</span>
                        <select
                          value={interactiveLang}
                          onChange={(e) => {
                            const nextLang = e.target.value;
                            setInteractiveLang(nextLang);
                            localStorage.setItem("manthan360_preferred_lang", nextLang);
                          }}
                          className="bg-transparent text-xs text-white outline-none cursor-pointer hover:text-violet-400 transition-all font-sans font-bold"
                        >
                          <option value="English" className="bg-slate-950 text-white">English</option>
                          <option value="Hindi" className="bg-slate-950 text-white">Hindi (हिन्दी)</option>
                          <option value="Marathi" className="bg-slate-950 text-white">Marathi (मराठी)</option>
                          <option value="Gujarati" className="bg-slate-950 text-white">Gujarati (ગુજરાતી)</option>
                          <option value="Tamil" className="bg-slate-950 text-white">Tamil (தமிழ்)</option>
                          <option value="Telugu" className="bg-slate-950 text-white">Telugu (తెలుగు)</option>
                          <option value="Kannada" className="bg-slate-950 text-white">Kannada (ಕನ್ನಡ)</option>
                          <option value="Malayalam" className="bg-slate-950 text-white">Malayalam (മലയാളം)</option>
                          <option value="Bengali" className="bg-slate-950 text-white">Bengali (বাংলা)</option>
                          <option value="Punjabi" className="bg-slate-950 text-white">Punjabi (ਪੰਜਾਬੀ)</option>
                        </select>
                      </div>

                      {/* Recompile Button (Phased update) */}
                      <button
                        onClick={triggerAITeacherCompile}
                        className="text-[10px] bg-violet-600 hover:bg-violet-500 text-white font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Sync Full Language Pack
                      </button>
                    </div>
                  </div>

                  {/* Character Lecturer Persona Swapping */}
                  <div className="space-y-2" id="lecturer-persona-block">
                    <p className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-wider">Academic Lecturer Persona (Swap anytime):</p>
                    <div className="flex gap-2 flex-wrap">
                      {avatarsList.map((av) => (
                        <button
                          key={av.id}
                          onClick={() => setSelectedAvatar(av)}
                          className={`p-2 px-3.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            selectedAvatar.id === av.id
                              ? "bg-violet-600/30 border-violet-500 text-white shadow-lg"
                              : "bg-white/5 border-transparent text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <img src={av.avatarUrl} alt={av.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                          <span>{av.name}</span>
                          <span className="text-[9px] font-normal text-slate-400">({av.id === "julian" ? "Organic" : av.id === "alice" ? "Math/Tech" : "Humanities"})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dual 16:9 Screen Player Viewports Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="cinematic-dual-viewports">
                    
                    {/* LEFT PORT: Animated Video AI Teacher Talking Simulator */}
                    <div className="aspect-video bg-slate-900 rounded-2xl border border-white/10 overflow-hidden relative group/player flex flex-col justify-end" id="lecturer-video-viewport">
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <img 
                          src={selectedAvatar.avatarUrl} 
                          alt={selectedAvatar.name} 
                          className={`w-44 h-44 rounded-full object-cover border-4 border-violet-500/40 shadow-2xl transition-all duration-700 ${
                            isPlayingAudio ? "scale-105 animate-pulse shadow-[0_0_50px_rgba(139,92,246,0.3)] ring-4 ring-emerald-500/20" : ""
                          }`}
                        />
                        
                        {/* Interactive Ripple Indicators for Speech Sync */}
                        {isPlayingAudio && (
                          <div className="absolute w-52 h-52 border border-violet-500/20 rounded-full animate-ping pointer-events-none" />
                        )}
                      </div>

                      {/* Top Overlay Badge */}
                      <div className="absolute top-3 left-3 flex gap-1.5 items-center bg-black/70 p-1.5 px-3 rounded-full border border-white/10 text-[9px] font-mono text-slate-300 font-bold">
                        <span className={`w-1.5 h-1.5 rounded-full ${isPlayingAudio ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
                        <span>AI AVATAR SYNCED</span>
                      </div>

                      {/* Right Overlay Gesture Captions */}
                      <div className="absolute top-3 right-3 bg-black/80 p-1.5 px-2.5 rounded-lg border border-white/5 text-[9px] font-mono text-indigo-300 font-bold">
                        {isPlayingAudio ? (
                          <span>[Pose: Smiling, Hand pointing to right slide]</span>
                        ) : (
                          <span>[Pose: Attentive study posture]</span>
                        )}
                      </div>

                      {/* Speaking Subtitle / Active caption bottom block banner */}
                      <div className="p-4 bg-gradient-to-t from-black via-black/85 to-black/0 space-y-2 z-10">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-violet-400 font-bold">SPEECH TRANSCRIPT:</span>
                          <span className="text-[8px] bg-violet-600/20 p-0.5 px-1.5 text-violet-300 font-mono uppercase font-bold rounded">Scene {currentSceneIndex + 1}</span>
                        </div>
                        <p className="text-xs text-slate-100 leading-relaxed font-sans font-medium line-clamp-2 h-10">
                          "{aiTeacher.scenes[currentSceneIndex]?.narrationScript || "Welcome back to our study modules!"}"
                        </p>
                      </div>
                    </div>

                    {/* RIGHT PORT: Interactive Sync'd Educational Slides Stage */}
                    <div className="aspect-video bg-neutral-900/90 rounded-2xl border border-white/10 p-6 flex flex-col justify-between overflow-hidden relative shadow-2xl" id="educational-slides-viewport">
                      
                      {/* Background board chalk outlines */}
                      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />
                      
                      {/* Header slide sync phrase */}
                      <div className="flex justify-between items-center border-b border-white/5 pb-2.5 z-10">
                        <span className="text-[9.5px] font-mono text-emerald-400 uppercase font-bold tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Slide Sync Active
                        </span>
                        <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500">
                          <span>TRIGGER:</span>
                          <span className="text-slate-200 underline font-serif">"{aiTeacher.scenes[currentSceneIndex]?.slideSyncPhrase || "..."}"</span>
                        </div>
                      </div>

                      {/* Slide Core Custom Interactive Content */}
                      <div className="flex-1 flex flex-col justify-center py-3 z-10">
                        {(() => {
                          const currentScene = aiTeacher.scenes[currentSceneIndex] || aiTeacher.scenes[0];
                          switch (currentSceneIndex) {
                            case 0: // Intro
                              return (
                                <div className="flex-1 flex flex-col justify-between" id="slide-scene-1">
                                  <div className="space-y-2">
                                    <span className="text-[9px] font-mono tracking-widest text-[#ff4bb4] font-bold uppercase">Lecture Introduction Scene</span>
                                    <h4 className="text-base md:text-lg font-black text-white font-serif leading-snug">{aiTeacher.themeTopic}</h4>
                                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans mt-1">
                                      Welcome to this customized learning stream! Today, we will study the core systems step-by-step. Keep your notebook ready and tap active elements to verify queries anytime.
                                    </p>
                                  </div>
                                  <div className="p-2 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                      <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Lecturer: {selectedAvatar.name}</span>
                                    </div>
                                    <span className="text-[9.5px] font-mono text-violet-300 font-semibold uppercase">{interactiveLang} Mode</span>
                                  </div>
                                </div>
                              );
                            case 1: // Concept Overview
                              return (
                                <div className="flex-1 flex flex-col justify-between" id="slide-scene-2">
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-mono tracking-widest text-[#ffae19] font-bold uppercase">Interactive Core Definitions</span>
                                    <h4 className="text-sm font-bold text-white font-serif leading-tight">{aiTeacher.themeTopic || "Concept Scope"} Hierarchy</h4>
                                    <div className="grid grid-cols-2 gap-3 mt-1.5">
                                      <div className="p-2 bg-black/45 rounded-xl border border-white/5">
                                        <p className="text-[9.5px] font-mono font-bold text-violet-400">01. Principle</p>
                                        <p className="text-[10px] text-slate-300 font-sans leading-snug mt-0.5">Foundational axioms and core bounds governing topic balance.</p>
                                      </div>
                                      <div className="p-2 bg-black/45 rounded-xl border border-white/5">
                                        <p className="text-[9.5px] font-mono font-bold text-emerald-400">02. Catalysts</p>
                                        <p className="text-[10px] text-slate-300 font-sans leading-snug mt-0.5">Accelerates transitions, lowering active system stress variables.</p>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-[9px] italic text-slate-500 mt-2 font-mono">*Concept scope generated in {interactiveLang}*</p>
                                </div>
                              );
                            case 2: // Detailed Explanation
                              const firstChapter = aiTeacher.chapters[0] || { chapterTitle: "Detailed Scope", content: "" };
                              return (
                                <div className="flex-1 flex flex-col justify-between" id="slide-scene-3">
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-mono tracking-widest text-emerald-400 font-bold uppercase">Chalkboard Detailed Exploration</span>
                                    <h4 className="text-[13px] font-bold text-white uppercase tracking-wide truncate">{firstChapter.chapterTitle}</h4>
                                    <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5 font-mono text-[9px] text-slate-300 mt-1.5 space-y-1 leading-relaxed">
                                      <p className="text-emerald-400 font-bold border-b border-white/10 pb-0.5">📐 Dynamic Variables System:</p>
                                      <p>• Baseline Stability constant (K_eq) &ge; 1.48</p>
                                      <p>• Equilibrium margin parameter (E_max) = stable</p>
                                      <p className="text-[8px] text-slate-500 italic">Formula Yield = f(inputs, structural catalysts)</p>
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-slate-300 leading-tight font-sans mt-1">{currentScene.title}</p>
                                </div>
                              );
                            case 3: // Visual Demonstration
                              const diagramCh = aiTeacher.chapters[0] || { diagramType: "Process_Flow", diagramDescription: "Systemic flowchart sequence." };
                              return (
                                <div className="flex-1 flex flex-col justify-between overflow-hidden" id="slide-scene-4">
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-mono tracking-widest text-violet-400 font-bold uppercase">Dynamic Concept Flowchart</span>
                                    <p className="text-[9.5px] font-bold text-indigo-300 uppercase tracking-wider">DIAGRAM: {diagramCh.diagramType.replace("_", " ")}</p>
                                    
                                    {/* Visual Process Flow graphic boxes with connecting elements */}
                                    <div className="flex items-center justify-around gap-1.5 py-3 px-2 bg-black/40 rounded-xl border border-white/5 mt-1.5 text-center">
                                      <div className="p-1 px-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-lg shrink-0">
                                        <span className="block text-[8px] font-mono text-indigo-400">STEP 1</span>
                                        <span className="text-[9.5px] text-white font-bold">Input</span>
                                      </div>
                                      <div className="text-slate-500 font-mono text-[10px] animate-pulse">&rarr;</div>
                                      <div className="p-1 px-2.5 bg-violet-950/40 border border-violet-500/30 rounded-lg shrink-0">
                                        <span className="block text-[8px] font-mono text-violet-400">STEP 2</span>
                                        <span className="text-[9.5px] text-white font-bold">Catalyst</span>
                                      </div>
                                      <div className="text-slate-500 font-mono text-[10px] animate-pulse">&rarr;</div>
                                      <div className="p-1 px-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg shrink-0">
                                        <span className="block text-[8px] font-mono text-emerald-400">STEP 3</span>
                                        <span className="text-[9.5px] text-white font-bold">Yield</span>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-[9px] text-slate-400 font-serif line-clamp-1 italic text-center">"{diagramCh.diagramDescription}"</p>
                                </div>
                              );
                            case 4: // Real-Life Example
                              const exampleCh = aiTeacher.chapters[1] || aiTeacher.chapters[0] || { chapterTitle: "Practical Use", example: "Analogy sample." };
                              return (
                                <div className="flex-1 flex flex-col justify-between" id="slide-scene-5">
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-mono tracking-widest text-pink-400 font-bold uppercase">Real-World Case Analogy</span>
                                    <h5 className="text-[11px] font-mono font-bold text-white uppercase tracking-wide">{exampleCh.chapterTitle} Practical Use</h5>
                                    <div className="p-2.5 bg-pink-950/10 border border-pink-500/15 rounded-xl text-slate-200 text-[10px] leading-relaxed font-sans line-clamp-3">
                                      "{exampleCh.example}"
                                    </div>
                                  </div>
                                  <p className="text-[9px] text-indigo-300 font-medium">Lecturer advice: Connect theoretical rules directly with visual stories!</p>
                                </div>
                              );
                            case 5: // Quick Quiz (Interactive assessment)
                              return (
                                <div className="flex-1 flex flex-col justify-between" id="slide-scene-6">
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-mono tracking-widest text-[#ffae19] font-bold uppercase">Lecturer Active Assessment</span>
                                    <p className="text-[10px] font-bold text-white leading-tight">
                                      Based on our discussion, which component accelerating transitions lowers system stress variables?
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                      {[
                                        { label: "Core Catalytic factor", isCorrect: true },
                                        { label: "Static Isolated limit", isCorrect: false },
                                        { label: "Deflected output delay", isCorrect: false },
                                        { label: "Reverse ambient index", isCorrect: false }
                                      ].map((opt, oIdx) => (
                                        <button
                                          key={oIdx}
                                          onClick={() => {
                                            setInteractiveQuizAnswer(opt.label);
                                            setQuizFeedback(opt.isCorrect ? "🎉 Correct! Superb mastery chosen. You have earned 5 retention coins!" : "❌ Incorrect. Remember, catalysts accelerate active state processes to minimize stress! Try again or ask doubts below.");
                                          }}
                                          className={`p-1 px-2 rounded-lg text-left text-[9px] font-bold transition-all border ${
                                            interactiveQuizAnswer === opt.label
                                              ? opt.isCorrect
                                                ? "bg-emerald-500/20 border-emerald-500 text-white"
                                                : "bg-pink-500/20 border-pink-500 text-white"
                                              : "bg-white/5 border-transparent text-slate-300 hover:bg-white/10"
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {quizFeedback && (
                                    <p className={`text-[9px] font-bold py-1 px-2 rounded border leading-tight ${
                                      quizFeedback.startsWith("🎉") ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20" : "bg-pink-950/20 text-pink-400 border-pink-500/20"
                                    }`}>
                                      {quizFeedback}
                                    </p>
                                  )}
                                </div>
                              );
                            case 6: // Revision
                              return (
                                <div className="flex-1 flex flex-col justify-between" id="slide-scene-7">
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-mono tracking-widest text-[#10b981] font-bold uppercase">Recall Summary Checklist</span>
                                    <h5 className="text-[10px] font-sans font-bold text-slate-300">Let's check elements you recall from notes:</h5>
                                    <div className="space-y-1 mt-1.5">
                                      <label className="flex items-center gap-2 bg-black/35 p-1 rounded border border-white/5 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="accent-violet-500 shrink-0 text-white scale-75" />
                                        <span className="text-[9.5px] text-slate-300">Basic boundaries & dynamic principles</span>
                                      </label>
                                      <label className="flex items-center gap-2 bg-black/35 p-1 rounded border border-white/5 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="accent-violet-500 shrink-0 text-white scale-75" />
                                        <span className="text-[9.5px] text-slate-300">Catalyst mechanisms explaining high outcome yields</span>
                                      </label>
                                      <label className="flex items-center gap-2 bg-black/35 p-1 rounded border border-white/5 cursor-pointer">
                                        <input type="checkbox" className="accent-violet-500 shrink-0 text-white scale-75" />
                                        <span className="text-[9.5px] text-slate-300">Formulas, equations variables and analogies</span>
                                      </label>
                                    </div>
                                  </div>
                                  <p className="text-[8.5px] italic text-slate-500 text-right">*Interactive recall memory list*</p>
                                </div>
                              );
                            case 7: // Conclusion
                              return (
                                <div className="flex-1 flex flex-col justify-around text-center items-center py-1" id="slide-scene-8">
                                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 text-sm mb-0.5 animate-bounce">
                                    ✓
                                  </div>
                                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Lecture Session Completed!</h4>
                                  <p className="text-[10px] text-slate-300 max-w-sm font-sans mt-0.5 leading-tight">
                                    Excellent speed! You completed exactly 8 scenes including active MCQ diagnostics.
                                  </p>
                                  <div className="mt-1 text-[8.5px] bg-[#8b5cf6]/10 p-0.5 px-2.5 border border-violet-500/15 rounded-full text-violet-300 font-mono font-bold uppercase">
                                    Spacing intervals recommended: 1 hour, 1 day, 1 week
                                  </div>
                                </div>
                              );
                            default:
                              return null;
                          }
                        })()}
                      </div>

                      {/* Footer visual indicators */}
                      <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-mono pt-2 border-t border-white/5 z-10">
                        <span>SLIDE {currentSceneIndex + 1} OF 8</span>
                        <span>TOPIC RETENTION INDEX: STABLE</span>
                      </div>
                    </div>
                  </div>

                  {/* cinematic player controller bar */}
                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 space-y-4" id="cinematic-player-timeline-controller">
                    
                    {/* Progress slider track */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Current Scene: Scene {currentSceneIndex + 1} - {aiTeacher.scenes[currentSceneIndex]?.sceneType || "Concept"}</span>
                        <span>Time Sync Percentage: {Math.floor(audioProgress)}%</span>
                      </div>
                      
                      {/* 8-Node Interactive Timeline dots */}
                      <div className="relative pt-1">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 rounded -translate-y-1/2" />
                        
                        <div 
                          className="absolute top-1/2 left-0 h-1 bg-violet-600 rounded -translate-y-1/2 transition-all duration-300"
                          style={{ width: `${((currentSceneIndex + (audioProgress / 100)) / 8) * 100}%` }}
                        />

                        {/* Nodes */}
                        <div className="relative flex justify-between items-center z-10">
                          {aiTeacher.scenes.map((sc, sIdx) => {
                            const isPast = sIdx < currentSceneIndex;
                            const isActive = sIdx === currentSceneIndex;
                            return (
                              <button 
                                key={sIdx}
                                onClick={() => {
                                  setCurrentSceneIndex(sIdx);
                                  setAudioProgress(0);
                                  setInteractiveQuizAnswer(null);
                                  setQuizFeedback("");
                                }}
                                className={`w-3.5 h-3.5 rounded-full border-2 transition-all cursor-pointer relative group/node ${
                                  isActive 
                                    ? "bg-violet-500 border-white scale-125 shadow-[0_0_12px_rgba(139,92,246,0.6)]" 
                                    : isPast 
                                      ? "bg-emerald-500 border-transparent text-white" 
                                      : "bg-slate-900 border-slate-700"
                                }`}
                                title={`Jump to Scene ${sIdx + 1}: ${sc.sceneType}`}
                              >
                                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-mono leading-none p-1 px-1.5 rounded opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                  S{sIdx + 1}: {sc.sceneType || sc.title.slice(0, 15)}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Controller Action buttons */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      
                      {/* Audio simulation spectrum waveform bar */}
                      <div className="flex items-center gap-1.5 h-6 shrink-0 w-full sm:w-1/3">
                        <button 
                          onClick={() => {
                            setAudioProgress(0);
                            setIsPlayingAudio(true);
                          }}
                          className="bg-white/5 hover:bg-white/10 p-1 px-2.5 rounded text-[10px] font-bold text-slate-300 border border-white/5 whitespace-nowrap active:scale-95 transition-all"
                          title="Restart the current scene voiceover stream"
                        >
                          Repeat Scene
                        </button>
                        <div className="flex-1 flex items-center gap-1">
                          {[40, 20, 60, 30, 80, 50, 90, 40, 30, 70, 50, 40, 80, 25, 65, 45, 95, 30, 60, 40, 70, 20].map((h, barIdx) => {
                            // Active if playing and node matches progression
                            const isActive = isPlayingAudio && audioProgress > (barIdx / 22) * 100;
                            return (
                              <div 
                                key={barIdx} 
                                className="flex-1 rounded transition-all duration-300" 
                                style={{ 
                                  height: `${h}%`, 
                                  backgroundColor: isActive ? "#8b5cf6" : "#334155" 
                                }} 
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Main Playback controls */}
                      <div className="flex items-center gap-3">
                        <button
                          disabled={currentSceneIndex === 0}
                          onClick={() => {
                            setCurrentSceneIndex((prev) => prev - 1);
                            setAudioProgress(0);
                            setInteractiveQuizAnswer(null);
                            setQuizFeedback("");
                          }}
                          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all text-xs"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button 
                          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                          className="w-12 h-12 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-white cursor-pointer transition-all active:scale-95 shadow-lg shadow-violet-500/20"
                        >
                          {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 pl-0.5" />}
                        </button>

                        <button
                          disabled={currentSceneIndex === 7}
                          onClick={() => {
                            setCurrentSceneIndex((prev) => prev + 1);
                            setAudioProgress(0);
                            setInteractiveQuizAnswer(null);
                            setQuizFeedback("");
                          }}
                          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all text-xs"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Right Playback Speed */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9.5px] font-mono text-slate-500 uppercase">Speeds:</span>
                        <div className="flex gap-1">
                          {[1.0, 1.25, 1.5].map((speed) => (
                            <button
                              key={speed}
                              onClick={() => setPlaybackSpeed(speed)}
                              className={`p-1 px-2.5 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                                playbackSpeed === speed ? "bg-violet-600 text-white shadow-md font-extrabold" : "bg-white/5 text-slate-400 hover:text-white"
                              }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* BOTTOM GRIDS: Student Live doubt solving & Interactive Teacher tools */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-white/5" id="cinematic-student-qa-tools-panel">
                    
                    {/* Live doubt-solving Form and messaging channel (7 Cols) */}
                    <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4" id="live-mentor-qa-feed">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-violet-400" />
                          <h5 className="text-white font-bold text-xs font-mono uppercase tracking-wider">Live Dougts Mentor Channel</h5>
                        </div>
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 p-0.5 px-2 rounded-full font-mono font-bold uppercase">Lecturer Response Online</span>
                      </div>

                      {/* Chat messages list */}
                      <div className="h-[220px] overflow-y-auto space-y-3.5 pr-2 custom-scrollbar text-xs">
                        {lectureDoubtsList.map((m, mIdx) => {
                          const isStudent = m.sender === "student";
                          return (
                            <div key={mIdx} className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
                              <div className={`p-3 rounded-2xl max-w-[85%] space-y-1 ${
                                isStudent 
                                  ? "bg-violet-600 text-white rounded-tr-none" 
                                  : "bg-black/45 text-slate-200 border border-white/5 rounded-tl-none leading-relaxed"
                              }`}>
                                <p className="font-mono text-[8px] opacity-70 uppercase tracking-widest font-black">
                                  {isStudent ? "Student (You)" : `${selectedAvatar.name} (${selectedAvatar.role})`}
                                </p>
                                <p className="font-sans font-medium whitespace-pre-wrap">{m.text}</p>
                                <p className="text-[8px] text-right opacity-60">{m.time}</p>
                              </div>
                            </div>
                          );
                        })}
                        {isAnsweringDoubt && (
                          <div className="flex justify-start">
                            <div className="bg-black/30 text-indigo-300 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 border border-white/5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                              <span className="font-mono text-[9px] font-bold">Lecturer is preparing explanation in {interactiveLang}...</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Doubt prompt input */}
                      <form onSubmit={handleSendDoubt} className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={currentDoubt}
                          onChange={(e) => setCurrentDoubt(e.target.value)}
                          placeholder={`Ask ${selectedAvatar.name} a doubt in ${interactiveLang} (e.g. explain gravity equations)...`}
                          className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-violet-500 transition-all font-sans"
                        />
                        <button
                          type="submit"
                          disabled={isAnsweringDoubt || !currentDoubt.trim()}
                          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl transition-all text-xs flex items-center justify-center cursor-pointer"
                        >
                          Ask doubts
                        </button>
                      </form>
                    </div>

                    {/* Interactive teacher assessment trigger board (5 Cols) */}
                    <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4" id="live-educator-actions-triggers">
                      <div className="pb-2 border-b border-white/5">
                        <h5 className="text-white font-bold text-xs font-mono uppercase tracking-wider">Lecturer Assessment Controls</h5>
                        <p className="text-[9px] text-slate-500">Inject additional practical analogies or dynamic diagnostic MCQs.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleRequestExample}
                          className="p-3 bg-indigo-950/25 hover:bg-indigo-900/35 border border-indigo-500/20 text-indigo-300 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5 active:scale-95"
                        >
                          <Zap className="w-5 h-5 text-indigo-400" />
                          <span className="text-[10px] font-bold">Request Example</span>
                          <span className="text-[8px] text-indigo-400/70 font-normal">Inject story analogy</span>
                        </button>
                        <button
                          onClick={handleGeneratePracticeQuestions}
                          className="p-3 bg-emerald-950/25 hover:bg-emerald-900/35 border border-emerald-500/20 text-emerald-300 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5 active:scale-95"
                        >
                          <ListMusic className="w-5 h-5 text-emerald-400" />
                          <span className="text-[10px] font-bold">Generate Practice MCQs</span>
                          <span className="text-[8px] text-emerald-400/70 font-normal">Active diagnostic test</span>
                        </button>
                      </div>

                      {/* Display newly spawned elements if any */}
                      <div className="space-y-2.5 max-h-[120px] overflow-y-auto pr-1">
                        {extraExamplesList.length > 0 && (
                          <div className="p-2.5 bg-indigo-950/20 rounded-xl border border-indigo-500/15">
                            <span className="text-[8px] font-mono text-indigo-400 uppercase font-bold">Latest Analogy Generated:</span>
                            <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-2">"{extraExamplesList[extraExamplesList.length - 1]}"</p>
                          </div>
                        )}
                        {practiceQuestionsList.map((pq, pqIdx) => (
                          <div key={pqIdx} className="p-2.5 bg-emerald-950/25 rounded-xl border border-emerald-500/15">
                            <span className="text-[8px] font-mono text-emerald-400 uppercase font-bold">Practice Assessment Inject #{pqIdx+1}</span>
                            <p className="text-[10px] text-white font-bold mt-0.5 leading-snug">{pq.q}</p>
                            <p className="text-[9px] text-[#b1b4ff] font-mono font-bold mt-1">Answer Key: {pq.correct}</p>
                          </div>
                        ))}
                      </div>

                    </div>

                  </div>

                </div>

                {/* Sub Tab Navigation for AI Teacher packages */}
                <div className="flex border-b border-white/5 gap-1 pt-2" id="teacher-subtabs">
                  <button
                    onClick={() => setActiveTeacherTab("lecture")}
                    className={`px-3 py-2 font-mono font-bold text-[10px] tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
                      activeTeacherTab === "lecture"
                        ? "border-emerald-500 text-white bg-emerald-500/5"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                    Chapter Lectures
                  </button>
                  <button
                    onClick={() => setActiveTeacherTab("scenes")}
                    className={`px-3 py-2 font-mono font-bold text-[10px] tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
                      activeTeacherTab === "scenes"
                        ? "border-emerald-500 text-white bg-emerald-500/5"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <ListMusic className="w-3.5 h-3.5 text-emerald-400" />
                    7-Scene Video Board
                  </button>
                  <button
                    onClick={() => setActiveTeacherTab("tts")}
                    className={`px-3 py-2 font-mono font-bold text-[10px] tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
                      activeTeacherTab === "tts"
                        ? "border-emerald-500 text-white bg-emerald-500/5"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    Voice Narration Scripts
                  </button>
                  <button
                    onClick={() => setActiveTeacherTab("avatar")}
                    className={`px-3 py-2 font-mono font-bold text-[10px] tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
                      activeTeacherTab === "avatar"
                        ? "border-emerald-500 text-white bg-emerald-500/5"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    Avatar Sync (HeyGen/D-ID)
                  </button>
                  <button
                    onClick={() => setActiveTeacherTab("gallery")}
                    className={`px-3 py-2 font-mono font-bold text-[10px] tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
                      activeTeacherTab === "gallery"
                        ? "border-emerald-500 text-white bg-emerald-500/5"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <IconImage className="w-3.5 h-3.5 text-emerald-400" />
                    Image Prompt Gallery
                  </button>
                </div>

                {/* Sub Tab Outputs */}
                <div className="mt-4" id="teacher-subtab-contents">
                  
                  {/* WORKSPACE 1: LECTURE FLOW */}
                  {activeTeacherTab === "lecture" && (
                    <div className="space-y-6">
                      <div className="p-5 bg-slate-900/40 rounded-2xl border border-white/10 space-y-3">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                          <h5 className="font-sans font-bold text-sm text-white">Full Length Lecture Continuous Class Script</h5>
                          <button 
                            onClick={() => copyToClipboard(aiTeacher.lectureScript, "masterclass")}
                            className="bg-white/5 hover:bg-white/10 p-1 px-2.5 rounded transition-all text-[10px] text-slate-300 flex items-center gap-1.5 border border-white/5"
                          >
                            {copiedText === "masterclass" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            Copy Script
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap font-medium">{aiTeacher.lectureScript}</p>
                      </div>

                      <p className="text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">Chapter-wise Teaching Flow</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {aiTeacher.chapters.map((ch, chIdx) => (
                          <div key={chIdx} className="p-5 bg-slate-950/40 rounded-2xl border border-white/5 space-y-4 shadow-xl">
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-violet-600/15 border border-violet-500/20 text-violet-400 font-bold uppercase tracking-widest">
                              Chapter {chIdx + 1}
                            </span>
                            <h5 className="text-sm font-black text-white">{ch.chapterTitle}</h5>
                            
                            <div className="space-y-2">
                              <p className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                Interactive Teaching explanations
                              </p>
                              <p className="text-xs text-slate-300 leading-relaxed font-sans">{ch.content}</p>
                            </div>

                            <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/10">
                              <p className="text-[10px] font-mono text-pink-400 font-bold uppercase tracking-wider">
                                Real world Example / Analogy
                              </p>
                              <p className="text-xs text-slate-200 leading-relaxed">{ch.example}</p>
                            </div>

                            <div className="p-3 bg-indigo-950/15 border border-indigo-500/10 rounded-xl space-y-1">
                              <p className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                                DIAGRAM TYPE: {ch.diagramType.replace("_", " ")}
                              </p>
                              <p className="text-[11px] font-serif text-slate-300">{ch.diagramDescription}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* WORKSPACE 2: 7-SCENE VIDEO LECTURE BOARD */}
                  {activeTeacherTab === "scenes" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/10">
                        <h5 className="text-white font-bold text-xs font-mono uppercase tracking-widest text-[#94a3b8] mb-1">Educational Lecture Video Structure (7 Scenes)</h5>
                        <p className="text-[11px] text-slate-400">Chronological video template breakdown. Synthesizes continuous teaching streams with transitions visual and voice queues.</p>
                      </div>

                      <div className="space-y-4">
                        {aiTeacher.scenes.map((sc, sIdx) => (
                          <div 
                            key={sIdx} 
                            className="bg-slate-950/40 border border-white/5 hover:border-violet-500/20 transition-all p-5 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-6"
                          >
                            {/* Scene numbering identity */}
                            <div className="md:col-span-3 border-r border-white/5 pr-4 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] font-mono uppercase font-bold text-violet-400">Scene {sc.sceneNumber}</span>
                                <h6 className="text-[13px] font-black text-white mt-1 leading-snug">{sc.sceneType || `Scene ${sc.sceneNumber}`}</h6>
                                <p className="text-[11px] text-slate-400 mt-1">{sc.title}</p>
                              </div>
                              <div className="mt-4 bg-[#8b5cf6]/10 p-2 rounded-lg border border-violet-500/15">
                                <p className="text-[8px] font-mono text-violet-400 uppercase tracking-widest font-bold">Slide Sync trigger word</p>
                                <p className="text-[10px] italic text-[#f4f6fb] font-medium font-serif">"{sc.slideSyncPhrase}"</p>
                              </div>
                            </div>

                            {/* Spoken Narration and Production Visual details */}
                            <div className="md:col-span-4 bg-black/45 p-3 rounded-xl border border-white/5">
                              <p className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider mb-2">Post production Visual instructions & Overlay overlays</p>
                              <p className="text-xs text-slate-300 leading-relaxed">{sc.visualSceneDirections}</p>
                            </div>

                            <div className="md:col-span-5 bg-violet-950/10 p-3 rounded-xl border border-violet-400/10">
                              <p className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider mb-2">Voiceover speech Script (To Narration / Speak)</p>
                              <p className="text-xs text-indigo-100 font-medium leading-relaxed font-sans font-medium">"{sc.narrationScript}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* WORKSPACE 3: VOICE TTS INTEGRATION */}
                  {activeTeacherTab === "tts" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* ELEVENLABS */}
                      <div className="p-5 bg-[#0e1526]/80 rounded-2xl border border-white/10 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-xs font-mono font-bold text-[#ffae19] uppercase tracking-wider">ElevenLabs Speech format</span>
                          <button 
                            onClick={() => copyToClipboard(aiTeacher.narrationElevenLabs, "eleven")}
                            className="text-[10px] bg-white/5 hover:bg-white/10 p-1 px-2.5 rounded text-white"
                          >
                            {copiedText === "eleven" ? "Copied!" : "Copy"}
                          </button>
                        </div>
                        <p className="text-xs text-slate-400">Copy optimized text formatting with phonetic and pacing cues ready for immediate Voice Cloning generators:</p>
                        <div className="p-3.5 bg-black/45 rounded-xl text-slate-300 font-mono text-[10px] leading-relaxed max-h-[250px] overflow-y-auto whitespace-pre-wrap">
                          {aiTeacher.narrationElevenLabs}
                        </div>
                      </div>

                      {/* AZURE SPEECH ENGINE */}
                      <div className="p-5 bg-[#0e1526]/80 rounded-2xl border border-white/10 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-xs font-mono font-bold text-[#10b981] uppercase tracking-wider">Azure Speech TTS</span>
                          <button 
                            onClick={() => copyToClipboard(aiTeacher.lectureScript, "azure")}
                            className="text-[10px] bg-white/5 hover:bg-white/10 p-1 px-2.5 rounded text-white"
                          >
                            {copiedText === "azure" ? "Copied!" : "Copy"}
                          </button>
                        </div>
                        <p className="text-xs text-slate-400">Standard clean text payload optimized for Microsoft Azure cognitive voice synthesis services:</p>
                        <div className="p-3.5 bg-black/45 rounded-xl text-slate-300 font-mono text-[10px] leading-relaxed max-h-[250px] overflow-y-auto whitespace-pre-wrap">
                          {aiTeacher.lectureScript.slice(0, 800)}...
                        </div>
                      </div>

                      {/* GOOGLE TTS */}
                      <div className="p-5 bg-[#0e1526]/80 rounded-2xl border border-white/10 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-xs font-mono font-bold text-[#38bdf8] uppercase tracking-wider">Google Cloud Speech</span>
                          <button 
                            onClick={() => copyToClipboard(aiTeacher.lectureScript, "googletts")}
                            className="text-[10px] bg-white/5 hover:bg-white/10 p-1 px-2.5 rounded text-white"
                          >
                            {copiedText === "googletts" ? "Copied!" : "Copy"}
                          </button>
                        </div>
                        <p className="text-xs text-slate-400">Linear continuous plain text payload optimized for standard Google Cloud Translation TTS stream generation:</p>
                        <div className="p-3.5 bg-black/45 rounded-xl text-slate-300 font-mono text-[10px] leading-relaxed max-h-[250px] overflow-y-auto whitespace-pre-wrap">
                          {aiTeacher.lectureScript.slice(0, 800)}...
                        </div>
                      </div>

                    </div>
                  )}

                  {/* WORKSPACE 4: AVATAR PLATFORMS COMPATIBILITY */}
                  {activeTeacherTab === "avatar" && (
                    <div className="space-y-6">
                      <div className="p-4 bg-slate-900/40 rounded-xl border border-white/5">
                        <p className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">Synthesized Avatars Integrations Control Sheet</p>
                        <h4 className="text-white font-bold text-sm mt-1">Platform Compatibility with HeyGen, D-ID, Synthesia, and Tavus</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* HeyGen & D-ID Sync directives */}
                        <div className="p-5 rounded-2xl bg-slate-950/45 border border-white/5 space-y-3">
                          <h5 className="font-bold text-xs font-mono uppercase tracking-wider text-[#ffae19] flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-orange-400" />
                            HeyGen / D-ID Script controls
                          </h5>
                          <p className="text-xs text-slate-400">Copy this gesture instruction matrix and paste into the HeyGen AI Script box or D-ID audio voice sequence timelines:</p>
                          <div className="bg-black/45 p-3 rounded-lg text-slate-200 text-[10px] font-mono leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                            {aiTeacher.avatarInstructions}
                          </div>
                          <button 
                            onClick={() => copyToClipboard(aiTeacher.avatarInstructions, "heygen")}
                            className="bg-violet-600 hover:bg-violet-500 text-[10px] text-white font-bold px-3 py-1.5 rounded-xl transition-all w-full text-center list-none"
                          >
                            {copiedText === "heygen" ? "Copied Sync Sheet!" : "Copy Sync Instructions"}
                          </button>
                        </div>

                        {/* Synthesia & Tavus Scene Controls */}
                        <div className="p-5 rounded-2xl bg-slate-950/45 border border-white/5 space-y-3">
                          <h5 className="font-bold text-xs font-mono uppercase tracking-wider text-[#10b981] flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-emerald-400" />
                            Synthesia / Tavus Scene Integration
                          </h5>
                          <ul className="text-xs text-slate-400 space-y-2">
                            <li className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                              <span><strong>Multi-Scene Layout:</strong> Split production into exactly 7 distinct Synthesia timeline tracks matching our video scenes.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                              <span><strong>Real-time Slide Syncing:</strong> Use Tavus triggers matched closely to slide sync phrases (e.g. <em>"{aiTeacher.scenes[1].slideSyncPhrase}"</em>).</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                              <span><strong>Gestures Map:</strong> Map head nodding at transitions and pointing at on-screen visual diagram directions!</span>
                            </li>
                          </ul>
                          <div className="bg-[#10b981]/10 p-3 rounded-xl text-[10px] italic text-[#d1fae5] leading-relaxed border border-[#10b981]/25">
                            "Synthesia scene instructions: For each concept explained, slide the custom visual diagram onto the right half of the widescreen layout. Avatar nods to highlight the key takeaways."
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* WORKSPACE 5: IMAGE GENERATION PORTFOLIO */}
                  {activeTeacherTab === "gallery" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/10">
                        <p className="text-[10px] font-mono uppercase font-bold text-slate-400">Chapters Visual Portfolio Prompts</p>
                        <h4 className="text-white font-bold text-xs uppercase tracking-wide mt-1">Automatic Image promot Generator</h4>
                      </div>

                      <div className="p-5 bg-[#0e1526]/80 rounded-2xl border border-white/10 space-y-3">
                        <h5 className="text-sm font-bold text-white flex items-center gap-2">
                          <IconImage className="w-4 h-4 text-pink-400 animate-pulse" />
                          Master Chapter scientific Creative Prompt:
                        </h5>
                        <div className="p-4 bg-black/60 rounded-xl text-slate-200 font-sans text-xs italic relative flex items-center justify-between">
                          <span className="pr-16 leading-relaxed">"{aiTeacher.imagePrompt}"</span>
                          <button 
                            onClick={() => copyToClipboard(aiTeacher.imagePrompt, "masterimage")}
                            className="bg-violet-600 hover:bg-violet-500 text-[10px] text-white font-bold px-3 py-1.5 rounded-xl transition-all shrink-0"
                          >
                            {copiedText === "masterimage" ? "Copied!" : "Copy Prompt"}
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 3: AI Video Script */}
        {activeSubTab === "videoscript" && (
          <div className="space-y-6" id="exports-videoscript-module">
            {loadingScript && (
              <Loader message="Synthesizing notes and study plans to partition the academic lesson into high interest video timelines..." />
            )}

            {!loadingScript && !videoScript && (
              <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-white/10" id="exports-video-generation-landing">
                <Film className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h4 className="text-white font-bold text-lg">Compile AI Educational Video Script</h4>
                <p className="text-slate-400 text-sm mt-1 max-w-lg mx-auto">
                  Divides notes, objectives, and diagrams into a complete scene-by-scene script detailing narrations and post-production graphic visual triggers.
                </p>
                <button
                  onClick={triggerVideoScriptCompile}
                  className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white text-xs font-bold px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Video Script
                </button>
              </div>
            )}

            {!loadingScript && videoScript && (
              <div className="space-y-6" id="exports-video-ready-viewer">
                {/* Control bar */}
                <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4" id="video-action-bar">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                      <Film className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Scene-by-Scene Script Configured</p>
                      <p className="text-[10px] text-slate-400">1-3 minutes highly engaging educational video script complete</p>
                    </div>
                  </div>
                  <div className="flex gap-2" id="video-action-buttons">
                    <button
                      onClick={triggerVideoScriptCompile}
                      className="flex items-center gap-2 border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                    <button
                      onClick={handleDownloadVideoScript}
                      className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      Download Video Script
                    </button>
                  </div>
                </div>

                {/* Script Display */}
                <div className="space-y-4" id="sports-script-scenes-list">
                  {videoScript.map((scene, idx) => (
                    <div 
                      key={idx}
                      className="p-6 rounded-2xl bg-slate-950/40 border border-white/5 space-y-4 hover:border-violet-500/20 transition-all shadow-md"
                    >
                      <h5 className="font-mono font-bold text-xs text-violet-400 uppercase tracking-widest border-b border-white/5 pb-2">
                        Scene {scene.sceneNumber}: {scene.title}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-5 bg-black/40 p-3.5 rounded-xl border border-white/5" id={`visual-cue-${idx}`}>
                          <p className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider mb-1">Visual graphics direction</p>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans">{scene.visuals}</p>
                        </div>
                        <div className="md:col-span-7 bg-violet-950/10 p-3.5 rounded-xl border border-violet-500/10" id={`narration-${idx}`}>
                          <p className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider mb-1">Narration Script (Read aloud)</p>
                          <p className="text-xs text-indigo-100 leading-relaxed font-sans font-medium">"{scene.narration}"</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Gamma AI */}
        {activeSubTab === "gamma" && (
          <div className="space-y-6" id="exports-gamma-module">
            <div className="p-6 bg-slate-900/60 rounded-3xl border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h4 className="text-white font-bold text-base">Export to Gamma AI</h4>
                  <p className="text-slate-400 text-xs mt-1">Converts study summaries, plan objectives, and flashcard milestones to Markdown format compatible with Gamma AI Presentation.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => copyToClipboard(getGammaMarkdown(), "gamma")}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    {copiedText === "gamma" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedText === "gamma" ? "Copied!" : "Copy Gamma Prompt"}
                  </button>
                  <button
                    onClick={() => handleDownloadMarkdown(getGammaMarkdown(), `${focusedNote.title.replace(/[^a-zA-Z0-9]/g, "_")}_gamma.md`)}
                    className="flex items-center gap-1.5 border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Markdown
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 max-h-[350px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {getGammaMarkdown()}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none rounded-b-2xl" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: InVideo AI */}
        {activeSubTab === "invideo" && (
          <div className="space-y-6" id="exports-invideo-module">
            <div className="p-6 bg-slate-900/60 rounded-3xl border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h4 className="text-white font-bold text-base">Export to InVideo AI</h4>
                  <p className="text-slate-400 text-xs mt-1">Structured comprehensive prompt formatted strategically for copy-pasting directly into InVideo AI prompt box.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => copyToClipboard(getInVideoPrompt(), "invideo")}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    {copiedText === "invideo" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedText === "invideo" ? "Copied!" : "Copy InVideo Prompt"}
                  </button>
                </div>
              </div>

              <div className="p-5 bg-slate-950/60 border border-white/5 rounded-2xl font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap animate-fade">
                {getInVideoPrompt()}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
