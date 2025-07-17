import React from 'react';

interface UnifiedExportPanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Unified Export Panel
 * Provides consistent export panel styling across both Slideshow Creator and Video Editor
 * Wraps the specific export components with unified visual structure
 */
export const UnifiedExportPanel: React.FC<UnifiedExportPanelProps> = ({
  children,
  className = ''
}) => {
  
  return (
    <div
      className={`flex flex-col min-h-0 overflow-auto ${className}`}
      style={{
        width: '400px', // Optimized width for better content space
        backgroundColor: '#0a0a0b', // Consistent dark background
        paddingTop: '16px', // Increased top padding
        paddingLeft: '8px', // Standard left padding
        paddingRight: '16px', // Increased right padding
        paddingBottom: '8px', // Standard bottom padding
      }}
    >
      {children}
    </div>
  );
};

export default UnifiedExportPanel;
