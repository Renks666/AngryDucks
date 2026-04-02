import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: {
    regular:      'System',
    medium:       'System',
    semibold:     'System',
    bold:         'System',
    extraBold:    'System',
  },
  android: {
    regular:      'Inter-Regular',
    medium:       'Inter-Medium',
    semibold:     'Inter-SemiBold',
    bold:         'Inter-Bold',
    extraBold:    'Inter-Bold',
  },
  default: {
    regular:      'Inter-Regular',
    medium:       'Inter-Medium',
    semibold:     'Inter-SemiBold',
    bold:         'Inter-Bold',
    extraBold:    'Inter-Bold',
  },
})!;

export const typography: Record<string, TextStyle> = {
  // Hero display number (балансы, крупная статистика)
  display: {
    fontFamily: fontFamily.extraBold,
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 60,
  },
  // Экранные заголовки
  largeTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  title1: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  title2: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  title3: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  headline: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  callout: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  subheadline: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 19,
  },
  footnote: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 18,
  },
  // Uppercase label (БЛИЖАЙШАЯ ИГРА и т.д.)
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 16,
  },
};
