import { useState, useRef, DragEvent, ChangeEvent } from "react";
import Tesseract from "tesseract.js";
import { Upload, FileText, Image, PenTool, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { FirebaseUser, Note } from "../types";

interface NoteUploaderProps {
  user: FirebaseUser | null;
  onUploaded: (note: Note) => void;
}

export default function NoteUploader({ user, onUploaded }: NoteUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedText, setExtractedText] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop events
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    setError("");
    const fileType = selectedFile.type;
    const isImage = fileType.startsWith("image/");
    const isPdf = fileType === "application/pdf" || selectedFile.name.endsWith(".pdf");

    if (!isImage && !isPdf) {
      setError("Please upload an image (PNG, JPG) or a PDF study material.");
      return;
    }

    setFile(selectedFile);
    if (!title) {
      // Auto fill title from filename
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    if (isImage) {
      triggerOCR(selectedFile);
    } else {
      // PDF handling: prompt for manual fallback or simplified parse guidance
      setExtractedText(
        `[PDF Uploaded: ${selectedFile.name}]\nNote: PDFs represent advanced layouts. For optimal precision, you can copy-paste the text directly or let our AI study tutor assist you with this document context.`
      );
    }
  };

  const triggerOCR = (imageFile: File) => {
    setIsOcrProcessing(true);
    setOcrProgress(0);
    setError("");

    Tesseract.recognize(imageFile, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setOcrProgress(Math.round(m.progress * 100));
        }
      },
    })
      .then(({ data: { text } }) => {
        setIsOcrProcessing(false);
        if (text.trim().length === 0) {
          setError("No readable handwritten notes found. Please ensure the note image has high legibility.");
        } else {
          setExtractedText(text);
        }
      })
      .catch((err) => {
        console.error("Tesseract error:", err);
        setIsOcrProcessing(false);
        setError("OCR Engine failed to process note. Please copy-paste your notes text manually below.");
      });
  };

  const handleManualPasteSubmit = () => {
    if (!pasteText.trim()) {
      setError("Please paste some revision notes first!");
      return;
    }
    setExtractedText(pasteText);
    if (!title) {
      setTitle("Study Material Note");
    }
  };

  const handleSaveAndGenerate = async () => {
    if (!user) {
      setError("Authentication required to save notes.");
      return;
    }
    if (!title.trim()) {
      setError("Please supply a study title or topic name.");
      return;
    }
    if (!extractedText.trim()) {
      setError("Notes must contain extracted text before generating study material.");
      return;
    }

    try {
      setError("");
      const noteId = "note_" + Date.now();
      
      const newNote: Note = {
        id: noteId,
        userId: user.uid,
        title: title,
        fileName: file ? file.name : "pasted_text.txt",
        extractedText: extractedText,
        status: "uploaded",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store basic note metadata in Firestore
      await setDoc(doc(db, "notes", noteId), {
        id: newNote.id,
        userId: newNote.userId,
        title: newNote.title,
        fileName: newNote.fileName || "Note",
        extractedText: newNote.extractedText,
        status: "uploaded",
        createdAt: newNote.createdAt,
        updatedAt: newNote.updatedAt,
      });

      onUploaded(newNote);
    } catch (e: any) {
      console.error("Firestore Note Save Error:", e);
      setError("Database sync failed. Check cloud parameters or connectivity.");
    }
  };

  const resetUploader = () => {
    setFile(null);
    setTitle("");
    setIsOcrProcessing(false);
    setOcrProgress(0);
    setExtractedText("");
    setPasteText("");
    setError("");
  };

  return (
    <div className="w-full space-y-6" id="note-uploader-wrapper">
      {error && (
        <div id="uploader-error-banner" className="bg-red-950/40 border border-red-900/60 p-4 rounded-2xl flex items-center gap-3 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* State A: File is not selected or OCR under processing / Text empty */}
      {!extractedText && !isOcrProcessing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="uploader-input-selector">
          {/* Box 1: File OCR Drag n Drop */}
          <div
            id="drag-drop-zone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed p-10 rounded-3xl flex flex-col items-center justify-center text-center transition-all min-h-[340px] bg-slate-900/10 backdrop-blur-md ${
              dragActive
                ? "border-cyan-400 bg-cyan-950/20 scale-98"
                : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/30"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="hidden"
              id="uploader-file-input"
            />
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/50 border border-cyan-800/60 flex items-center justify-center mb-6 text-cyan-400">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="font-sans font-semibold text-lg text-slate-100">Drag & Drop Study Notes</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm">
              Upload handwritten notes images, slides screenshots, or exam sheets (PNG, JPG, PDF) to run instant optical AI scanning.
            </p>
            <span className="text-xs font-mono text-cyan-500 bg-cyan-950/30 border border-cyan-900/40 px-3 py-1.5 rounded-full mt-6">
              Tesseract OCR Engine Armed
            </span>
          </div>

          {/* Box 2: Manual Text Copy Paste (Ultimate Fail-Safe) */}
          <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/20 backdrop-blur-md flex flex-col justify-between min-h-[340px]" id="manual-paste-zone">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-950/50 border border-indigo-900/40 flex items-center justify-center text-indigo-400">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-slate-100 text-base">Direct Revision Copy-Paste</h3>
                  <p className="text-xs text-slate-400">Paste textbooks chapter clippings or lecture notes directly</p>
                </div>
              </div>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your notes text, exam syllabus or slide paragraphs here..."
                className="w-full h-44 rounded-2xl bg-slate-950/90 border border-slate-800 p-4 text-sm text-slate-300 font-sans focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 resize-none"
                id="manual-paste-textarea"
              />
            </div>
            <button
              onClick={handleManualPasteSubmit}
              id="manual-submit-btn"
              className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 px-5 rounded-2xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              Analyze Pasted Text
            </button>
          </div>
        </div>
      )}

      {/* OCR processing active */}
      {isOcrProcessing && (
        <div className="border border-slate-800 p-12 rounded-3xl bg-slate-900/20 backdrop-blur-md text-center flex flex-col items-center justify-center" id="ocr-progress-card">
          <div className="relative w-20 h-20 mb-6" id="ocr-pulse">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-cyan-500/20 bg-cyan-500/5"
              animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-4 rounded-full border-t-2 border-r-2 border-cyan-400 animate-spin" />
          </div>
          <h3 className="text-xl font-sans font-semibold text-slate-100">Scanning Your Notes</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-sm">
            Tesseract.js OCR is decoding the handwritten structure and text in your screenshot...
          </p>
          <div className="w-full max-w-sm bg-slate-950 rounded-full h-3 border border-slate-800 mt-6 overflow-hidden" id="ocr-progress-track">
            <motion.div
              className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full"
              initial={{ width: "0%" }}
              animate={{ width: `${ocrProgress}%` }}
              transition={{ ease: "easeInOut" }}
            />
          </div>
          <span className="text-xs font-mono text-cyan-400 mt-3">{ocrProgress}% Complete</span>
        </div>
      )}

      {/* Extracted/Editable Notes view */}
      {extractedText && (
        <div className="border border-slate-800 rounded-3xl p-6 bg-slate-900/25 backdrop-blur-md space-y-6" id="notes-extracted-review">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5" id="review-header">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-900/45 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-slate-100 text-lg">OCR Extracted Study Text</h3>
                <p className="text-xs text-slate-400">Please review and edit the text to refine spelling before pushing to AI</p>
              </div>
            </div>
            <button
              onClick={resetUploader}
              id="ocr-reupload-btn"
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-800 text-xs font-mono rounded-lg text-slate-400 hover:text-white hover:bg-slate-900/80 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-upload File
            </button>
          </div>

          <div className="space-y-4" id="review-body">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                Study Topic / Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mitosis and Cell Division"
                className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-4 py-3 text-sm text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                id="review-title-input"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                Editable Study Content
              </label>
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                className="w-full h-80 rounded-2xl bg-slate-950/80 border border-slate-800 p-5 text-sm text-slate-300 font-sans leading-relaxed focus:outline-none focus:border-cyan-500 resize-y"
                id="review-textarea"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end" id="review-actions">
            <button
              id="confirm-generate-modules-btn"
              onClick={handleSaveAndGenerate}
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:opacity-90 text-white font-semibold py-3.5 px-8 rounded-2xl transition-all cursor-pointer"
            >
              Analyze & Generate Study Modules
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
