import React from 'react';

interface UnifiedUploadPanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Unified Upload Panel
 * Provides consistent upload panel styling across both Slideshow Creator and Video Editor
 * Wraps the specific upload components with unified visual structure
 */
export const UnifiedUploadPanel: React.FC<UnifiedUploadPanelProps> = ({
  children,
  className = ''
}) => {
  
  return (
    <div
      className={`flex flex-col min-h-0 ${className}`}
      style={{
        width: '400px', // Optimized width for better content space
        backgroundColor: '#0a0a0b', // Consistent dark background
        paddingTop: '16px', // Increased top padding
        paddingLeft: '16px', // Increased left padding
        paddingRight: '8px', // Standard right padding
        paddingBottom: '8px', // Standard bottom padding
      }}
    >
      {children}
    </div>
  );
};

export default UnifiedUploadPanel;
