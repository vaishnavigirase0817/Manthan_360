import { createContext, useContext, useState, ReactNode } from "react";

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "English", name: "English", nativeName: "English" },
  { code: "Hindi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "Marathi", name: "Marathi", nativeName: "मराठी" },
  { code: "Gujarati", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "Tamil", name: "Tamil", nativeName: "தமிழ்" },
  { code: "Telugu", name: "Telugu", nativeName: "తెలుగు" },
  { code: "Kannada", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "Malayalam", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "Bengali", name: "Bengali", nativeName: "বাংলা" },
  { code: "Punjabi", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
];

export interface LanguageContextType {
  selectedLanguage: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [selectedLanguage, setSelectedLanguageState] = useState(() => {
    return localStorage.getItem("manthan360_preferred_lang") || "English";
  });

  const setLanguage = (lang: string) => {
    setSelectedLanguageState(lang);
    localStorage.setItem("manthan360_preferred_lang", lang);
    window.dispatchEvent(new CustomEvent("manthan360_language_change", { detail: lang }));
  };

  return (
    <LanguageContext.Provider value={{ selectedLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      selectedLanguage: localStorage.getItem("manthan360_preferred_lang") || "English",
      setLanguage: (lang: string) => {
        localStorage.setItem("manthan360_preferred_lang", lang);
        window.dispatchEvent(new CustomEvent("manthan360_language_change", { detail: lang }));
      }
    };
  }
  return context;
}
