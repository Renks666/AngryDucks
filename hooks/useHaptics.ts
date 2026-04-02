import { triggerHaptic, triggerNotification } from '@/utils/platform';

export function useHaptics() {
  return {
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    success: () => triggerNotification(),
  };
}
