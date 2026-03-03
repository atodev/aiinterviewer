import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { GradingResult, Dimensions, generateSynopsis } from '../api/geminiApi';
import { RadarChart } from '../components/RadarChart';
import { ProgressChart } from '../components/ProgressChart';
import { Button } from '../components/Button';
import { useAppStore } from '../store/useAppStore';
import { saveSession, fetchHistory, DailySession } from '../services/historyService';
import { colors } from '../theme/colors';

interface Props {
  questions: string[];
  scores: GradingResult[];
}

function avg(nums: number[]) {
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function avgDimensions(scores: GradingResult[]): Dimensions {
  const keys: (keyof Dimensions)[] = [
    'communication',
    'problem_solving',
    'tech_depth',
    'clarity',
    'experience',
  ];
  const result = {} as Dimensions;
  for (const key of keys) {
    result[key] = avg(scores.map((s) => s.dimensions?.[key] ?? 5));
  }
  return result;
}

function scoreColor(s: number) {
  if (s >= 7) return colors.accent;
  if (s >= 4) return '#f59e0b';
  return colors.error;
}

export function ResultsScreen({ questions, scores }: Props) {
  const { uid, geminiKey, navigateTo } = useAppStore();
  const [synopsis, setSynopsis] = useState('');
  const [loadingSynopsis, setLoadingSynopsis] = useState(true);
  const [history, setHistory] = useState<DailySession[]>([]);

  const overallScore = avg(scores.map((s) => s.score));
  const radarDimensions = avgDimensions(scores);

  // Deduplicate strengths/weaknesses across all answers
  const allStrengths = [...new Set(scores.flatMap((s) => s.feedback.strengths))].slice(0, 4);
  const allWeaknesses = [...new Set(scores.flatMap((s) => s.feedback.weaknesses))].slice(0, 3);

  useEffect(() => {
    generateSynopsis(questions, scores, geminiKey)
      .then(setSynopsis)
      .catch(() => setSynopsis('Unable to generate synopsis. Review your per-question feedback above.'))
      .finally(() => setLoadingSynopsis(false));
  }, []);

  useEffect(() => {
    if (!uid) return;
    saveSession(uid, scores)
      .then(() => fetchHistory(uid))
      .then(setHistory)
      .catch(console.warn);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.heading}>Interview Complete</Text>
      <Text style={styles.subheading}>Here's how you did</Text>

      {/* Overall score */}
      <View style={styles.scoreCircle}>
        <Text style={[styles.bigScore, { color: scoreColor(overallScore) }]}>
          {overallScore}
        </Text>
        <Text style={styles.bigScoreDenom}>/10</Text>
      </View>

      {/* Synopsis */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Overall Assessment</Text>
        {loadingSynopsis ? (
          <View style={styles.synopsisLoading}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.synopsisLoadingText}>  Writing your assessment…</Text>
          </View>
        ) : (
          <Text style={styles.synopsisText}>{synopsis}</Text>
        )}
      </View>

      {/* Radar chart */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Competency Breakdown</Text>
        <RadarChart dimensions={radarDimensions} />
      </View>

      {/* Progress over time */}
      {history.length > 1 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Progress Over Time</Text>
          <ProgressChart sessions={history} />
        </View>
      )}

      {/* Next session callout */}
      <View style={styles.nextSessionCard}>
        <Text style={styles.nextSessionTitle}>Come back tomorrow</Text>
        <Text style={styles.nextSessionSub}>
          A fresh set of questions will be ready for you at the same time tomorrow. Consistency builds confidence.
        </Text>
      </View>

      {/* Per-question scores */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Question Scores</Text>
        {questions.map((q, i) => (
          <View key={i} style={styles.questionRow}>
            <View style={styles.questionRowLeft}>
              <Text style={styles.questionRowNum}>Q{i + 1}</Text>
              <Text style={styles.questionRowText} numberOfLines={2}>{q}</Text>
            </View>
            <Text style={[styles.questionRowScore, { color: scoreColor(scores[i].score) }]}>
              {scores[i].score}/10
            </Text>
          </View>
        ))}
      </View>

      {/* Strengths */}
      {allStrengths.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Key Strengths</Text>
          {allStrengths.map((s, i) => (
            <Text key={i} style={styles.bulletGreen}>✓  {s}</Text>
          ))}
        </View>
      )}

      {/* Weaknesses */}
      {allWeaknesses.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Areas to Improve</Text>
          {allWeaknesses.map((w, i) => (
            <Text key={i} style={styles.bulletAmber}>→  {w}</Text>
          ))}
        </View>
      )}

      <Button
        label="Practice Again"
        onPress={() => navigateTo('setup')}
        style={styles.ctaBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 28,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 28,
  },
  bigScore: {
    fontSize: 72,
    fontWeight: '900',
    lineHeight: 80,
  },
  bigScoreDenom: {
    fontSize: 28,
    color: colors.textMuted,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  synopsisLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  synopsisLoadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  synopsisText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  questionRowNum: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
    marginRight: 8,
    marginTop: 1,
  },
  questionRowText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  questionRowScore: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 12,
  },
  bulletGreen: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 3,
  },
  bulletAmber: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 3,
  },
  ctaBtn: {
    marginTop: 8,
  },
  nextSessionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.accent,
    marginBottom: 14,
  },
  nextSessionTitle: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  nextSessionSub: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
});
