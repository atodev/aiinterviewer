import {
  doc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { GradingResult, Dimensions } from '../api/geminiApi';

export interface DailySession {
  date: string;        // 'YYYY-MM-DD'
  completedAt: number; // unix ms
  avgScore: number;    // 1–10 rounded
  dimensions: Dimensions;
  questionCount: number;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function avgDimensions(scores: GradingResult[]): Dimensions {
  const keys: (keyof Dimensions)[] = [
    'communication', 'problem_solving', 'tech_depth', 'clarity', 'experience',
  ];
  const result = {} as Dimensions;
  for (const key of keys) {
    const vals = scores.map((s) => s.dimensions?.[key] ?? 5);
    result[key] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  return result;
}

export async function saveSession(
  uid: string,
  scores: GradingResult[]
): Promise<void> {
  const date = todayString();
  const avgScore = Math.round(
    scores.reduce((a, b) => a + b.score, 0) / scores.length
  );
  const session: DailySession = {
    date,
    completedAt: Date.now(),
    avgScore,
    dimensions: avgDimensions(scores),
    questionCount: scores.length,
  };
  await setDoc(doc(db, 'users', uid, 'history', date), session);
}

export async function fetchHistory(uid: string): Promise<DailySession[]> {
  const ref = collection(db, 'users', uid, 'history');
  const q = query(ref, orderBy('date', 'asc'), limit(30));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as DailySession);
}
