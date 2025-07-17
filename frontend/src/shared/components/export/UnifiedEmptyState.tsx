import React from 'react';
import BaseEmptyState from '../base/BaseEmptyState';

interface UnifiedEmptyStateProps {
  mode: 'slideshow' | 'video-editor';
  className?: string;
}

/**
 * Unified Empty State Component
 * Provides consistent empty state styling across both Slideshow Creator and Video Editor
 * Now uses BaseEmptyState for consistent structure and reduced code duplication
 */
export const UnifiedEmptyState: React.FC<UnifiedEmptyStateProps> = ({
  mode,
  className = ''
}) => {
  // Mode-specific content
  const getContent = () => {
    if (mode === 'slideshow') {
      return {
        title: 'No Export Available',
        subtitle: 'Add images to timeline to enable export'
      };
    } else {
      return {
        title: 'No Video Loaded',
        subtitle: 'Export options will appear here'
      };
    }
  };

  const content = getContent();

  // Download/Export icon
  const exportIcon = (
    <svg
      className="w-12 h-12"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  return (
    <BaseEmptyState
      title={content.title}
      subtitle={content.subtitle}
      icon={exportIcon}
      titleColor={mode} // Use mode directly for color theming
      className={className}
      mode={mode}
    />
  );
};

export default UnifiedEmptyState;
