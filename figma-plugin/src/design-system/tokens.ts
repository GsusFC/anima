// Figma Design System Tokens

export const colors = {
  // Backgrounds
  bg: {
    primary: '#2C2C2C',
    secondary: '#3C3C3C', 
    tertiary: '#4C4C4C',
    surface: '#383838',
    overlay: 'rgba(0, 0, 0, 0.8)'
  },
  
  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3',
    tertiary: '#8C8C8C',
    disabled: '#666666'
  },
  
  // Interactive
  interactive: {
    primary: '#18A0FB',
    primaryHover: '#0D8BD9',
    primaryPressed: '#0969B2',
    secondary: '#5C5C5C',
    secondaryHover: '#6C6C6C'
  },
  
  // Status
  status: {
    success: '#14AE5C',
    successHover: '#0F9A51',
    error: '#F24822',
    errorHover: '#E73C1F',
    warning: '#FFCB47',
    warningHover: '#F5C442'
  },
  
  // Borders
  border: {
    primary: '#4C4C4C',
    secondary: '#5C5C5C',
    focus: '#18A0FB',
    error: '#F24822'
  },
  
  // Accent colors (for UI elements like sliders, toggles, etc.)
  accent: {
    primary: '#18A0FB',
    secondary: '#14AE5C',
    tertiary: '#FFCB47'
  }
};

export const typography = {
  fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
  
  fontSize: {
    xs: '10px',
    sm: '11px', 
    base: '12px',
    md: '13px',
    lg: '14px',
    xl: '16px'
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6
  }
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px'
};

export const borderRadius = {
  sm: '2px',
  base: '4px', 
  md: '6px',
  lg: '8px'
};

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
  base: '0 2px 4px rgba(0, 0, 0, 0.1)',
  md: '0 4px 8px rgba(0, 0, 0, 0.15)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.2)'
};

// Component-specific styles
export const components = {
  button: {
    height: {
      sm: '24px',
      base: '32px',
      lg: '40px'
    },
    padding: {
      sm: '0 8px',
      base: '0 12px', 
      lg: '0 16px'
    }
  },
  
  input: {
    height: '32px',
    padding: '0 8px'
  },
  
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.md
  }
};
