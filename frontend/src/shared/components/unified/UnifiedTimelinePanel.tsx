import React from 'react';

interface UnifiedTimelinePanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Unified Timeline Panel
 * Provides consistent timeline panel styling across both Slideshow Creator and Video Editor
 * Wraps the specific timeline components with unified visual structure
 */
export const UnifiedTimelinePanel: React.FC<UnifiedTimelinePanelProps> = ({
  children,
  className = ''
}) => {
  
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{
        height: '280px', // Optimized height for better timeline controls
        backgroundColor: '#0a0a0b', // Consistent dark background
        paddingTop: '8px', // Standard top padding
        paddingLeft: '16px', // Increased left padding (matching upload panel)
        paddingRight: '16px', // Increased right padding (matching export panel)
        paddingBottom: '16px', // Increased bottom padding
      }}
    >
      {children}
    </div>
  );
};

export default UnifiedTimelinePanel;
