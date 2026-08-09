export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export interface SummaryData {
  shortSummary: string;
  detailedSummary: string;
  keyPoints: string[];
  revisionNotes: string;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface MindNode {
  label: string;
  children?: MindNode[];
}

export interface FlowNode {
  id: string;
  label: string;
  description: string;
  next: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Quiz {
  id: string;
  userId: string;
  noteId: string;
  noteTitle: string;
  questions: QuizQuestion[];
  createdAt: any;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  answers: { questionIndex: number; selectedOption: string; isCorrect: boolean }[];
  createdAt: any;
}

export interface StudyPlan {
  dailyPlan: { time: string; task: string; focus: string }[];
  weeklyPlan: { day: string; topic: string; objectives: string[] }[];
  tips: string[];
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  fileName?: string;
  fileUrl?: string;
  extractedText: string;
  status: "uploaded" | "processing" | "completed" | "failed";
  summary?: SummaryData;
  flashcards?: Flashcard[];
  mindMap?: MindNode;
  flowchart?: FlowNode[];
  studyPlan?: StudyPlan;
  diagnostics?: DiagnosticsData;
  slides?: SlideItem[];
  createdAt: any;
  updatedAt: any;
}

export interface SlideItem {
  title: string;
  bullets: string[];
  accentText: string;
  illustrationPrompt: string;
  narration: string;
}

export interface DiagnosticsData {
  understandingScore: number;
  revisionScore: number;
  quizScore: number;
  masteryScore: number;
  weakConcepts: {
    concept: string;
    reason: string;
    revisionTopic: string;
    suggestedAction: string;
  }[];
  basics: string[];
  intermediate: string[];
  advanced: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  noteId: string;
  messages: ChatMessage[];
  createdAt: any;
  updatedAt: any;
}
