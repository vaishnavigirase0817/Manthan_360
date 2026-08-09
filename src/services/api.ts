import { SummaryData, Flashcard, MindNode, FlowNode, QuizQuestion, ChatMessage, StudyPlan, SlideItem, DiagnosticsData } from "../types";

// Dynamic, safe JSON parser that formats error messages nicely and avoids JSON parse crashes on HTML
async function handleResponseJson(response: Response, defaultError: string) {
  const text = await response.text();
  if (!response.ok) {
    let errMsg = defaultError;
    try {
      const parsed = JSON.parse(text);
      if (parsed.error) {
        errMsg = parsed.error;
      }
    } catch (_) {
      errMsg = `${defaultError} (HTTP ${response.status}: ${response.statusText || "Communication Issue"}). Please retry in a few seconds.`;
    }
    throw new Error(errMsg);
  }
  try {
    return JSON.parse(text);
  } catch (err: any) {
    throw new Error(`Invalid server response: ${err.message || err}.`);
  }
}

export async function generateNotesSummary(text: string): Promise<SummaryData> {
  const language = localStorage.getItem("manthan360_preferred_lang") || "English";
  const response = await fetch("/api/gemini/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  return handleResponseJson(response, "Failed to generate note summary");
}

export async function generateNotesQuiz(text: string): Promise<QuizQuestion[]> {
  const language = localStorage.getItem("manthan360_preferred_lang") || "English";
  const response = await fetch("/api/gemini/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  return handleResponseJson(response, "Failed to generate interactive quiz");
}

export async function generateNotesFlashcards(text: string): Promise<Flashcard[]> {
  const language = localStorage.getItem("manthan360_preferred_lang") || "English";
  const response = await fetch("/api/gemini/flashcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  return handleResponseJson(response, "Failed to generate revision flashcards");
}

export async function generateNotesMindmap(text: string): Promise<MindNode> {
  const language = localStorage.getItem("manthan360_preferred_lang") || "English";
  const response = await fetch("/api/gemini/mindmap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  return handleResponseJson(response, "Failed to generate visual mind map");
}

export async function generateNotesFlowchart(text: string): Promise<FlowNode[]> {
  const language = localStorage.getItem("manthan360_preferred_lang") || "English";
  const response = await fetch("/api/gemini/flowchart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  return handleResponseJson(response, "Failed to generate step-by-step flowchart");
}

export async function getTutorCorrection(messages: ChatMessage[], context: string): Promise<string> {
  const language = localStorage.getItem("manthan360_preferred_lang") || "English";
  const response = await fetch("/api/gemini/tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context, language }),
  });
  const data = await handleResponseJson(response, "Tutor session connection error");
  return data.text;
}

export async function generateNotesStudyPlan(text: string): Promise<StudyPlan> {
  const language = localStorage.getItem("manthan360_preferred_lang") || "English";
  const response = await fetch("/api/gemini/studyplan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  return handleResponseJson(response, "Failed to generate dynamic study plan");
}

export async function generateNotesDiagnostics(text: string, attempts: any[]): Promise<DiagnosticsData> {
  const language = localStorage.getItem("manthan360_preferred_lang") || "English";
  const response = await fetch("/api/gemini/diagnostics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, attempts, language }),
  });
  return handleResponseJson(response, "Failed to generate study diagnostics");
}

export async function generateNotesSlides(text: string): Promise<SlideItem[]> {
  const language = localStorage.getItem("manthan360_preferred_lang") || "English";
  const response = await fetch("/api/gemini/slides", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  return handleResponseJson(response, "Failed to compile animated slide deck");
}

export interface SlideDeckItem {
  slideType: "title" | "problem" | "concepts" | "summary" | "roadmap" | "conclusion";
  title: string;
  subtitle?: string;
  elements: string[];
  keyTakeawayBox: string;
  visualSummarySection: string;
  imagePrompt: string;
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
  };
  diagram: {
    type: "timeline" | "process" | "comparison" | "chart" | "anatomy" | "network" | "concept_map";
    title: string;
    data: string;
  };
}

export interface VideoScriptScene {
  sceneNumber: number;
  title: string;
  narration: string;
  visuals: string;
}

export interface TeacherSceneItem {
  sceneNumber: number;
  sceneType: string;
  title: string;
  narrationScript: string;
  slideSyncPhrase: string;
  visualSceneDirections: string;
}

export interface TeacherChapterItem {
  chapterTitle: string;
  content: string;
  example: string;
  diagramType: string;
  diagramDescription: string;
}

export interface AITeacherResponse {
  themeTopic: string;
  imagePrompt: string;
  lectureScript: string;
  narrationElevenLabs: string;
  avatarInstructions: string;
  scenes: TeacherSceneItem[];
  chapters: TeacherChapterItem[];
}

export async function generatePresentationDeck(
  noteId: string,
  title: string,
  text: string,
  summary: any,
  diagnostics: any
): Promise<SlideDeckItem[]> {
  const language = localStorage.getItem("manthan360_preferred_lang") || "English";
  const response = await fetch("/api/gemini/presentation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ noteId, title, text, summary, diagnostics, language }),
  });
  return handleResponseJson(response, "Failed to compile slide presentation deck");
}

export async function generateVideoScript(
  noteId: string,
  title: string,
  text: string,
  summary: any
): Promise<VideoScriptScene[]> {
  const language = localStorage.getItem("manthan360_preferred_lang") || "English";
  const response = await fetch("/api/gemini/videoscript", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ noteId, title, text, summary, language }),
  });
  return handleResponseJson(response, "Failed to generate AI video script");
}

export async function generateAITeacherPack(
  title: string,
  text: string,
  summary: any,
  diagnostics: any,
  quiz: any,
  flashcards: any[],
  mindMap: any
): Promise<AITeacherResponse> {
  const language = localStorage.getItem("manthan360_preferred_lang") || "English";
  const response = await fetch("/api/gemini/teacher", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, text, summary, diagnostics, quiz, flashcards, mindMap, language }),
  });
  return handleResponseJson(response, "Failed to compile Virtual AI Teacher Session");
}
