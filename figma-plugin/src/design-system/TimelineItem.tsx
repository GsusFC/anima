import React from 'react';
import { colors, typography, spacing, borderRadius } from './tokens';
import { Slider } from './Slider';
import { Select } from './Select';
import { Button } from './Button';
import { TimelineItem as TimelineItemType, TransitionConfig, TransitionType } from '../types/slideshow.types';

interface ImageFile {
  id: string;
  name: string;
  preview: string;
}

interface TimelineItemProps {
  item: TimelineItemType;
  image: ImageFile;
  index: number;
  totalItems: number;
  onUpdate: (itemId: string, updates: Partial<TimelineItemType>) => void;
  onRemove?: (itemId: string) => void;
  onMove?: (fromIndex: number, toIndex: number) => void;
  exportFormat?: string; // Add format to determine if controls should be shown
}

const formatDuration = (duration: number): string => {
  return `${(duration / 1000).toFixed(1)}s`;
};

const transitionOptions = [
  { value: 'cut', label: 'Cut' },
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'dissolve', label: 'Dissolve' },


];

export const TimelineItem: React.FC<TimelineItemProps> = ({
  item,
  image,
  index,
  totalItems,
  onUpdate,
  onRemove,
  onMove,
  exportFormat
}) => {
  const hasTransition = index < totalItems - 1;
  const isGifMode = exportFormat === 'gif';

  return (
    <div
      style={{
        backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.border.primary}`,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md
      }}
    >
      {/* Thumbnail */}
      <img
        src={image.preview}
        alt={image.name}
        style={{
          width: '60px',
          height: '40px',
          objectFit: 'cover',
          borderRadius: borderRadius.sm,
          border: `1px solid ${colors.border.secondary}`
        }}
      />

      {/* Reorder controls */}
      {onMove && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: spacing.xs,
          minWidth: '24px'
        }}>
          <Button
            variant="ghost"
            size="sm"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
            style={{
              width: '24px',
              height: '20px',
              padding: 0,
              fontSize: '12px',
              opacity: index === 0 ? 0.3 : 1
            }}
          >
            ↑
          </Button>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.tertiary,
            textAlign: 'center',
            minWidth: '20px'
          }}>
            {index + 1}
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={index === totalItems - 1}
            onClick={() => onMove(index, index + 1)}
            style={{
              width: '24px',
              height: '20px',
              padding: 0,
              fontSize: '12px',
              opacity: index === totalItems - 1 ? 0.3 : 1
            }}
          >
            ↓
          </Button>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1 }}>
        {/* Frame name */}
        <div
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.primary,
            marginBottom: spacing.xs,
            fontWeight: typography.fontWeight.medium
          }}
        >
          {image.name}
        </div>

        {/* Duration control - Hidden in GIF mode */}
        {!isGifMode && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: hasTransition ? spacing.xs : 0
            }}
          >
            <label
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
                fontWeight: typography.fontWeight.medium,
                minWidth: '50px'
              }}
            >
              Duration:
            </label>
            <Slider
              value={item.duration}
              onChange={(value) => onUpdate(item.id, { duration: value })}
              min={300}
              max={5000}
              step={100}
              color="primary"
            />
            <span
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
                minWidth: '40px',
                textAlign: 'right' as const
              }}
            >
              {formatDuration(item.duration)}
            </span>
          </div>
        )}

        {/* GIF mode info */}
        {isGifMode && (
          <div
            style={{
              padding: spacing.sm,
              backgroundColor: colors.bg.secondary,
              borderRadius: borderRadius.sm,
              border: `1px solid ${colors.border.primary}`,
              marginBottom: spacing.xs
            }}
          >
            <div
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
                textAlign: 'center'
              }}
            >
              🎬 GIF Mode: 2s per frame
            </div>
          </div>
        )}

        {/* Transition controls - Hidden in GIF mode */}
        {hasTransition && !isGifMode && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.xs
            }}
          >
            {/* Transition type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <label
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                  fontWeight: typography.fontWeight.medium,
                  minWidth: '60px'
                }}
              >
                Transition:
              </label>
              <Select
                value={item.transition?.type || 'fade'}
                onChange={(type) => {
                  const transitionType = type as TransitionType;
                  const duration = (transitionType === 'cut') ? 0 : (item.transition?.duration || 500);
                  onUpdate(item.id, { transition: { type: transitionType, duration } });
                }}
                options={transitionOptions}
                size="sm"
              />
            </div>

            {/* Transition duration - only show if not cut/none */}
            {((item.transition?.type || 'fade') !== 'cut') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <label
                  style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                    fontWeight: typography.fontWeight.medium,
                    minWidth: '60px'
                  }}
                >
                  Duration:
                </label>
                <div style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: spacing.sm
                }}>
                  <div style={{ flex: 1 }}>
                    <Slider
                      value={item.transition?.duration || 0}
                      onChange={(duration) => 
                        onUpdate(item.id, { 
                          transition: { 
                            ...(item.transition || { type: 'fade' }), 
                            duration 
                          } 
                        })
                      }
                      min={0}
                      max={2000}
                      step={100}
                      color="primary"
                    />
                  </div>
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary,
                      minWidth: '36px',
                      textAlign: 'right' as const,
                      flexShrink: 0
                    }}
                  >
                    {formatDuration(item.transition?.duration || 0)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Remove button (optional) */}
      {onRemove && (
        <button
          onClick={() => onRemove(item.id)}
          style={{
            background: 'none',
            border: `1px solid ${colors.status.error}`,
            color: colors.status.error,
            borderRadius: borderRadius.sm,
            padding: spacing.xs,
            cursor: 'pointer',
            fontSize: typography.fontSize.xs,
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Remove from timeline"
        >
          ×
        </button>
      )}
    </div>
  );
};
