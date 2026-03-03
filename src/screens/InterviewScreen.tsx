import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useInterviewer } from '../hooks/useInterviewer';
import { useRecorder } from '../hooks/useRecorder';
import { useSpeaker } from '../hooks/useSpeaker';
import { useAppStore } from '../store/useAppStore';
import { AIAvatar } from '../components/AIAvatar';
import { ScoreCard } from '../components/ScoreCard';
import { Button } from '../components/Button';
import { BannerAdComponent } from '../services/admobService';
import { VoiceWaveform } from '../components/VoiceWaveform';
import { colors } from '../theme/colors';

export function InterviewScreen() {
  const { isPaid, navigateTo, setResults } = useAppStore();
  const {
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
  } = useInterviewer();
  const { isRecording, transcript, startRecording, stopRecording } = useRecorder();
  const { enabled: speakerEnabled, speaking, speak, toggle: toggleSpeaker } = useSpeaker();
  const [avatarActive, setAvatarActive] = useState(false);
  // Captured transcript waiting to be submitted; null means nothing recorded yet
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Speak each question as it appears
  useEffect(() => {
    if (questions[currentIndex]) {
      speak(questions[currentIndex]);
    }
  }, [currentIndex, questions, speak]);

  // Clear pending transcript whenever the question changes
  useEffect(() => {
    setPendingTranscript(null);
  }, [currentIndex]);

  useEffect(() => {
    if (error) Alert.alert('Error', error);
  }, [error]);

  useEffect(() => {
    setAvatarActive(isRecording || scoring);
  }, [isRecording, scoring]);

  async function handleMicPress() {
    if (isRecording) {
      const result = await stopRecording();
      setPendingTranscript(result); // may be null if nothing was captured
    } else {
      setPendingTranscript(null); // clear previous attempt before re-recording
      await startRecording();
    }
  }

  async function handleSubmit() {
    if (!pendingTranscript) return;
    await submitAnswer(pendingTranscript);
    setPendingTranscript(null);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Generating questions...</Text>
      </View>
    );
  }

  const currentScore = scores[currentIndex];
  const questionText = questions[currentIndex] ?? '';
  const progress = `${currentIndex + 1} / ${questions.length}`;
  const showMicButton = !currentScore && !scoring;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          showMicButton && styles.scrollWithMic,
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isRecording}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.progressText}>{progress}</Text>
          <Button
            label="Upgrade"
            onPress={() => navigateTo('paywall')}
            variant="ghost"
            style={styles.upgradeBtn}
            textStyle={{ color: colors.accent, fontSize: 13 }}
          />
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <AIAvatar isActive={avatarActive} />
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <View style={styles.questionCardHeader}>
            <Text style={styles.questionLabel}>Question {currentIndex + 1}</Text>
            <TouchableOpacity onPress={toggleSpeaker} style={styles.speakerBtn} activeOpacity={0.7}>
              <Text style={[styles.speakerIcon, !speakerEnabled && styles.speakerOff]}>
                {speakerEnabled ? (speaking ? '🔊' : '🔉') : '🔇'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.questionText}>{questionText}</Text>
        </View>

        {/* Transcript box */}
        {showMicButton && (
          <View style={styles.transcriptCard}>
            <Text style={styles.transcriptLabel}>Your Answer</Text>
            <Text style={[
              styles.transcriptText,
              !(transcript || pendingTranscript) && styles.transcriptPlaceholder,
            ]}>
              {isRecording
                ? (transcript || 'Listening…')
                : (pendingTranscript || 'Tap the button below and speak')}
            </Text>
          </View>
        )}

        {/* Scoring indicator */}
        {scoring && (
          <View style={styles.scoringRow}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.scoringText}>  Analyzing your answer...</Text>
          </View>
        )}

        {/* Score card */}
        {currentScore && (
          <ScoreCard
            result={currentScore}
            question={questionText}
            isPaid={isPaid}
            onUpgrade={() => navigateTo('paywall')}
            onRetry={() => {
              retryQuestion();
              speak(questions[currentIndex]);
            }}
          />
        )}

        {/* Next / Finish */}
        {currentScore && !isFinished && (
          <Button
            label="Next Question"
            onPress={nextQuestion}
            style={styles.nextBtn}
          />
        )}

        {isFinished && (
          <View style={styles.finishedBox}>
            <Text style={styles.finishedText}>Interview Complete!</Text>
            <Button
              label="See Results"
              onPress={() => {
                const nonNull = scores.filter((s): s is NonNullable<typeof s> => s !== null);
                setResults(questions, nonNull);
                navigateTo('results');
              }}
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {/* Banner ad for free users */}
        {!isPaid && (
          <View style={styles.adContainer}>
            <BannerAdComponent />
          </View>
        )}
      </ScrollView>

      {/* Mic + Submit — fixed outside ScrollView to avoid touch conflicts */}
      {showMicButton && (
        <View style={styles.micContainer}>
          <TouchableOpacity
            onPress={handleMicPress}
            activeOpacity={0.8}
            style={[styles.micButton, isRecording && styles.micButtonActive]}
          >
            {isRecording ? (
              <VoiceWaveform isActive={isRecording} />
            ) : (
              <Text style={styles.micIcon}>🎙️</Text>
            )}
            <Text style={styles.micLabel}>
              {isRecording ? 'Tap to stop' : pendingTranscript ? 'Re-record' : 'Tap to Speak'}
            </Text>
          </TouchableOpacity>

          {pendingTranscript && !isRecording && (
            <Button
              label="Submit Answer"
              onPress={handleSubmit}
              style={styles.submitBtn}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  scrollWithMic: {
    paddingBottom: 220,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 12,
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  questionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  speakerBtn: {
    padding: 4,
  },
  speakerIcon: {
    fontSize: 20,
  },
  speakerOff: {
    opacity: 0.4,
  },
  questionText: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '500',
  },
  transcriptCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 90,
    marginBottom: 16,
  },
  transcriptLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  transcriptText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  transcriptPlaceholder: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  scoringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoringText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  nextBtn: {
    marginTop: 8,
  },
  finishedBox: {
    alignItems: 'center',
    marginTop: 24,
  },
  adContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  micContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  micButton: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 22,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  micButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.card,
  },
  micIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  micLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 10,
  },
});
