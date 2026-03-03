import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

interface AIAvatarProps {
  isActive: boolean; // true when recording or playing audio
}

export function AIAvatar({ isActive }: AIAvatarProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (isActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 700 }),
          withTiming(0.4, { duration: 700 })
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1, { duration: 400 });
      opacity.value = withTiming(0.4, { duration: 400 });
    }
  }, [isActive]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ring, ringStyle]} />
      <View style={styles.core} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: 'transparent',
  },
  core: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    opacity: 0.9,
  },
});
