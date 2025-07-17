import React from 'react';
import styles from './BaseEmptyState.module.css';

export interface BaseEmptyStateProps {
  // Content props
  title: string;
  subtitle: string;

  // Visual props
  icon: React.ReactNode;
  titleColor?: 'slideshow' | 'video-editor' | 'neutral' | string;

  // Layout props
  className?: string;

  // Mode for potential future theming
  mode?: 'slideshow' | 'video-editor';
}

/**
 * Base Empty State Component
 *
 * Reusable foundation for all empty state components across AnimaGen.
 * Encapsulates shared layout and styling while allowing customization
 * through props for icon, title, subtitle, and colors.
 *
 * Now uses CSS modules for better maintainability and theming consistency.
 *
 * This component eliminates code duplication between:
 * - UnifiedEmptyState
 * - UnifiedPreviewEmptyState
 * - UnifiedTimelineEmptyState
 * - UnifiedUploadEmptyState
 */
export const BaseEmptyState: React.FC<BaseEmptyStateProps> = ({
  title,
  subtitle,
  icon,
  titleColor = 'neutral',
  className = ''
}) => {
  // Determine title color class
  const getTitleColorClass = () => {
    switch (titleColor) {
      case 'slideshow':
        return styles.titleSlideshow;
      case 'video-editor':
        return styles.titleVideoEditor;
      case 'neutral':
        return styles.titleNeutral;
      default:
        // If a custom color string is provided, use inline style
        return '';
    }
  };

  const titleColorClass = getTitleColorClass();
  const customTitleStyle = typeof titleColor === 'string' &&
    !['slideshow', 'video-editor', 'neutral'].includes(titleColor)
    ? { color: titleColor }
    : {};

  return (
    <div className={`${styles.container} ${styles.fadeIn} ${className}`}>
      <div className={`${styles.panel} panel`}>
        {/* Icon */}
        <div className={styles.iconContainer}>
          {icon}
        </div>

        {/* Text Content */}
        <div className={styles.textContent}>
          <div
            className={`${styles.title} ${titleColorClass}`}
            style={customTitleStyle}
          >
            {title}
          </div>
          <div className={styles.subtitle}>
            {subtitle}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaseEmptyState;
