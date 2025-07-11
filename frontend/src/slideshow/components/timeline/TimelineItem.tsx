import React from 'react';
import { TimelineItem as TimelineItemType, ImageFile } from '../../types/slideshow.types';

// Sub-components
interface ImageThumbnailProps {
  src: string;
  alt: string;
  isDragged: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

const ImageThumbnail: React.FC<ImageThumbnailProps> = ({
  src,
  alt,
  isDragged,
  onDragStart,
  onDragEnd
}) => (
  <div
    className="timeline-thumbnail"
    draggable
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    style={{
      width: '150px',
      height: '100px',
      borderRadius: '8px',
      overflow: 'hidden',
      cursor: 'grab',
      opacity: isDragged ? 0.5 : 1,
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      border: 'none' // Clean design - no outer border
    }}
  >
    <img
      src={src}
      alt={alt}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        pointerEvents: 'none'
      }}
    />
  </div>
);

interface DurationControlProps {
  duration: number;
  formatDuration: (duration: number) => string;
  onChange: (duration: number) => void;
}

const DurationControl: React.FC<DurationControlProps> = ({
  duration,
  formatDuration,
  onChange
}) => {
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = parseFloat(e.target.value) * 1000; // Convert to ms
    onChange(newDuration);
  };

  return (
    <div className="duration-control" style={{ marginTop: '8px' }}>
      <input
        type="range"
        min="0.5"
        max="5"
        step="0.1"
        value={duration / 1000}
        onChange={handleDurationChange}
        style={{
          width: '130px', // Increased to match larger card width
          height: '4px',
          background: '#374151',
          borderRadius: '2px',
          outline: 'none',
          cursor: 'pointer'
        }}
      />
      <div
        style={{
          fontSize: '11px',
          color: '#9ca3af',
          textAlign: 'center',
          marginTop: '4px',
          fontFamily: '"Space Mono", monospace'
        }}
      >
        {formatDuration(duration)}
      </div>
    </div>
  );
};

interface RemoveButtonProps {
  onRemove: () => void;
  isVisible: boolean;
}

const RemoveButton: React.FC<RemoveButtonProps> = ({ onRemove, isVisible }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onRemove();
    }}
    style={{
      position: 'absolute',
      top: '8px',
      right: '8px',
      width: '28px',
      height: '28px',
      backgroundColor: '#ef4444',
      border: 'none',
      borderRadius: '50%',
      color: 'white',
      fontSize: '14px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
      opacity: isVisible ? 0.8 : 0,
      transition: 'opacity 0.3s ease',
      zIndex: 10
    }}
    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
    onMouseLeave={(e) => e.currentTarget.style.opacity = isVisible ? '0.8' : '0'}
    title="Remove frame"
  >
    ×
  </button>
);

// Main component interfaces
export interface DragState {
  isDragged: boolean;
  isDraggedOver: boolean;
  isHovered: boolean;
}

export interface DragHandlers {
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export interface ActionHandlers {
  onRemove: () => void;
  onDurationChange: (duration: number) => void;
}

export interface UIHandlers {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export interface TimelineItemProps {
  item: TimelineItemType;
  image: ImageFile;
  index: number;
  dragState: DragState;
  handlers: {
    drag: DragHandlers;
    actions: ActionHandlers;
    ui: UIHandlers;
  };
  utilities: {
    formatDuration: (duration: number) => string;
  };
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  item,
  image,
  index,
  dragState,
  handlers,
  utilities
}) => {
  return (
    <div
      className="timeline-item"
      data-item-id={item.id}
      data-index={index}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        flexShrink: 0,
        transform: dragState.isDraggedOver ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s ease'
      }}
      onDragOver={handlers.drag.onDragOver}
      onDragLeave={handlers.drag.onDragLeave}
      onDrop={handlers.drag.onDrop}
      onMouseEnter={handlers.ui.onMouseEnter}
      onMouseLeave={handlers.ui.onMouseLeave}
    >
      <ImageThumbnail
        src={image.preview}
        alt={image.name}
        isDragged={dragState.isDragged}
        onDragStart={handlers.drag.onDragStart}
        onDragEnd={handlers.drag.onDragEnd}
      />
      
      <DurationControl
        duration={item.duration}
        formatDuration={utilities.formatDuration}
        onChange={handlers.actions.onDurationChange}
      />
      
      <RemoveButton
        onRemove={handlers.actions.onRemove}
        isVisible={dragState.isHovered}
      />
    </div>
  );
};

export default TimelineItem;
