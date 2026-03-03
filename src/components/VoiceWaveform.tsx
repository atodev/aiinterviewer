import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

const BAR_COUNT = 7;
const BAR_MIN_HEIGHT = 4;
const BAR_MAX_HEIGHT = 36;

// Different heights per bar so they feel natural, not uniform
const BAR_PEAKS = [0.45, 0.75, 0.55, 1.0, 0.65, 0.85, 0.5];
// Stagger each bar by a different offset
const BAR_OFFSETS = [0, 80, 160, 40, 200, 120, 280];
const BAR_DURATIONS = [400, 350, 500, 320, 450, 380, 420];

interface Props {
  isActive: boolean;
}

function WaveBar({ index, isActive }: { index: number; isActive: boolean }) {
  const height = useSharedValue(BAR_MIN_HEIGHT);

  useEffect(() => {
    if (isActive) {
      const peak = BAR_MIN_HEIGHT + (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT) * BAR_PEAKS[index];
      height.value = withDelay(
        BAR_OFFSETS[index],
        withRepeat(
          withSequence(
            withTiming(peak, { duration: BAR_DURATIONS[index], easing: Easing.inOut(Easing.ease) }),
            withTiming(BAR_MIN_HEIGHT, { duration: BAR_DURATIONS[index], easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        )
      );
    } else {
      height.value = withTiming(BAR_MIN_HEIGHT, { duration: 250 });
    }
  }, [isActive]);

  const animStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.bar, animStyle]} />;
}

export function VoiceWaveform({ isActive }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <WaveBar key={i} index={i} isActive={isActive} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: BAR_MAX_HEIGHT + 4,
  },
  bar: {
    width: 4,
    borderRadius: 3,
    backgroundColor: colors.accent,
    minHeight: BAR_MIN_HEIGHT,
  },
});
