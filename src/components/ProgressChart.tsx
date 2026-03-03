import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { DailySession } from '../services/historyService';
import { colors } from '../theme/colors';

const BAR_WIDTH = 32;
const BAR_GAP = 8;
const MAX_HEIGHT = 100;
const CHART_HEIGHT = MAX_HEIGHT + 40; // bars + label row

function barColor(score: number): string {
  if (score >= 7) return colors.accent;
  if (score >= 4) return '#f59e0b';
  return colors.error ?? '#ef4444';
}

function shortDate(dateStr: string): string {
  // dateStr: 'YYYY-MM-DD'
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

interface Props {
  sessions: DailySession[];
}

export function ProgressChart({ sessions }: Props) {
  if (sessions.length === 0) return null;

  const avgScores = sessions.map((s) => s.avgScore);
  const peak = Math.max(...avgScores, 1);

  return (
    <View>
      {/* Trend line labels */}
      <View style={styles.trendRow}>
        <Text style={styles.trendLabel}>
          Best: {Math.max(...avgScores)}/10
        </Text>
        <Text style={styles.trendLabel}>
          Avg: {Math.round(avgScores.reduce((a, b) => a + b, 0) / avgScores.length)}/10
        </Text>
        <Text style={styles.trendLabel}>
          Sessions: {sessions.length}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScroll}
      >
        {sessions.map((session, i) => {
          const barH = Math.max(4, Math.round((session.avgScore / 10) * MAX_HEIGHT));
          const color = barColor(session.avgScore);
          const isLatest = i === sessions.length - 1;
          return (
            <View key={session.date} style={styles.barWrapper}>
              {/* Score label */}
              <Text style={[styles.scoreLabel, { color }]}>{session.avgScore}</Text>
              {/* Bar */}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barH,
                      backgroundColor: color,
                      borderWidth: isLatest ? 2 : 0,
                      borderColor: colors.text,
                    },
                  ]}
                />
              </View>
              {/* Date label */}
              <Text style={[styles.dateLabel, isLatest && styles.dateLabelBold]}>
                {shortDate(session.date)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Y-axis reference lines overlay (decorative) */}
      <View style={styles.referenceLines} pointerEvents="none">
        {[10, 7, 4].map((val) => (
          <View
            key={val}
            style={[
              styles.refLine,
              { bottom: (val / 10) * MAX_HEIGHT + 22 }, // 22px = date label height
            ]}
          >
            <Text style={styles.refLabel}>{val}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  trendLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chartScroll: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 28, // room for y-axis labels
    paddingBottom: 4,
    minHeight: CHART_HEIGHT,
  },
  barWrapper: {
    width: BAR_WIDTH + BAR_GAP,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  barTrack: {
    height: MAX_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 6,
    minHeight: 4,
  },
  dateLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
  },
  dateLabelBold: {
    color: colors.text,
    fontWeight: '700',
  },
  referenceLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: CHART_HEIGHT,
    pointerEvents: 'none',
  },
  refLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refLabel: {
    color: colors.textMuted,
    fontSize: 9,
    width: 14,
    textAlign: 'right',
    marginRight: 4,
    opacity: 0.6,
  },
});
