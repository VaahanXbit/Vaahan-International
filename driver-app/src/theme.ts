export const colors = {
  background: '#0F0F12',    
  card: '#191A23',          
  text: '#F8FAFC',          
  textMuted: '#64748B',     
  primary: '#6366F1',       
  success: '#10B981',       
  danger: '#EF4444',      
  border: '#2A2B37',       
  shadow: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const rounded = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  metricXl: {
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
