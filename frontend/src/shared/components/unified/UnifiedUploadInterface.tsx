import React from 'react';
import { DropZone } from '../Media/DropZone';
import { UploadConfig, MediaEventHandlers, MediaTheme } from '../../types/media.types';
import { defaultMediaTheme, slideshowTheme, videoEditorTheme, mergeThemes } from '../../theme/mediaTheme';

interface UnifiedUploadInterfaceProps {
  mode: 'slideshow' | 'video-editor';
  config: UploadConfig;
  handlers: MediaEventHandlers;
  loading?: boolean;
  children?: React.ReactNode; // For content area (MediaList or Video Info)
  className?: string;
}

/**
 * Unified Upload Interface Component
 * Provides consistent upload structure across both applications:
 * - Always visible DropZone at the top
 * - Content area below (MediaList for slideshow, Video Info for video editor)
 * - Consistent styling and behavior
 */
export const UnifiedUploadInterface: React.FC<UnifiedUploadInterfaceProps> = ({
  mode,
  config,
  handlers,
  loading = false,
  children,
  className = ''
}) => {
  // Get theme for current mode
  const getThemeForMode = (): MediaTheme => {
    const baseTheme = mode === 'slideshow'
      ? mergeThemes(defaultMediaTheme, slideshowTheme)
      : mergeThemes(defaultMediaTheme, videoEditorTheme);
    return baseTheme;
  };

  const theme = getThemeForMode();

  // Mode-specific DropZone styling
  const getDropZoneStyle = () => {
    const baseStyle = {
      borderColor: theme.colors.primary, // Use brand colors by default
      backgroundColor: 'transparent',
      color: theme.colors.primary, // Text also uses brand colors
    };

    if (mode === 'slideshow') {
      return {
        ...baseStyle,
        minHeight: '60px',
      };
    } else {
      return {
        ...baseStyle,
        minHeight: '80px', // Slightly taller for video upload
        backgroundColor: loading ? '#1a1a1b' : 'transparent',
      };
    }
  };

  // Mode-specific DropZone configuration
  const getDropZoneConfig = () => {
    if (mode === 'slideshow') {
      return {
        ...config,
        text: {
          primary: 'Drop images here or click to browse',
          secondary: 'Supports JPG, PNG, GIF, WebP',
        },
      };
    } else {
      return {
        ...config,
        text: {
          primary: 'Drop video here or click to browse',
          secondary: 'Supports MP4, WebM, MOV, AVI',
        },
      };
    }
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Always Visible DropZone */}
      <div className="flex-shrink-0" style={{ marginBottom: '8px' }}>
        <DropZone
          config={getDropZoneConfig()}
          handlers={handlers}
          loading={loading}
          className="h-auto"
          style={getDropZoneStyle()}
          theme={theme}
          mode={mode}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
};

export default UnifiedUploadInterface;
