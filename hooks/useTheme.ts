import { useColorScheme } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';

export type Colors = typeof colors.light | typeof colors.dark;

export interface Theme {
  colors: Colors;
  typography: typeof typography;
  spacing: typeof spacing;
  shadows: typeof shadows;
  isDark: boolean;
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return {
    colors: isDark ? colors.dark : colors.light,
    typography,
    spacing,
    shadows,
    isDark,
  };
}
