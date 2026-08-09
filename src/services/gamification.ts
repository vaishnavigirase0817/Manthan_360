import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface UserProgress {
  userId: string;
  xp: number;
  level: number;
  streak: number;
  lastActive: string | null; // ISO Date string
  badges: { id: string; label: string; desc: string; icon: string; earnedAt: string }[];
  achievements: { id: string; label: string; desc: string; unlockedAt: string }[];
}

export interface UserProgressUpdate {
  progress: UserProgress;
  xpGained: number;
  leveledUp: boolean;
  newBadges: string[];
}

const BADGES_LIST = [
  { id: "first_conquest", label: "First Victory", desc: "Completed your first interactive quiz!", icon: "🛡️" },
  { id: "perfect_score", label: "Pure Wisdom", desc: "Achieved a perfect 100% score on a quiz!", icon: "👑" },
  { id: "scholar_spirit", label: "Wisdom Apprentice", desc: "Accumulate more than 200 XP points!", icon: "📖" },
  { id: "grandmaster", label: "Grandmaster", desc: "Elevated your academic standing to Level 5!", icon: "🧙‍♂️" },
  { id: "streak_warrior", label: "Consistent Force", desc: "Kept a 3-day dynamic learning streak alive!", icon: "🔥" },
  { id: "academic_pioneer", label: "Pioneer Notes", desc: "Generated notes summary and study strategies!", icon: "🚀" }
];

const DEFAULT_PROGRESS = (userId: string): UserProgress => ({
  userId,
  xp: 0,
  level: 1,
  streak: 1,
  lastActive: new Date().toISOString(),
  badges: [],
  achievements: []
});

export async function getUserProgress(userId: string): Promise<UserProgress> {
  try {
    const docRef = doc(db, "userProgress", userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProgress;
    } else {
      const defaultProg = DEFAULT_PROGRESS(userId);
      await setDoc(docRef, defaultProg);
      return defaultProg;
    }
  } catch (err) {
    console.error("Error fetching user progress:", err);
    return DEFAULT_PROGRESS(userId);
  }
}

export async function awardXPAndLogQuiz(
  userId: string, 
  score: number, 
  total: number
): Promise<UserProgressUpdate> {
  const current = await getUserProgress(userId);
  
  // XP calculation rules:
  // Base 20 XP per quiz + 25 XP for each correct answer + 50 XP perfect bonus
  const accuracy = total > 0 ? (score / total) : 0;
  const correctXP = score * 25;
  const perfectBonus = accuracy === 1 ? 50 : 0;
  const baseXP = 20;
  
  const xpGained = baseXP + correctXP + perfectBonus;
  const prevLevel = current.level;
  
  // Level threshold: 300 XP per level
  const totalXP = current.xp + xpGained;
  const newLevel = Math.floor(totalXP / 300) + 1;
  const leveledUp = newLevel > prevLevel;
  
  // Badge check Logic
  const earnedBadges = [...(current.badges || [])];
  const newEarnedBadges: string[] = [];
  const nowStr = new Date().toISOString();

  // Helper inside badge loop
  const awardBadge = (badgeId: string) => {
    if (!earnedBadges.some(b => b.id === badgeId)) {
      const match = BADGES_LIST.find(b => b.id === badgeId);
      if (match) {
        earnedBadges.push({
          ...match,
          earnedAt: nowStr
        });
        newEarnedBadges.push(match.label);
      }
    }
  };

  // Badge 1: First Conquest
  awardBadge("first_conquest");

  // Badge 2: Perfect Score
  if (accuracy === 1) {
    awardBadge("perfect_score");
  }

  // Badge 3: Scholar Spirit (XP Threshold)
  if (totalXP >= 200) {
    awardBadge("scholar_spirit");
  }

  // Badge 4: Grandmaster (Reach Level 5)
  if (newLevel >= 5) {
    awardBadge("grandmaster");
  }

  // Badge 5: Streak Warrior
  if (current.streak >= 3) {
    awardBadge("streak_warrior");
  }

  const updatedProgress: UserProgress = {
    ...current,
    xp: totalXP,
    level: newLevel,
    badges: earnedBadges,
    lastActive: nowStr,
  };

  try {
    const docRef = doc(db, "userProgress", userId);
    await setDoc(docRef, updatedProgress);
  } catch (e) {
    console.error("Failed to persist user progress to Firestore:", e);
  }

  return {
    progress: updatedProgress,
    xpGained,
    leveledUp,
    newBadges: newEarnedBadges
  };
}

export async function checkAndTickStreak(userId: string): Promise<UserProgress> {
  const current = await getUserProgress(userId);
  if (!current.lastActive) {
    current.streak = 1;
    current.lastActive = new Date().toISOString();
    return current;
  }

  const now = new Date();
  const lastActiveDate = new Date(current.lastActive);

  // Strip hours to check date differences
  const d1 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const d2 = Date.UTC(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate());
  const diffDays = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));

  let updatedStreak = current.streak;
  if (diffDays === 1) {
    // Active on consecutive day: Advance streak
    updatedStreak += 1;
  } else if (diffDays > 1) {
    // Lost streak: Reset back to 1
    updatedStreak = 1;
  }

  const earnedBadges = [...(current.badges || [])];
  const nowStr = now.toISOString();

  if (updatedStreak >= 3 && !earnedBadges.some(b => b.id === "streak_warrior")) {
    const match = BADGES_LIST.find(b => b.id === "streak_warrior");
    if (match) {
      earnedBadges.push({ ...match, earnedAt: nowStr });
    }
  }

  const updatedProgress = {
    ...current,
    streak: updatedStreak,
    lastActive: nowStr,
    badges: earnedBadges
  };

  try {
    const docRef = doc(db, "userProgress", userId);
    await setDoc(docRef, updatedProgress);
  } catch (e) {
    console.error("Streak sync failed:", e);
  }

  return updatedProgress;
}
