import { useState, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { generateQuestions, scoreAnswer, GradingResult } from '../api/geminiApi';
import { useAppStore } from '../store/useAppStore';

function isToday(timestamp: number): boolean {
  const d = new Date(timestamp);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function useInterviewer() {
  const { uid, geminiKey, jobDescription, isPaid } = useAppStore();
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<(GradingResult | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    try {
      const configRef = doc(db, 'users', uid, 'config', 'session');
      const configSnap = await getDoc(configRef);
      const config = configSnap.data();

      // Use cached questions unless paid user needs daily refresh
      if (
        config?.questions &&
        config.questions.length === 3 &&
        (!isPaid || isToday(config.lastRefresh))
      ) {
        console.log('[useInterviewer] Using cached questions');
        setQuestions(config.questions);
        setScores(new Array(3).fill(null));
        setCurrentIndex(0);
        return;
      }

      const qs = await generateQuestions(jobDescription, geminiKey);
      await setDoc(configRef, {
        questions: qs,
        lastRefresh: Date.now(),
        jobDescription,
      });

      setQuestions(qs);
      setScores(new Array(qs.length).fill(null));
      setCurrentIndex(0);
    } catch (err: any) {
      console.error('[useInterviewer] fetchQuestions error:', err);
      setError(err.message ?? 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [uid, geminiKey, jobDescription, isPaid]);

  const submitAnswer = useCallback(
    async (transcript: string) => {
      if (!questions[currentIndex]) return;
      setScoring(true);
      setError(null);
      try {
        const result = await scoreAnswer({
          question: questions[currentIndex],
          transcript,
          isPaid,
          geminiKey,
        });
        setScores((prev) => {
          const next = [...prev];
          next[currentIndex] = result;
          return next;
        });
      } catch (err: any) {
        console.error('[useInterviewer] submitAnswer error:', err);
        setError(err.message ?? 'Failed to score answer');
      } finally {
        setScoring(false);
      }
    },
    [questions, currentIndex, isPaid, geminiKey]
  );

  const nextQuestion = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
  }, [questions.length]);

  const retryQuestion = useCallback(() => {
    setScores((prev) => {
      const next = [...prev];
      next[currentIndex] = null;
      return next;
    });
  }, [currentIndex]);

  const isFinished = currentIndex >= questions.length - 1 && scores[currentIndex] !== null;

  return {
    questions,
    currentIndex,
    scores,
    loading,
    scoring,
    error,
    fetchQuestions,
    submitAnswer,
    nextQuestion,
    retryQuestion,
    isFinished,
  };
}
