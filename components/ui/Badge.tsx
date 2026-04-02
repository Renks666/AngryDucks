import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { SkillLevel } from '@/lib/types';

interface SkillBadgeProps {
  level: SkillLevel;
  style?: ViewStyle;
}

const SKILL_CONFIG = {
  amateur: { label: 'Amateur', color: '#34C759', bg: 'rgba(52, 199, 89, 0.12)' },
  medium:  { label: 'Medium',  color: '#FF9500', bg: 'rgba(255, 149, 0, 0.12)' },
  pro:     { label: 'Pro',     color: '#FF3B30', bg: 'rgba(255, 59, 48, 0.12)' },
} as const;

export function SkillBadge({ level, style }: SkillBadgeProps) {
  const cfg = SKILL_CONFIG[level];
  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }, style]}>
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// Generic badge for counts / labels
interface BadgeProps {
  label: string | number;
  color?: string;
  style?: ViewStyle;
}

export function Badge({ label, color, style }: BadgeProps) {
  const { colors } = useTheme();
  const bg = color ?? colors.accent;

  return (
    <View style={[styles.pill, { backgroundColor: bg + '22' }, style]}>
      <Text style={[styles.text, { color: bg }]}>{label}</Text>
    </View>
  );
}

// Notification dot
export function NotificationDot({ count }: { count: number }) {
  const { colors } = useTheme();
  if (count === 0) return null;
  return (
    <View style={[styles.dot, { backgroundColor: colors.danger }]}>
      <Text style={styles.dotText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  dot: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dotText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
