import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.skeleton, colors.skeletonHighlight]
    ),
  }));

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
}

// Pre-built skeleton layouts
export function CardSkeleton({ style }: { style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundTertiary }, style]}>
      <Skeleton height={20} width="60%" borderRadius={6} style={styles.mb8} />
      <Skeleton height={14} width="90%" borderRadius={4} style={styles.mb6} />
      <Skeleton height={14} width="70%" borderRadius={4} style={styles.mb16} />
      <View style={styles.row}>
        <Skeleton width={60} height={26} borderRadius={13} />
        <Skeleton width={80} height={26} borderRadius={13} style={styles.ml8} />
      </View>
    </View>
  );
}

export function RowSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.rowSkeleton, style]}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.rowContent}>
        <Skeleton height={16} width="55%" borderRadius={5} style={styles.mb6} />
        <Skeleton height={12} width="35%" borderRadius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  rowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowContent: {
    flex: 1,
    marginLeft: 12,
  },
  mb6:  { marginBottom: 6 },
  mb8:  { marginBottom: 8 },
  mb16: { marginBottom: 16 },
  ml8:  { marginLeft: 8 },
  row:  { flexDirection: 'row' },
});
