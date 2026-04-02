import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Platform,
  UIManager,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: ViewStyle;
}

export function SegmentedControl({
  options,
  selectedIndex,
  onChange,
  style,
}: SegmentedControlProps) {
  const { colors, isDark } = useTheme();
  const haptics = useHaptics();
  const [trackWidth, setTrackWidth] = React.useState(0);

  const segmentWidth = trackWidth > 0 ? (trackWidth - 4) / options.length : 0;

  const translateX = useSharedValue(0);

  React.useEffect(() => {
    translateX.value = withSpring(selectedIndex * segmentWidth, {
      damping: 18,
      stiffness: 220,
    });
  }, [selectedIndex, segmentWidth]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleChange = (index: number) => {
    if (index === selectedIndex) return;
    haptics.light();
    onChange(index);
  };

  const trackBg = isDark ? '#3A3A3C' : '#E5E5EA';
  const thumbBg = isDark ? '#636366' : '#FFFFFF';

  return (
    <View
      style={[styles.track, { backgroundColor: trackBg }, style]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      {/* Animated sliding thumb */}
      {segmentWidth > 0 && (
        <Animated.View
          style={[
            styles.thumb,
            {
              width: segmentWidth,
              backgroundColor: thumbBg,
            },
            thumbStyle,
          ]}
        />
      )}

      {options.map((label, i) => {
        const isActive = i === selectedIndex;
        return (
          <TouchableOpacity
            key={label}
            onPress={() => handleChange(i)}
            activeOpacity={0.85}
            style={styles.segment}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.brand : colors.textSecondary,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
    height: 36,
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    top: 2,
    left: 2,
    height: 32,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
});
