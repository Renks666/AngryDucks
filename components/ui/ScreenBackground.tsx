import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ScreenBackgroundProps {
  children: React.ReactNode;
  overlayOpacity?: number;
}

export function ScreenBackground({ children }: ScreenBackgroundProps) {
  return (
    <View style={styles.bg}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#0B0B0D',
  },
});
