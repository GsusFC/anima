import React, { useState, useCallback, useMemo } from 'react';
import { MediaItem as MediaItemType, MediaItemConfig, MediaEventHandlers } from '../../types/media.types';
import { defaultMediaTheme, mediaSizes } from '../../theme/mediaTheme';
import MediaThumbnail from './MediaThumbnail';

interface MediaItemProps {
  item: MediaItemType;
  config?: MediaItemConfig;
  handlers?: MediaEventHandlers;
  selected?: boolean;
  dragging?: boolean;
  draggedOver?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MediaItem: React.FC<MediaItemProps> = ({
  item,
  config = {},
  handlers = {},
  selected = false,
  dragging = false,
  draggedOver = false,
  className = '',
  style = {},
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    showMetadata = false, // Default to false for cleaner look
    showSelection = false,
    size = 'medium',
    layout = 'list',
    interactive = true,
  } = config;

  const {
    onSelect,
    onDeselect,
    onRemove,
    onAdd,
    onPreview,
  
  } = handlers;

  const theme = defaultMediaTheme;
  const sizeConfig = mediaSizes[size];

  const handleClick = useCallback(() => {
    if (!interactive) return;

    // If onAdd is available, prioritize adding to timeline over selection
    if (onAdd) {
      onAdd(item);
      return;
    }

    if (selected && onDeselect) {
      onDeselect(item);
    } else if (!selected && onSelect) {
      onSelect(item);
    }
  }, [item, selected, onSelect, onDeselect, onAdd, interactive]);



  const handleRemoveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(item);
  }, [item, onRemove]);



  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const containerStyle: React.CSSProperties = useMemo(() => ({
    display: 'flex',
    flexDirection: layout === 'list' ? 'column' : 'column', // Always column for thumbnail-focused layout
    alignItems: 'stretch', // Stretch to fill width
    gap: theme.spacing.sm, // Reduced gap for tighter layout
    padding: sizeConfig.padding,
    backgroundColor: selected ? `${theme.colors.primary}15` : theme.colors.surface,
    border: `1px solid ${
      draggedOver ? theme.colors.accent :
      selected ? theme.colors.primary :
      theme.colors.border
    }`,
    borderRadius: theme.borderRadius.md,
    cursor: interactive ? 'pointer' : 'default',
    transition: theme.transitions.normal,
    opacity: dragging ? 0.8 : 1,
    transform: dragging ? 'scale(1.05)' : isHovered && interactive ? 'scale(1.02)' : 'scale(1)',
    boxShadow: dragging ? theme.shadows.lg :
               isHovered && interactive ? theme.shadows.md :
               theme.shadows.sm,
    position: 'relative',
    width: '100%', // Ensure full width
    ...style,
  }), [
    layout, selected, draggedOver, dragging, isHovered, interactive,
    theme, sizeConfig, style
  ]);

  const contentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
    width: '100%', // Ensure full width
    alignItems: 'center', // Center content
  };



  const metadataStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: theme.colors.textSecondary,
    margin: 0,
    fontFamily: '"Space Mono", monospace',
  };









  const selectionIndicatorStyle: React.CSSProperties = {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: selected ? theme.colors.primary : 'transparent',
    border: `2px solid ${selected ? theme.colors.primary : theme.colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: theme.transitions.fast,
  };

  return (
    <div
      className={`media-item ${className}`}
      style={containerStyle}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Indicator */}
      {showSelection && (
        <div style={selectionIndicatorStyle}>
          {selected && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <polyline points="20,6 9,17 4,12" stroke="white" strokeWidth="2" fill="none" />
            </svg>
          )}
        </div>
      )}

      {/* Thumbnail - Click to add to timeline - Full width */}
      <MediaThumbnail
        item={item}
        size={size}
        showDuration={false}
        showType={false}
        onClick={onAdd ? () => onAdd(item) : onPreview}
        style={{
          // Make thumbnail fill the full width of the container
          width: '100%',
          height: 'auto',
          minHeight: '120px', // Ensure minimum height for visual impact
          maxHeight: '200px', // Prevent excessive height
          aspectRatio: '16/9', // Maintain consistent aspect ratio
        }}
      />

      {/* Delete Button - Only visible on hover */}
      {onRemove && isHovered && (
        <button
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '24px',
            height: '24px',
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            border: 'none',
            borderRadius: '50%',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease',
            zIndex: 10,
          }}
          onClick={handleRemoveClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 1)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {/* Trash icon */}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
                  stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Content */}
      <div style={contentStyle}>

        {/* Metadata - ONLY show when explicitly enabled */}
        {showMetadata === true && (
          <div style={{
            ...metadataStyle,
            textAlign: 'center',
            width: '100%',
          }}>
            <div>{formatFileSize(item.size)}</div>
            {item.type === 'video' && (
              <div>{formatDuration((item as any).duration || 0)}</div>
            )}
            {item.type === 'image' && (item as any).dimensions && (
              <div>
                {(item as any).dimensions.width} × {(item as any).dimensions.height}
              </div>
            )}
          </div>
        )}


      </div>
    </div>
  );
};

export default MediaItem;
