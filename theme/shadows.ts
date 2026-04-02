import { Platform, ViewStyle } from 'react-native';

type Shadow = ViewStyle & { boxShadow?: string };

const make = (
  y: number,
  blur: number,
  opacity: number,
  web: string,
  color = '#000000'
): Shadow => {
  if (Platform.OS === 'web') return { boxShadow: web } as Shadow;
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: y },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation: Math.round(blur / 2),
  };
};

export const shadows = {
  none:     {} as Shadow,
  small:    make(2,  8,  0.20, '0 2px 8px rgba(0,0,0,0.20)'),
  medium:   make(4,  16, 0.30, '0 4px 16px rgba(0,0,0,0.30)'),
  large:    make(8,  32, 0.40, '0 8px 32px rgba(0,0,0,0.40)'),
  elevated: make(12, 40, 0.50, '0 12px 40px rgba(0,0,0,0.50)'),
  brand:    make(6,  24, 0.45, '0 6px 24px rgba(196,30,58,0.40)', '#C41E3A'),
} as const;
