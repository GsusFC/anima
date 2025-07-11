import React from 'react';
import { TimelineItem as TimelineItemType, ImageFile } from '../types/slideshow.types';

interface TimelineItemProps {
  item: TimelineItemType;
  index: number;
  image: ImageFile;
  isDragged: boolean;
  isDraggedOver: boolean;
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onRemove: (itemId: string) => void;
  onDurationChange: (itemId: string, duration: number) => void;
  onTransitionClick: (itemId: string) => void;
  formatDuration: (duration: number) => string;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  item,
  index,
  image,
  isDragged,
  isDraggedOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
  onDurationChange,
  onTransitionClick,
  formatDuration,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexShrink: 0,
        opacity: isDragged ? 0.5 : 1,
        transform: isDraggedOver ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s ease'
      }}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onMouseEnter={(e) => {
        const removeBtn = e.currentTarget.querySelector('.remove-btn') as HTMLElement;
        if (removeBtn) removeBtn.style.opacity = '0.8';
      }}
      onMouseLeave={(e) => {
        const removeBtn = e.currentTarget.querySelector('.remove-btn') as HTMLElement;
        if (removeBtn) removeBtn.style.opacity = '0';
      }}
    >
      {/* Frame Container */}
      <div
        draggable={true}
        onDragStart={(e) => onDragStart(e, item.id)}
        onDragEnd={onDragEnd}
        style={{
          width: '200px',
          height: '150px',
          backgroundColor: '#0f0f0f',
          borderRadius: '8px',
          border: isDraggedOver ? '2px solid #22c55e' : '2px solid #343536',
          position: 'relative',
          overflow: 'hidden',
          cursor: isDragged ? 'grabbing' : 'grab',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
        }}

      >
        <img
          src={image.preview}
          alt={image.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />

        {/* Remove Button */}
        <button
          className="remove-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
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
            opacity: 0,
            transition: 'opacity 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
          title="Remove frame"
        >
          ×
        </button>


      </div>

      {/* Duration Slider */}
      <div style={{
        marginTop: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        width: '200px'
      }}>
        <div style={{
          fontSize: '11px',
          color: '#9ca3af',
          fontFamily: '"Space Mono", monospace'
        }}>
          Duration
        </div>
        <input
          type="range"
          min="100"
          max="5000"
          step="100"
          value={item.duration}
          onChange={(e) => onDurationChange(item.id, parseInt(e.target.value))}
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            background: '#343536',
            outline: 'none',
            cursor: 'pointer'
          }}
          title={`Duration: ${formatDuration(item.duration)}`}
        />
        <div style={{
          fontSize: '10px',
          color: '#6b7280',
          fontFamily: '"Space Mono", monospace'
        }}>
          {formatDuration(item.duration)}
        </div>
      </div>

      {/* Transition Button (if not last item) */}
      <div style={{
        marginTop: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px'
      }}>
        <button
          onClick={() => onTransitionClick(item.id)}
          style={{
            padding: '6px 12px',
            backgroundColor: item.transition?.type ? '#ec4899' : '#374151',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: '"Space Mono", monospace',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!item.transition?.type) {
              e.currentTarget.style.backgroundColor = '#4b5563';
            }
          }}
          onMouseLeave={(e) => {
            if (!item.transition?.type) {
              e.currentTarget.style.backgroundColor = '#374151';
            }
          }}
          title={item.transition?.type ? `${item.transition.type} (${item.transition.duration}ms)` : 'Add transition'}
        >
          {item.transition?.type || 'Transition'}
        </button>
      </div>
    </div>
  );
};

export default TimelineItem;
