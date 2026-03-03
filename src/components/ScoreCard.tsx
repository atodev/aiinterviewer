import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';
import { GradingResult } from '../api/geminiApi';
import { colors } from '../theme/colors';

interface ScoreCardProps {
  result: GradingResult;
  question: string;
  isPaid: boolean;
  onUpgrade: () => void;
  onRetry: () => void;
}

function buildCoachingScript(question: string, result: GradingResult): string {
  const { score, feedback, is_paid_content } = result;
  const lines: string[] = [];
  lines.push(`You scored ${score} out of 10.`);
  if (feedback.delivery_notes) lines.push(feedback.delivery_notes);
  if (feedback.weaknesses.length > 0) {
    lines.push('Here are some areas to improve: ' + feedback.weaknesses.join('. '));
  }
  if (is_paid_content?.improved_answer) {
    lines.push('A stronger answer to this question would be: ' + is_paid_content.improved_answer);
  }
  return lines.join(' ');
}

export function ScoreCard({ result, question, isPaid, onUpgrade, onRetry }: ScoreCardProps) {
  const { score, feedback, is_paid_content } = result;
  const [coachingOn, setCoachingOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Stop speech when coaching is turned off or component unmounts
  useEffect(() => {
    if (!coachingOn) {
      Speech.stop();
      setSpeaking(false);
    }
    return () => { Speech.stop(); };
  }, [coachingOn]);

  function toggleCoaching() {
    if (!coachingOn) {
      setCoachingOn(true);
      const script = buildCoachingScript(question, result);
      setSpeaking(true);
      Speech.speak(script, {
        language: 'en-US',
        rate: 0.88,
        pitch: 1.05,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    } else {
      setCoachingOn(false);
    }
  }

  const scoreColor =
    score >= 7 ? colors.accent : score >= 4 ? '#f59e0b' : colors.error;

  return (
    <View style={styles.card}>
      {/* Score */}
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreNumber, { color: scoreColor }]}>{score}</Text>
        <Text style={styles.scoreDenom}>/10</Text>

        {/* Coaching toggle — paid only */}
        {isPaid ? (
          <TouchableOpacity
            style={[styles.coachBadge, coachingOn && styles.coachBadgeOn]}
            onPress={toggleCoaching}
            activeOpacity={0.8}
          >
            <Text style={[styles.coachBadgeText, coachingOn && styles.coachBadgeTextOn]}>
              {coachingOn ? (speaking ? '🔊 Coaching' : '✦ Coaching') : '✦ Coach me'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.coachBadgeLocked} onPress={onUpgrade}>
            <Text style={styles.coachBadgeLockedText}>🔒 Coach me</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Strengths */}
      {feedback.strengths.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strengths</Text>
          {feedback.strengths.map((s, i) => (
            <Text key={i} style={styles.bullet}>{'✓  '}{s}</Text>
          ))}
        </View>
      )}

      {/* Weaknesses */}
      {feedback.weaknesses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Areas to Improve</Text>
          {feedback.weaknesses.map((w, i) => (
            <Text key={i} style={styles.bullet}>{'→  '}{w}</Text>
          ))}
        </View>
      )}

      {/* Delivery */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery</Text>
        <Text style={styles.bodyText}>{feedback.delivery_notes}</Text>
      </View>

      {/* Coaching panel — visible when toggled on (paid only) */}
      {coachingOn && is_paid_content && (
        <View style={styles.coachingPanel}>
          <Text style={styles.coachingHeader}>
            {speaking ? '🔊  Speaking coaching…' : '✦  Coaching'}
          </Text>

          <Text style={styles.coachingLabel}>A better answer would be…</Text>
          <Text style={styles.coachingText}>{is_paid_content.improved_answer}</Text>

          {is_paid_content.coach_advice ? (
            <>
              <Text style={styles.coachingLabel}>Follow-up tip</Text>
              <Text style={styles.bodyText}>{is_paid_content.coach_advice}</Text>
            </>
          ) : null}

          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryText}>Would you like to try that again?</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 12,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '800',
  },
  scoreDenom: {
    fontSize: 20,
    color: colors.textMuted,
    marginBottom: 8,
    marginLeft: 2,
  },
  coachBadge: {
    marginLeft: 'auto',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  coachBadgeOn: {
    backgroundColor: colors.accent,
  },
  coachBadgeText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  coachBadgeTextOn: {
    color: colors.bg,
  },
  coachBadgeLocked: {
    marginLeft: 'auto',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  coachBadgeLockedText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  bullet: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  bodyText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  coachingPanel: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.accent + '55',
    marginTop: 4,
  },
  coachingHeader: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 14,
  },
  coachingLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 4,
  },
  coachingText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  retryBtn: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    marginTop: 6,
    alignItems: 'center',
  },
  retryText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
});
