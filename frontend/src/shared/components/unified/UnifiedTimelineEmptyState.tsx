import React from 'react';
import BaseEmptyState from '../base/BaseEmptyState';

interface UnifiedTimelineEmptyStateProps {
  mode: 'slideshow' | 'video-editor';
  className?: string;
}

/**
 * Unified Timeline Empty State Component
 * Provides consistent empty state styling for timeline panels across both applications
 * Now uses BaseEmptyState for consistent structure and CSS modules for styling
 */
export const UnifiedTimelineEmptyState: React.FC<UnifiedTimelineEmptyStateProps> = ({
  mode,
  className = ''
}) => {
  // Mode-specific content
  const getContent = () => {
    if (mode === 'slideshow') {
      return {
        title: 'No images in timeline',
        subtitle: 'Drag images here to create your slideshow'
      };
    } else {
      return {
        title: 'No Video Loaded',
        subtitle: 'Timeline will appear here'
      };
    }
  };

  const content = getContent();

  // Clock/Timeline icon
  const timelineIcon = (
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
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  return (
    <BaseEmptyState
      title={content.title}
      subtitle={content.subtitle}
      icon={timelineIcon}
      titleColor="neutral" // Consistent neutral title color for timeline
      className={className}
      mode={mode}
    />
  );
};

export default UnifiedTimelineEmptyState;
