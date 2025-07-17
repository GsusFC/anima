import React from 'react';

// Unified quality types
export type QualityLevel = 'web' | 'standard' | 'high' | 'ultra' | 'max' | 'low' | 'medium';

export interface QualityOption {
  value: QualityLevel;
  label: string;
  description?: string;
}

export interface UnifiedQualitySelectorProps {
  currentQuality: QualityLevel;
  onQualityChange: (quality: QualityLevel) => void;
  availableQualities?: QualityOption[];
  mode?: 'slideshow' | 'video-editor';
  className?: string;
}

/**
 * Unified Quality Selector Component
 * 
 * Handles quality selection for both slideshow and video export
 * with consistent behavior but mode-specific styling.
 */
const UnifiedQualitySelector: React.FC<UnifiedQualitySelectorProps> = ({
  currentQuality,
  onQualityChange,
  availableQualities,
  mode = 'slideshow',
  className = ''
}) => {
  // Default quality options based on mode
  const getDefaultQualities = (): QualityOption[] => {
    if (mode === 'slideshow') {
      return [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'ultra', label: 'Ultra' }
      ];
    } else {
      return [
        { value: 'web', label: 'Web' },
        { value: 'standard', label: 'Standard' },
        { value: 'high', label: 'High' },
        { value: 'max', label: 'Maximum' }
      ];
    }
  };

  const qualities = availableQualities || getDefaultQualities();

  // Mode-specific colors
  const primaryColor = mode === 'slideshow' ? '#ec4899' : '#3b82f6';
  const primaryDark = mode === 'slideshow' ? '#db2777' : '#2563eb';
  const primaryGlow = mode === 'slideshow'
    ? '0 0 20px rgba(236, 72, 153, 0.3)'
    : '0 0 20px rgba(59, 130, 246, 0.3)';

  return (
    <div className={`mb-3 ${className}`}>
      <h4
        style={{
          color: '#9ca3af',
          fontFamily: '"Space Mono", monospace',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '0 0 8px 0',
        }}
      >
        Quality
      </h4>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px', // Consistent with FormatSelector
        }}
      >
        {qualities.map((quality) => {
          const isActive = currentQuality === quality.value;
          const [isHovered, setIsHovered] = React.useState(false);

          const buttonStyle: React.CSSProperties = {
            padding: '6px 12px', // Consistent padding for both modes
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: '"Space Mono", monospace',
            fontWeight: 'bold',
            border: '1px solid',
            cursor: 'pointer',
            transition: 'all 200ms ease',
            backgroundColor: isActive ? primaryColor : '#2d2d30',
            borderColor: isActive ? primaryDark : '#5a5a5d',
            color: isActive ? 'white' : (isHovered ? '#d1d5db' : '#9ca3af'),
            boxShadow: isActive ? primaryGlow : 'none',
          };

          if (!isActive && isHovered) {
            buttonStyle.backgroundColor = '#3a3a3d';
            buttonStyle.borderColor = '#6a6a6d';
          }

          return (
            <button
              key={quality.value}
              onClick={() => onQualityChange(quality.value)}
              style={buttonStyle}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              title={quality.description}
            >
              {quality.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default UnifiedQualitySelector;
