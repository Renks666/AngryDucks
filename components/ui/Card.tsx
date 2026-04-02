import React from 'react';
import { View, ViewStyle, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';

type CardVariant = 'glass' | 'solid' | 'gradient';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  elevated?: boolean;
  variant?: CardVariant;
  gradient?: [string, string, ...string[]];
  accentColor?: string;
  pressable?: boolean;
  onPress?: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Card({
  children,
  style,
  padding = 16,
  elevated = false,
  variant = 'glass',
  gradient,
  accentColor,
  pressable = false,
  onPress,
}: CardProps) {
  const { colors, shadows } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 14, stiffness: 200 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 180 });
  };

  const bgColor =
    variant === 'solid'
      ? colors.backgroundSecondary
      : variant === 'glass'
      ? colors.surface
      : 'transparent';

  const shadowStyle = elevated ? shadows.medium : shadows.small;

  const inner = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: gradient ? 'transparent' : bgColor,
          padding,
          borderWidth: variant === 'glass' ? 1 : 0,
          borderColor: variant === 'glass' ? colors.surfaceBorder : 'transparent',
          ...(accentColor ? {} : shadowStyle),
        },
        accentColor ? styles.accentRow : null,
        style,
      ]}
    >
      {gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {accentColor ? (
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      ) : null}
      <View style={accentColor ? styles.accentContent : undefined}>
        {children}
      </View>
    </View>
  );

  if (pressable && onPress) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[shadowStyle, animStyle]}
      >
        {inner}
      </AnimatedTouchable>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  accentRow: {
    flexDirection: 'row',
  },
  accentBar: {
    width: 4,
  },
  accentContent: {
    flex: 1,
  },
});
