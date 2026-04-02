import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: AvatarSize;
  style?: ViewStyle | ImageStyle;
}

const SIZES: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 80,
};

const FONT_SIZES: Record<AvatarSize, number> = {
  xs: 10,
  sm: 13,
  md: 17,
  lg: 24,
  xl: 30,
};

// Deterministic gradient from name
const GRADIENTS: [string, string][] = [
  ['#FF6B6B', '#FF8E53'],
  ['#4ECDC4', '#45B7D1'],
  ['#96CEB4', '#FFEAA7'],
  ['#DDA0DD', '#98D8C8'],
  ['#F7DC6F', '#F0B27A'],
  ['#85C1E9', '#82E0AA'],
  ['#F1948A', '#D7BDE2'],
  ['#A9CCE3', '#A9DFBF'],
];

function getGradient(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return GRADIENTS[hash % GRADIENTS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ name, uri, size = 'md', style }: AvatarProps) {
  const dim = SIZES[size];
  const fontSize = FONT_SIZES[size];
  const [start, end] = getGradient(name);

  const containerStyle: ViewStyle = {
    width: dim,
    height: dim,
    borderRadius: dim / 2,
    overflow: 'hidden',
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[containerStyle as ImageStyle, style as ImageStyle]}
      />
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <LinearGradient
        colors={[start, end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.center]}
      >
        <Text style={[styles.initials, { fontSize, lineHeight: dim }]}>
          {getInitials(name)}
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
