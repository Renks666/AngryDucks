export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  // Neutrals (dark-first) — Angry Duck: Jet Black base
  neutral0:  '#0B0B0D',
  neutral1:  '#15171A',
  neutral2:  '#2B2D31',
  neutral3:  '#363840',
  neutral4:  '#42454D',
  neutral5:  '#4E5159',
  neutral6:  '#8A8A8A',
  neutral7:  '#B3B3B3',

  // Light mode surfaces
  light0:  '#FFFFFF',
  light1:  '#F6F6F8',
  light2:  '#EDEDF0',
  light3:  '#E2E2E6',
  light4:  '#D0D0D6',
  lightText1: '#0A0A0A',
  lightText2: 'rgba(0,0,0,0.50)',
  lightText3: 'rgba(0,0,0,0.28)',

  // Brand — Angry Duck palette
  crimson:       '#C1121F',  // Deep Red (primary)
  crimsonDark:   '#7A0C14',  // Deep Red dark
  crimsonDeep:   '#3D0609',  // Deep Red deepest
  crimsonGlow:   'rgba(193,18,31,0.22)',
  cream:         '#F5F5F5',  // Off White
  creamDim:      'rgba(245,245,245,0.50)',

  // Accent — Golden Yellow
  gold:          '#F4A300',
  goldGlow:      'rgba(244,163,0,0.25)',

  // Fire accent
  flame:         '#FF6A00',
  brandHover:    '#FF3B3B',
  brandGlow:     'rgba(193,18,31,0.45)',

  // Gunmetal (cards, UI blocks)
  gunmetal:      '#2B2D31',

  // System
  success:  '#30D158',
  warning:  '#FFD60A',
  danger:   '#FF453A',
  blue:     '#0A84FF',

  // Splash
  splash: '#0B0B0D',
} as const;

export type ColorScheme = 'light' | 'dark';

export const colors = {
  dark: {
    background:           palette.neutral0,
    backgroundSecondary:  palette.neutral1,
    backgroundTertiary:   palette.neutral2,
    surface:              'rgba(255,255,255,0.05)',
    surfaceElevated:      'rgba(255,255,255,0.08)',
    surfaceBorder:        'rgba(255,255,255,0.08)',
    text:                 palette.white,
    textSecondary:        palette.neutral7,
    textTertiary:         'rgba(255,255,255,0.28)',
    textInverse:          palette.black,
    separator:            'rgba(255,255,255,0.08)',
    separatorOpaque:      palette.neutral4,
    accent:               palette.gold,
    brand:                palette.crimson,
    brandDark:            palette.crimsonDark,
    brandDeep:            palette.crimsonDeep,
    brandLight:           palette.crimsonGlow,
    brandCream:           palette.cream,
    brandGlow:            palette.brandGlow,
    brandHover:           palette.brandHover,
    gold:                 palette.gold,
    goldGlow:             palette.goldGlow,
    flame:                palette.flame,
    success:              palette.success,
    warning:              palette.warning,
    danger:               palette.danger,
    tabBar:               'rgba(11,11,13,0.94)',
    tabBarBorder:         'rgba(255,255,255,0.08)',
    overlay:              'rgba(0,0,0,0.72)',
    skeleton:             palette.neutral2,
    skeletonHighlight:    palette.neutral3,
    splash:               palette.splash,
  },
  light: {
    background:           palette.light0,
    backgroundSecondary:  palette.light1,
    backgroundTertiary:   palette.light0,
    surface:              palette.light0,
    surfaceElevated:      palette.light0,
    surfaceBorder:        'rgba(0,0,0,0.08)',
    text:                 palette.lightText1,
    textSecondary:        palette.lightText2,
    textTertiary:         palette.lightText3,
    textInverse:          palette.white,
    separator:            'rgba(0,0,0,0.08)',
    separatorOpaque:      palette.light3,
    accent:               palette.gold,
    brand:                palette.crimson,
    brandDark:            palette.crimsonDark,
    brandDeep:            palette.crimsonDeep,
    brandLight:           palette.crimsonGlow,
    brandCream:           palette.cream,
    brandGlow:            'rgba(193,18,31,0.30)',
    brandHover:           palette.brandHover,
    gold:                 palette.gold,
    goldGlow:             palette.goldGlow,
    flame:                palette.flame,
    success:              '#28A745',
    warning:              '#E6920A',
    danger:               '#DC3545',
    tabBar:               'rgba(245,245,248,0.92)',
    tabBarBorder:         palette.light3,
    overlay:              'rgba(0,0,0,0.42)',
    skeleton:             palette.light2,
    skeletonHighlight:    palette.light1,
    splash:               palette.splash,
  },
} as const;

export type Colors = typeof colors.dark;
