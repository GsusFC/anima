/**
 * Shared Styles Index
 * 
 * Centralized export for all CSS modules used across AnimaGen.
 * Provides easy access to consistent styling throughout the application.
 */

// CSS Modules
export { default as timelineStyles } from './timeline.module.css';
export { default as panelStyles } from './panels.module.css';
export { default as buttonStyles } from './buttons.module.css';

// Style utilities and helpers
export * from './utils';

// Re-export for convenience
export const styles = {
  timeline: require('./timeline.module.css'),
  panels: require('./panels.module.css'),
  buttons: require('./buttons.module.css'),
} as const;
