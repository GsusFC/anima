import React from 'react';

interface UnifiedPreviewPanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Unified Preview Panel
 * Provides consistent preview panel styling across both Slideshow Creator and Video Editor
 * Wraps the specific preview components with unified visual structure
 */
export const UnifiedPreviewPanel: React.FC<UnifiedPreviewPanelProps> = ({
  children,
  className = ''
}) => {
  
  return (
    <div
      className={`flex-1 flex flex-col min-h-0 ${className}`}
      style={{
        backgroundColor: '#0a0a0b', // Consistent dark background
        paddingTop: '16px', // Increased top padding
        paddingLeft: '8px', // Standard left padding
        paddingRight: '8px', // Standard right padding
        paddingBottom: '8px', // Standard bottom padding
      }}
    >
      {children}
    </div>
  );
};

export default UnifiedPreviewPanel;
