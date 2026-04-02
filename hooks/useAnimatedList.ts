import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

export function useAnimatedListItem(index: number, delay = 50) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const d = index * delay;
    opacity.value = withDelay(d, withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }));
    translateY.value = withDelay(d, withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }));
  }, [index, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
}
