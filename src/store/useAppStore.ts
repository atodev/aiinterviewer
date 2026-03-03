import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { GradingResult } from '../api/geminiApi';

export type Screen = 'setup' | 'interview' | 'paywall' | 'results';

interface AppState {
  uid: string | null;
  geminiKey: string;
  jobDescription: string;
  isPaid: boolean;
  currentScreen: Screen;
  finalQuestions: string[];
  finalScores: GradingResult[];

  setUid: (uid: string) => void;
  setGeminiKey: (key: string) => void;
  setJobDescription: (desc: string) => void;
  setIsPaid: (paid: boolean) => void;
  navigateTo: (screen: Screen) => void;
  setResults: (questions: string[], scores: GradingResult[]) => void;
}

const secureStorage = createJSONStorage(() => ({
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}));

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      uid: null,
      geminiKey: '',
      jobDescription: '',
      isPaid: true, // DEV: set false for free-tier testing
      currentScreen: 'setup',
      finalQuestions: [],
      finalScores: [],

      setUid: (uid) => set({ uid }),
      setGeminiKey: (key) => set({ geminiKey: key }),
      setJobDescription: (desc) => set({ jobDescription: desc }),
      setIsPaid: (paid) => set({ isPaid: paid }),
      navigateTo: (screen) => set({ currentScreen: screen }),
      setResults: (finalQuestions, finalScores) => set({ finalQuestions, finalScores }),
    }),
    {
      name: 'ai-interviewer-store',
      storage: secureStorage,
      partialize: (state) => ({
        geminiKey: state.geminiKey,
        jobDescription: state.jobDescription,
      }),
    }
  )
);
