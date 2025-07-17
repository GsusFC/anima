import React from 'react';
import BaseEmptyState from '../base/BaseEmptyState';

interface UnifiedUploadEmptyStateProps {
  mode: 'slideshow' | 'video-editor';
  className?: string;
}

/**
 * Unified Upload Empty State Component
 * Provides consistent empty state styling for upload panels across both applications
 * Now uses BaseEmptyState for consistent structure and CSS modules for styling
 */
export const UnifiedUploadEmptyState: React.FC<UnifiedUploadEmptyStateProps> = ({
  mode,
  className = ''
}) => {
  // Mode-specific content
  const getContent = () => {
    if (mode === 'slideshow') {
      return {
        title: 'No media files',
        subtitle: 'Upload some files to get started'
      };
    } else {
      return {
        title: 'No Video Loaded',
        subtitle: 'Upload a video to get started'
      };
    }
  };

  const content = getContent();

  // Upload/Cloud icon
  const uploadIcon = (
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
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );

  return (
    <BaseEmptyState
      title={content.title}
      subtitle={content.subtitle}
      icon={uploadIcon}
      titleColor="neutral" // Consistent neutral title color for upload
      className={className}
      mode={mode}
    />
  );
};

export default UnifiedUploadEmptyState;
