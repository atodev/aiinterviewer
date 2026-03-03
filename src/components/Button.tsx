import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../theme/colors';

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#000' : colors.accent} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.labelPrimary,
            variant === 'outline' && styles.labelOutline,
            variant === 'ghost' && styles.labelGhost,
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.accent,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  labelPrimary: {
    color: '#000',
  },
  labelOutline: {
    color: colors.accent,
  },
  labelGhost: {
    color: colors.textMuted,
  },
});
