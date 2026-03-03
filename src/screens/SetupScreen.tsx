import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/Button';
import { fetchJobFromUrl } from '../api/geminiApi';
import { colors } from '../theme/colors';

export function SetupScreen() {
  const { uid, geminiKey: storedKey, jobDescription: storedJob, setGeminiKey, setJobDescription, navigateTo } = useAppStore();
  const [key, setKey] = useState(storedKey);
  const [job, setJob] = useState(storedJob);
  const [jobUrl, setJobUrl] = useState('');
  const [fetchingJob, setFetchingJob] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleFetchJob() {
    if (!jobUrl.trim()) return;
    setFetchingJob(true);
    try {
      const extracted = await fetchJobFromUrl(jobUrl.trim(), key.trim());
      setJob(extracted);
    } catch (err: any) {
      Alert.alert('Could not fetch job', err.message ?? 'Check the URL and try again.');
    } finally {
      setFetchingJob(false);
    }
  }

  async function handleStart() {
    if (!key.trim() || !job.trim()) {
      Alert.alert('Missing fields', 'Please enter your Gemini API key and job description.');
      return;
    }
    if (!uid) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', uid, 'config', 'session'), {
        geminiKey: key.trim(),
        jobDescription: job.trim(),
        savedAt: Date.now(),
      });
      setGeminiKey(key.trim());
      setJobDescription(job.trim());
      navigateTo('interview');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to save config');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>AI Interviewer</Text>
        <Text style={styles.subtitle}>Practice interviews powered by Gemini</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Gemini API Key</Text>
          <TextInput
            style={styles.input}
            value={key}
            onChangeText={setKey}
            placeholder="AIza..."
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Job Listing URL (optional)</Text>
          <View style={styles.urlRow}>
            <TextInput
              style={[styles.input, styles.urlInput]}
              value={jobUrl}
              onChangeText={setJobUrl}
              placeholder="https://www.seek.com.au/job/..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Button
              label={fetchingJob ? '…' : 'Fetch'}
              onPress={handleFetchJob}
              loading={fetchingJob}
              style={styles.fetchBtn}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Job Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={job}
            onChangeText={setJob}
            placeholder="Paste the job description, or fetch it from a URL above..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <Button
          label="Start Interview"
          onPress={handleStart}
          loading={saving}
          style={styles.button}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: {
    padding: 24,
    paddingTop: 80,
    flexGrow: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 40,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  multiline: {
    height: 140,
    paddingTop: 14,
  },
  button: {
    marginTop: 12,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urlInput: {
    flex: 1,
  },
  fetchBtn: {
    paddingHorizontal: 8,
    minWidth: 64,
  },
});
