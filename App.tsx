import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { initAuth } from './src/services/firebaseConfig';
import { useAppStore } from './src/store/useAppStore';
import { useSubscription } from './src/hooks/useSubscription';
import { SetupScreen } from './src/screens/SetupScreen';
import { InterviewScreen } from './src/screens/InterviewScreen';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { colors } from './src/theme/colors';

function AppContent() {
  const currentScreen = useAppStore((s) => s.currentScreen);
  const finalQuestions = useAppStore((s) => s.finalQuestions);
  const finalScores = useAppStore((s) => s.finalScores);
  useSubscription();

  switch (currentScreen) {
    case 'interview':
      return <InterviewScreen />;
    case 'paywall':
      return <PaywallScreen />;
    case 'results':
      return <ResultsScreen questions={finalQuestions} scores={finalScores} />;
    default:
      return <SetupScreen />;
  }
}

export default function App() {
  const setUid = useAppStore((s) => s.setUid);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initAuth()
      .then((user) => {
        setUid(user.uid);
        setReady(true);
      })
      .catch((err) => {
        console.error('[App] initAuth error:', err);
        // Still allow app to render so user sees an error state
        setReady(true);
      });
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppContent />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
