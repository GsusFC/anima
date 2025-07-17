import React from 'react';

interface UnifiedPreviewEmptyStateProps {
  mode: 'slideshow' | 'video-editor';
  className?: string;
}

/**
 * Unified Preview Empty State Component
 * Provides consistent empty state styling for preview panels across both applications
 * Only content text differs between modes, all visual styling is identical
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
            d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2" 
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

export default UnifiedPreviewEmptyState;
