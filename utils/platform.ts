import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (isWeb) return;
  try {
    const Haptics = await import('expo-haptics');
    if (type === 'light') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (type === 'medium') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  } catch {
    // Haptics not available
  }
};

export const triggerNotification = async () => {
  if (isWeb) return;
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics not available
  }
};
