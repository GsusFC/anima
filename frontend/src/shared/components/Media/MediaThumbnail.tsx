import React, { useState, useCallback } from 'react';
import { MediaItem } from '../../types/media.types';
import { defaultMediaTheme, mediaSizes } from '../../theme/mediaTheme';

interface MediaThumbnailProps {
  item: MediaItem;
  size?: 'small' | 'medium' | 'large';
  showDuration?: boolean;
  showType?: boolean;
  loading?: boolean;
  error?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (item: MediaItem) => void;
  onLoad?: () => void;
  onError?: () => void;
}

export const MediaThumbnail: React.FC<MediaThumbnailProps> = ({
  item,
  size = 'medium',

  showType = false,
  loading = false,
  error = false,
  className = '',
  style = {},
  onClick,
  onLoad,
  onError,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const sizeConfig = mediaSizes[size];
  const theme = defaultMediaTheme;

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    setImageError(true);
    onError?.();
  }, [onError]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (onClick && !loading && !error) {
      onClick(item);
    }
  }, [onClick, item, loading, error]);



  const containerStyle: React.CSSProperties = {
    position: 'relative',
    // Use style props if provided (for full width), otherwise use size config
    width: style?.width || sizeConfig.thumbnail.width,
    height: style?.height || sizeConfig.thumbnail.height,
    minHeight: style?.minHeight,
    maxHeight: style?.maxHeight,
    aspectRatio: style?.aspectRatio,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    cursor: onClick ? 'pointer' : 'default',
    transition: theme.transitions.normal,
    border: `1px solid ${theme.colors.border}`,
    ...style, // Apply all style props
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: theme.transitions.normal,
    opacity: imageLoaded ? 1 : 0,
  };



  const loadingStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    color: theme.colors.textSecondary,
    fontSize: '0.75rem',
  };

  const errorStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    color: theme.colors.error,
    fontSize: '0.75rem',
    textAlign: 'center',
    padding: theme.spacing.xs,
  };

  const typeIconStyle: React.CSSProperties = {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    width: '16px',
    height: '16px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: theme.borderRadius.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '0.625rem',
  };

  return (
    <div
      className={`media-thumbnail ${className}`}
      style={containerStyle}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = theme.colors.primary;
          e.currentTarget.style.transform = 'scale(1.02)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = theme.colors.border;
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}

    >
      {/* Main Image/Video Thumbnail */}
      {item.preview && !imageError && (
        <img
          src={item.preview}
          alt={item.name}
          style={imageStyle}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {/* Loading State */}
      {(loading || (!imageLoaded && !imageError)) && (
        <div style={loadingStyle}>
          <div
            style={{
              width: '20px',
              height: '20px',
              border: `2px solid ${theme.colors.border}`,
              borderTop: `2px solid ${theme.colors.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      )}

      {/* Error State */}
      {(error || imageError) && (
        <div style={errorStyle}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span style={{ marginTop: theme.spacing.xs, fontSize: '0.625rem' }}>
            Error
          </span>
        </div>
      )}

      {/* Type Icon */}
      {showType && (
        <div style={typeIconStyle}>
          {item.type === 'video' ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
          )}
        </div>
      )}



      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MediaThumbnail;
