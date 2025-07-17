import React from 'react';

interface UnifiedUploadEmptyStateProps {
  mode: 'slideshow' | 'video-editor';
  className?: string;
}

/**
 * Unified Upload Empty State Component
 * Provides consistent empty state styling for upload panels across both applications
 * Only content text differs between modes, all visual styling is identical
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
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
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

export default UnifiedUploadEmptyState;
