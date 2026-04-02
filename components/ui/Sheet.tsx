import React, { useEffect } from 'react';
import {
  View,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Platform,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapHeight?: number;
  style?: ViewStyle;
}

export function Sheet({ visible, onClose, children, snapHeight, style }: SheetProps) {
  const { colors } = useTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, {
        damping: 28,
        stiffness: 300,
        mass: 0.8,
      });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withSpring(SCREEN_HEIGHT, {
        damping: 28,
        stiffness: 400,
      });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (Platform.OS === 'web') {
    if (!visible) return null;
    return (
      <View style={styles.webOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={[styles.backdrop, { backgroundColor: colors.overlay }]} />
        </TouchableWithoutFeedback>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.backgroundSecondary, maxHeight: snapHeight ?? SCREEN_HEIGHT * 0.9 },
            style,
          ]}
        >
          <View style={styles.handle} />
          {children}
        </View>
      </View>
    );
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              styles.backdrop,
              { backgroundColor: colors.overlay },
              backdropStyle,
            ]}
          />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.backgroundSecondary,
              maxHeight: snapHeight ?? SCREEN_HEIGHT * 0.9,
            },
            sheetStyle,
            style,
          ]}
        >
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  webOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(120, 120, 128, 0.4)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
});
