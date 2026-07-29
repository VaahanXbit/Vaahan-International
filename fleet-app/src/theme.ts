export const colors = {
  background: '#0a0f0f',
  surface: '#0a0f0f',
  surfaceDim: '#0a0f0f',
  surfaceBright: '#242e2e',
  surfaceContainerLowest: '#000000',
  surfaceContainerLow: '#0e1515',
  surfaceContainer: '#131b1b',
  surfaceContainerHigh: '#182122',
  surfaceContainerHighest: '#1d2828',
  onSurface: '#dce8e8',
  onSurfaceVariant: '#a2adad',
  inverseSurface: '#f6fafa',
  inverseOnSurface: '#515656',
  outline: '#6c7778',
  outlineVariant: '#3f4a4a',
  surfaceTint: '#9bd0d5',
  primary: '#9bd0d5', // Steel Teal / Cyan spot
  onPrimary: '#0c474c',
  primaryContainer: '#255a5f',
  onPrimaryContainer: '#b8edf2',
  inversePrimary: '#33676c',
  secondary: '#b0ccce',
  onSecondary: '#2b4446',
  secondaryContainer: '#264041',
  onSecondaryContainer: '#a9c4c6',
  tertiary: '#d1e8ff',
  onTertiary: '#325773',
  tertiaryContainer: '#b6dbfd',
  onTertiaryContainer: '#294e6a',
  error: '#fa746f',
  onError: '#490006',
  errorContainer: '#871f21',
  onErrorContainer: '#ff9993',
  
  // Custom brand references
  brandRed: '#e50914',
  brandTeal: '#4c7f84',
  brandBlueGrey: '#627c7e',
  brandDarkGrey: '#577b99',
  brandMutedGrey: '#737878'
} as const;

export const spacing = {
  unit: 4,
  baseline: 4,
  gutter: 24,
  margin: 32,
} as const;

export const rounded = {
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  metricDisplay: {
    fontSize: 72,
    fontWeight: '700' as const,
    lineHeight: 80,
    letterSpacing: -0.02 * 72,
  },
  metricLg: {
    fontSize: 48,
    fontWeight: '700' as const,
    lineHeight: 56,
    letterSpacing: -0.01 * 48,
  },
  metricMobile: {
    fontSize: 40,
    fontWeight: '700' as const,
    lineHeight: 48,
  },
  headlineMd: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  bodyLg: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28,
  },
  bodyMd: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  labelCaps: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.05 * 12,
  },
} as const;

export const theme = {
  colors,
  spacing,
  rounded,
  typography,
};
export default theme;
