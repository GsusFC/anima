/**
 * Style Utilities
 * 
 * Helper functions for working with CSS modules and dynamic styling.
 */

/**
 * Combines multiple CSS class names, filtering out falsy values
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Combines CSS module classes with additional classes
 */
export const combineClasses = (
  moduleClasses: Record<string, string>,
  classNames: (string | undefined | null | false)[]
): string => {
  const resolvedModuleClasses = classNames
    .filter(Boolean)
    .map(className => moduleClasses[className as string] || className)
    .filter(Boolean);
  
  return resolvedModuleClasses.join(' ');
};

/**
 * Creates a class name builder for a specific CSS module
 */
export const createClassBuilder = (moduleClasses: Record<string, string>) => {
  return (...classNames: (string | undefined | null | false)[]): string => {
    return combineClasses(moduleClasses, classNames);
  };
};

/**
 * Mode-specific class name helper
 */
export const getModeClass = (
  mode: 'slideshow' | 'video-editor',
  baseClass: string,
  moduleClasses: Record<string, string>
): string => {
  const modeClass = mode === 'slideshow' ? 'Primary' : 'Secondary';
  const fullClassName = `${baseClass}${modeClass}`;
  return moduleClasses[fullClassName] || moduleClasses[baseClass] || '';
};

/**
 * Conditional class name helper
 */
export const conditionalClass = (
  condition: boolean,
  trueClass: string,
  falseClass?: string,
  moduleClasses?: Record<string, string>
): string => {
  const selectedClass = condition ? trueClass : (falseClass || '');
  if (moduleClasses && selectedClass) {
    return moduleClasses[selectedClass] || selectedClass;
  }
  return selectedClass;
};

/**
 * Size class helper
 */
export const getSizeClass = (
  size: 'small' | 'medium' | 'large' | 'xlarge',
  baseClass: string,
  moduleClasses: Record<string, string>
): string => {
  const sizeMap = {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    xlarge: 'XLarge'
  };
  
  const fullClassName = `${baseClass}${sizeMap[size]}`;
  return moduleClasses[fullClassName] || moduleClasses[baseClass] || '';
};

/**
 * Variant class helper
 */
export const getVariantClass = (
  variant: string,
  baseClass: string,
  moduleClasses: Record<string, string>
): string => {
  const capitalizedVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
  const fullClassName = `${baseClass}${capitalizedVariant}`;
  return moduleClasses[fullClassName] || moduleClasses[baseClass] || '';
};

/**
 * State class helper
 */
export const getStateClasses = (
  states: {
    disabled?: boolean;
    loading?: boolean;
    selected?: boolean;
    active?: boolean;
    hover?: boolean;
  },
  baseClass: string,
  moduleClasses: Record<string, string>
): string[] => {
  const stateClasses: string[] = [];
  
  Object.entries(states).forEach(([state, isActive]) => {
    if (isActive) {
      const stateClassName = `${baseClass}${state.charAt(0).toUpperCase() + state.slice(1)}`;
      const resolvedClass = moduleClasses[stateClassName] || moduleClasses[state];
      if (resolvedClass) {
        stateClasses.push(resolvedClass);
      }
    }
  });
  
  return stateClasses;
};

/**
 * Responsive class helper
 */
export const getResponsiveClasses = (
  breakpoints: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  },
  moduleClasses: Record<string, string>
): string[] => {
  const responsiveClasses: string[] = [];
  
  Object.entries(breakpoints).forEach(([breakpoint, className]) => {
    if (className) {
      const responsiveClassName = `${className}${breakpoint.toUpperCase()}`;
      const resolvedClass = moduleClasses[responsiveClassName] || className;
      if (resolvedClass) {
        responsiveClasses.push(resolvedClass);
      }
    }
  });
  
  return responsiveClasses;
};

/**
 * Animation class helper
 */
export const getAnimationClass = (
  animation: 'enter' | 'exit' | 'pulse' | 'bounce' | 'spin',
  baseClass: string,
  moduleClasses: Record<string, string>
): string => {
  const animationClassName = `${baseClass}${animation.charAt(0).toUpperCase() + animation.slice(1)}`;
  return moduleClasses[animationClassName] || '';
};

/**
 * Theme class helper
 */
export const getThemeClasses = (
  theme: 'light' | 'dark',
  baseClass: string,
  moduleClasses: Record<string, string>
): string => {
  const themeClassName = `${baseClass}${theme.charAt(0).toUpperCase() + theme.slice(1)}`;
  return moduleClasses[themeClassName] || moduleClasses[baseClass] || '';
};

/**
 * CSS custom properties helper
 */
export const createCSSProperties = (
  properties: Record<string, string | number>
): React.CSSProperties => {
  const cssProperties: React.CSSProperties = {};
  
  Object.entries(properties).forEach(([key, value]) => {
    const cssKey = key.startsWith('--') ? key : `--${key}`;
    (cssProperties as any)[cssKey] = value;
  });
  
  return cssProperties;
};

/**
 * Color utility functions
 */
export const colorUtils = {
  /**
   * Get mode-specific color
   */
  getModeColor: (mode: 'slideshow' | 'video-editor'): string => {
    return mode === 'slideshow' ? '#ec4899' : '#3b82f6';
  },
  
  /**
   * Get color with opacity
   */
  withOpacity: (color: string, opacity: number): string => {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  },
  
  /**
   * Get semantic colors
   */
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    neutral: '#6b7280'
  }
};
