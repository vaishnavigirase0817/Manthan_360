import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import { FirebaseUser, Note } from "./types";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import UploadNotes from "./pages/UploadNotes";
import Summary from "./pages/Summary";
import Flashcards from "./pages/Flashcards";
import QuizRoom from "./pages/Quiz";
import Tutor from "./pages/Tutor";
import MindMap from "./pages/MindMap";
import Flowchart from "./pages/Flowchart";
import StudyPlanner from "./pages/StudyPlanner";
import ProgressAnalytics from "./pages/ProgressAnalytics";
import LearningVideos from "./pages/LearningVideos";
import ExportHub from "./pages/ExportHub";
import Loader from "./components/Loader";
import { checkAndTickStreak } from "./services/gamification";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";

function AppContent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [focusedNote, setFocusedNote] = useState<Note | null>(null);
  
  const navigate = useNavigate();

  // Monitor Auth Session
  useEffect(() => {
    // 1. Instantly check if there is a persistent sandbox user in local storage
    const storedDemo = localStorage.getItem("manthan360_demo_user");
    if (storedDemo) {
      try {
        const parsedDemo = JSON.parse(storedDemo);
        if (parsedDemo && parsedDemo.uid) {
          setUser(parsedDemo);
          setAuthChecking(false);
          // If they are on the root route, navigate them automatically to dashboard
          if (window.location.pathname === "/") {
            navigate("/dashboard", { replace: true });
          }
        }
      } catch (err) {
        localStorage.removeItem("manthan360_demo_user");
      }
    }

    // 2. Setup standard listener to handle standard Firebase Auth redirects/sessions
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const formattedUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        };
        setUser(formattedUser);
        localStorage.removeItem("manthan360_demo_user"); // standard auth supersedes demo mode
        
        // Connect and sync the consecutive active streak counter
        checkAndTickStreak(currentUser.uid).catch((err) => console.error("Streak sync failure:", err));
        
        // Successful login/auth -> Redirect user to Dashboard
        navigate("/dashboard", { replace: true });
      } else {
        // If there's no active standard session AND no local demo session, clear the screen
        if (!localStorage.getItem("manthan360_demo_user")) {
          setUser(null);
          setFocusedNote(null);
          setActiveTab("dashboard");
          navigate("/", { replace: true });
        }
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSelectNote = (note: Note) => {
    setFocusedNote(note);
    setActiveTab("summary"); // transition instantly to its summaries to begin studying!
  };

  const handleLoginSuccess = (u: any) => {
    if (u.uid === "demo_student_manthan360") {
      try {
        localStorage.setItem("manthan360_demo_user", JSON.stringify(u));
      } catch (err) {
        console.error("Local storage sync error:", err);
      }
    }
    setUser(u);
    navigate("/dashboard", { replace: true });
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden" id="auth-loading-gate">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-blue-600/10 rounded-full blur-[100px]" />
        <Loader message="Verifying secure student authorization session..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Landing Page Route */}
      <Route 
        path="/" 
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LandingPage onLoginSuccess={handleLoginSuccess} />
          )
        } 
      />

      {/* Protected Dashboard Route */}
      <Route 
        path="/dashboard" 
        element={
          !user ? (
            <Navigate to="/" replace />
          ) : (
            <div className="min-h-screen bg-[#020617] flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200 relative text-slate-100 overflow-x-hidden" id="edu-flow-app">
              {/* Background Decorative Elements */}
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
              <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none z-0" />

              {/* Modern Fixed Navbar */}
              <Navbar user={user} />

              {/* Two Column Workspace Layout */}
              <div className="flex-1 flex flex-col md:flex-row relative z-10" id="applet-core-shell">
                {/* Navigation Sidebar Panel */}
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} noteSelected={!!focusedNote} />

                {/* Primary View Workspace */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto" id="applet-viewport">
                  <div className="max-w-5xl mx-auto" id="applet-viewport-inner">
                    {activeTab === "dashboard" && (
                      <Dashboard
                        user={user}
                        onSelectNote={handleSelectNote}
                        focusedNote={focusedNote}
                        onUpdateNote={setFocusedNote}
                        setActiveTab={setActiveTab}
                      />
                    )}
                    
                    {activeTab === "upload" && (
                      <UploadNotes
                        user={user}
                        onUploaded={handleSelectNote}
                        setActiveTab={setActiveTab}
                      />
                    )}

                    {activeTab === "summary" && (
                      <Summary
                        focusedNote={focusedNote}
                        onUpdateNote={setFocusedNote}
                      />
                    )}

                    {activeTab === "flashcards" && (
                      <Flashcards
                        focusedNote={focusedNote}
                        onUpdateNote={setFocusedNote}
                      />
                    )}

                    {activeTab === "quiz" && (
                      <QuizRoom
                        focusedNote={focusedNote}
                        user={user}
                      />
                    )}

                    {activeTab === "tutor" && (
                      <Tutor
                        focusedNote={focusedNote}
                        user={user}
                      />
                    )}

                    {activeTab === "mindmap" && (
                      <MindMap
                        focusedNote={focusedNote}
                        onUpdateNote={setFocusedNote}
                      />
                    )}

                    {activeTab === "flowchart" && (
                      <Flowchart
                        focusedNote={focusedNote}
                        onUpdateNote={setFocusedNote}
                      />
                    )}

                    {activeTab === "planner" && (
                      <StudyPlanner
                        focusedNote={focusedNote}
                        onUpdateNote={setFocusedNote}
                      />
                    )}

                    {activeTab === "analytics" && (
                      <ProgressAnalytics
                        user={user}
                        focusedNote={focusedNote}
                        onUpdateNote={setFocusedNote}
                      />
                    )}

                    {activeTab === "videos" && (
                      <LearningVideos
                        focusedNote={focusedNote}
                        onUpdateNote={setFocusedNote}
                        user={user}
                      />
                    )}

                    {activeTab === "export" && (
                      <ExportHub
                        focusedNote={focusedNote}
                        onUpdateNote={setFocusedNote}
                      />
                    )}
                  </div>
                </main>
              </div>
            </div>
          )
        } 
      />

      {/* Fallback Catch All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
