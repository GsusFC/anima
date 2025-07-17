import React from 'react';

interface UnifiedTimelineEmptyStateProps {
  mode: 'slideshow' | 'video-editor';
  className?: string;
}

/**
 * Unified Timeline Empty State Component
 * Provides consistent empty state styling for timeline panels across both applications
 * Only content text differs between modes, all visual styling is identical
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

  return (
    <div
      className={`h-full flex flex-col ${className}`}
      style={{
        backgroundColor: '#0a0a0b' // Consistent background
      }}
    >
      <div 
        className="panel flex-1 flex items-center justify-center flex-col"
        style={{ gap: '12px' }}
      >
        {/* Unified Icon */}
        <svg 
          className="w-12 h-12" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: '#6a6a6d' }} // Consistent icon color
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>

        {/* Unified Text Content */}
        <div 
          className="text-center"
          style={{
            fontFamily: '"Space Mono", monospace',
            color: '#9ca3af'
          }}
        >
          <div 
            style={{
              fontSize: '18px', // Consistent title size
              fontWeight: 'bold',
              marginBottom: '4px',
              color: '#9ca3af' // Consistent title color
            }}
          >
            {content.title}
          </div>
          <div 
            style={{
              fontSize: '14px', // Consistent subtitle size
              color: '#6b7280' // Consistent subtitle color
            }}
          >
            {content.subtitle}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedTimelineEmptyState;
