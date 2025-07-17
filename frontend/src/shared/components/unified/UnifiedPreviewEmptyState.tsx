import React from 'react';
import BaseEmptyState from '../base/BaseEmptyState';

interface UnifiedPreviewEmptyStateProps {
  mode: 'slideshow' | 'video-editor';
  className?: string;
}

/**
 * Unified Preview Empty State Component
 * Provides consistent empty state styling for preview panels across both applications
 * Now uses BaseEmptyState for consistent structure and reduced code duplication
 */
export const UnifiedPreviewEmptyState: React.FC<UnifiedPreviewEmptyStateProps> = ({
  mode,
  className = ''
}) => {
  // Mode-specific content
  const getContent = () => {
    if (mode === 'slideshow') {
      return {
        title: 'No Preview Available',
        subtitle: 'Add images to timeline to generate preview'
      };
    } else {
      return {
        title: 'No Video Loaded',
        subtitle: 'Upload a video to see preview'
      };
    }
  };

  const content = getContent();

  // Clipboard/Preview icon
  const previewIcon = (
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
        d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2"
      />
    </svg>
  );

  return (
    <BaseEmptyState
      title={content.title}
      subtitle={content.subtitle}
      icon={previewIcon}
      titleColor="neutral" // Consistent neutral title color for preview
      className={className}
      mode={mode}
    />
  );
};

export default UnifiedPreviewEmptyState;
