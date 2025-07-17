import React from 'react';

// Unified types for both slideshow and video editor
export type ExportFormat = 'gif' | 'mp4' | 'webm' | 'mov';

export interface UnifiedFormatSelectorProps {
  currentFormat: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  supportedFormats?: ExportFormat[];
  mode?: 'slideshow' | 'video-editor';
  className?: string;
}

/**
 * Unified Format Selector Component
 * 
 * Used by both Slideshow Creator and Video Editor with consistent styling
 * but mode-specific theming and behavior.
 */
const UnifiedFormatSelector: React.FC<UnifiedFormatSelectorProps> = ({
  currentFormat,
  onFormatChange,
  supportedFormats = ['gif', 'mp4', 'webm', 'mov'],
  mode = 'slideshow',
  className = ''
}) => {
  // Mode-specific colors - DRAMATIC DIFFERENCES
  const primaryColor = mode === 'slideshow' ? '#ff1493' : '#00bfff';  // Hot Pink vs Deep Sky Blue
  const primaryDark = mode === 'slideshow' ? '#dc143c' : '#0080ff';   // Crimson vs Blue
  const primaryGlow = mode === 'slideshow'
    ? '0 0 25px rgba(255, 20, 147, 0.6)'
    : '0 0 25px rgba(0, 191, 255, 0.6)';


  return (
    <div className={`mb-4 ${className}`}>
      <h3
        style={{
          color: '#9ca3af',
          fontFamily: '"Space Mono", monospace',
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '0 0 12px 0',
        }}
      >
        📁 Export Format
      </h3>

      <div
        style={{
          display: 'flex',
          gap: '8px', // Consistent gap for both modes
          flexWrap: 'nowrap', // Consistent layout for both modes
        }}
      >
        {supportedFormats.map((format) => {
          const isActive = currentFormat === format;
          const [isHovered, setIsHovered] = React.useState(false);

          const buttonStyle: React.CSSProperties = {
            flex: 1, // Consistent flex behavior for both modes
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: '"Space Mono", monospace',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: '1px solid',
            cursor: 'pointer',
            transition: 'all 200ms ease',
            backgroundColor: isActive ? primaryColor : '#2d2d30',
            borderColor: isActive ? primaryDark : '#5a5a5d',
            color: isActive ? 'white' : (isHovered ? '#e5e7eb' : '#9ca3af'),
            boxShadow: isActive ? primaryGlow : 'none',
          };

          if (!isActive && isHovered) {
            buttonStyle.backgroundColor = '#3a3a3d';
            buttonStyle.borderColor = '#6a6a6d';
          }

          return (
            <button
              key={format}
              onClick={() => onFormatChange(format)}
              style={buttonStyle}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {format}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default UnifiedFormatSelector;
