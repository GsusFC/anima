import { MediaTheme } from '../types/media.types';

// Default theme for media components
// Consistent with AnimaGen's design system
export const defaultMediaTheme: MediaTheme = {
  colors: {
    primary: '#ff4500',        // AnimaGen orange
    secondary: '#22c55e',      // Green accent
    accent: '#ec4899',         // Pink accent
    background: '#0f0f0f',     // Dark background
    surface: '#1a1a1b',       // Card/surface background
    border: '#343536',        // Border color
    text: '#f3f4f6',          // Primary text
    textSecondary: '#9ca3af',  // Secondary text
    success: '#22c55e',       // Success green
    warning: '#f59e0b',       // Warning amber
    error: '#ef4444',         // Error red
  },
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
  },
  borderRadius: {
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  transitions: {
    fast: 'all 0.15s ease',
    normal: 'all 0.2s ease',
    slow: 'all 0.3s ease',
  },
};

// Theme variants for different contexts
export const slideshowTheme: Partial<MediaTheme> = {
  colors: {
    ...defaultMediaTheme.colors,
    accent: '#ec4899', // Pink accent for slideshow
  },
};

export const videoEditorTheme: Partial<MediaTheme> = {
  colors: {
    ...defaultMediaTheme.colors,
    accent: '#22c55e', // Green accent for video editor
  },
};

// Size configurations
export const mediaSizes = {
  small: {
    thumbnail: { width: 48, height: 48 },
    item: { height: 60 },
    padding: defaultMediaTheme.spacing.sm,
  },
  medium: {
    thumbnail: { width: 80, height: 80 },
    item: { height: 96 },
    padding: defaultMediaTheme.spacing.md,
  },
  large: {
    thumbnail: { width: 120, height: 120 },
    item: { height: 144 },
    padding: defaultMediaTheme.spacing.lg,
  },
};

// Layout configurations
export const mediaLayouts = {
  list: {
    direction: 'column' as const,
    gap: defaultMediaTheme.spacing.sm,
    itemWidth: '100%',
  },
  grid: {
    direction: 'row' as const,
    gap: defaultMediaTheme.spacing.md,
    itemWidth: 'auto',
    columns: 'auto-fill',
    minItemWidth: '200px',
  },
  timeline: {
    direction: 'row' as const,
    gap: defaultMediaTheme.spacing.lg,
    itemWidth: '200px',
    overflow: 'auto',
  },
};

// Animation configurations
export const mediaAnimations = {
  hover: {
    scale: 1.02,
    transition: defaultMediaTheme.transitions.fast,
  },
  drag: {
    scale: 1.05,
    opacity: 0.8,
    transition: defaultMediaTheme.transitions.fast,
  },
  drop: {
    scale: 1.1,
    transition: defaultMediaTheme.transitions.normal,
  },
  loading: {
    pulse: {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
  },
};

// Utility functions for theme
export const getThemeValue = (
  theme: Partial<MediaTheme>,
  path: string,
  fallback?: any
): any => {
  const keys = path.split('.');
  let value: any = { ...defaultMediaTheme, ...theme };
  
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) break;
  }
  
  return value !== undefined ? value : fallback;
};

export const mergeThemes = (
  base: MediaTheme,
  override: Partial<MediaTheme>
): MediaTheme => {
  return {
    colors: { ...base.colors, ...override.colors },
    spacing: { ...base.spacing, ...override.spacing },
    borderRadius: { ...base.borderRadius, ...override.borderRadius },
    shadows: { ...base.shadows, ...override.shadows },
    transitions: { ...base.transitions, ...override.transitions },
  };
};

// CSS-in-JS style generators
export const createMediaStyles = (theme: MediaTheme) => ({
  container: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    fontFamily: '"Space Mono", monospace',
  },
  
  item: {
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    transition: theme.transitions.normal,
    cursor: 'pointer',
    
    '&:hover': {
      borderColor: theme.colors.primary,
      transform: 'scale(1.02)',
    },
    
    '&.selected': {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}15`,
    },
    
    '&.dragging': {
      opacity: 0.8,
      transform: 'scale(1.05)',
      zIndex: 1000,
    },
  },
  
  thumbnail: {
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    
    '& img': {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
    },
  },
  
  metadata: {
    fontSize: '0.75rem',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  
  actions: {
    display: 'flex',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  
  button: {
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderRadius: theme.borderRadius.sm,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    transition: theme.transitions.fast,
    
    '&.primary': {
      backgroundColor: theme.colors.primary,
      color: 'white',
      
      '&:hover': {
        backgroundColor: `${theme.colors.primary}dd`,
      },
    },
    
    '&.secondary': {
      backgroundColor: 'transparent',
      color: theme.colors.textSecondary,
      border: `1px solid ${theme.colors.border}`,
      
      '&:hover': {
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
      },
    },
  },
  
  dropZone: {
    border: `2px dashed ${theme.colors.border}`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    textAlign: 'center' as const,
    color: theme.colors.textSecondary,
    transition: theme.transitions.normal,
    
    '&.active': {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}10`,
      color: theme.colors.primary,
    },
  },
  
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    color: theme.colors.textSecondary,
  },
  
  error: {
    color: theme.colors.error,
    backgroundColor: `${theme.colors.error}15`,
    border: `1px solid ${theme.colors.error}`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: '0.875rem',
  },
});

export default defaultMediaTheme;
