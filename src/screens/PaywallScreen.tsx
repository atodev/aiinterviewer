import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { purchasePremium, restorePurchases } from '../api/revenueCatApi';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';

const FEATURES = [
  { icon: '🧠', title: 'Pro AI Rewrite', desc: 'Get a professional rewrite of your answer by Gemini Pro' },
  { icon: '🎯', title: 'Coach Advice', desc: 'Personalized tips to handle follow-up questions' },
  { icon: '🔄', title: 'Daily Refresh', desc: 'Fresh interview questions every day for your job' },
  { icon: '🚫', title: 'No Ads', desc: 'Clean, distraction-free interview experience' },
];

export function PaywallScreen() {
  const { setIsPaid, navigateTo } = useAppStore();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  async function handlePurchase() {
    setPurchasing(true);
    try {
      const success = await purchasePremium();
      if (success) {
        setIsPaid(true);
        navigateTo('interview');
      }
    } catch (err: any) {
      Alert.alert('Purchase failed', err.message ?? 'Please try again');
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        setIsPaid(true);
        Alert.alert('Restored!', 'Your premium access has been restored.');
        navigateTo('interview');
      } else {
        Alert.alert('No purchase found', 'No active subscription was found for this account.');
      }
    } catch (err: any) {
      Alert.alert('Restore failed', err.message ?? 'Please try again');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.badge}>PRO</Text>
        <Text style={styles.title}>Level Up Your{'\n'}Interview Game</Text>
        <Text style={styles.subtitle}>
          Unlock AI-powered coaching and advanced feedback
        </Text>

        <View style={styles.featuresContainer}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* DEV bypass — remove before shipping */}
        <Button
          label="[DEV] Unlock Pro Free"
          onPress={() => { setIsPaid(true); navigateTo('interview'); }}
          variant="ghost"
          style={styles.devBtn}
        />

        <Button
          label="Unlock Pro"
          onPress={handlePurchase}
          loading={purchasing}
          style={styles.purchaseBtn}
        />

        <Button
          label="Restore Purchase"
          onPress={handleRestore}
          loading={restoring}
          variant="ghost"
          style={styles.restoreBtn}
        />

        <Button
          label="← Back"
          onPress={() => navigateTo('interview')}
          variant="ghost"
          style={styles.backBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: 24,
    paddingTop: 70,
    paddingBottom: 40,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.accent,
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 36,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 14,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  featureDesc: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  devBtn: {
    width: '100%',
    marginBottom: 6,
  },
  purchaseBtn: {
    width: '100%',
    marginBottom: 10,
  },
  restoreBtn: {
    width: '100%',
  },
  backBtn: {
    marginTop: 16,
  },
});
