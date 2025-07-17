import React from 'react';

interface UnifiedEmptyStateProps {
  mode: 'slideshow' | 'video-editor';
  className?: string;
}

/**
 * Unified Empty State Component
 * Provides consistent empty state styling across both Slideshow Creator and Video Editor
 * Only color theming differs between modes
 */
export const UnifiedEmptyState: React.FC<UnifiedEmptyStateProps> = ({
  mode,
  className = ''
}) => {
  // Mode-specific colors
  const primaryColor = mode === 'slideshow' ? '#ec4899' : '#3b82f6';
  
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

  return (
    <div
      className={`h-full flex flex-col ${className}`}
      style={{
        backgroundColor: '#0a0a0b' // Consistent dark background
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
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
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
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '4px',
              color: primaryColor // Mode-specific title color
            }}
          >
            {content.title}
          </div>
          <div 
            style={{
              fontSize: '14px',
              color: '#6b7280'
            }}
          >
            {content.subtitle}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedEmptyState;
