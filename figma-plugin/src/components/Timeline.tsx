import React from 'react';
import { TimelineItem } from '../design-system/TimelineItem';
import { Button } from '../design-system/Button';
import { spacing, colors } from '../design-system/tokens';
import { TimelineItem as TimelineItemType, ImageFile, TransitionConfig } from '../types/slideshow.types';
import { PreviewState } from '../plugin-hooks/usePreviewGeneration';

interface TimelineProps {
  timeline: TimelineItemType[];
  images: ImageFile[];
  previewState: PreviewState;
  canGeneratePreview: boolean;
  onUpdateItem: (itemId: string, updates: Partial<TimelineItemType>) => void;
  onRemoveItem: (itemId: string) => void;
  onMoveItem: (fromIndex: number, toIndex: number) => void;
  onGeneratePreview: () => void;
  exportFormat?: string; // Add export format
}

export const Timeline: React.FC<TimelineProps> = ({
  timeline,
  images,
  previewState,
  canGeneratePreview,
  onUpdateItem,
  onRemoveItem,
  onMoveItem,
  onGeneratePreview,
  exportFormat
}) => {
  return (
    <div
      style={{
        position: 'relative', // Para posicionar el botón flotante
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md
      }}
    >
      {/* Botón de preview flotante */}
      {canGeneratePreview && (
        <div
          style={{
            position: 'absolute',
            bottom: spacing.sm,
            right: spacing.sm,
            zIndex: 10
          }}
        >
          <Button
            variant="primary"
            size="sm"
            onClick={onGeneratePreview}
            disabled={previewState.isGenerating}
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              borderRadius: '50%',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {previewState.isGenerating ? '⏳' : '▶️'}
          </Button>
        </div>
      )}

      {timeline.map((item, index) => {
        const image = images.find(img => img.id === item.imageId);
        if (!image) return null;

        return (
          <TimelineItem
            key={item.id}
            item={item}
            image={image}
            index={index}
            totalItems={timeline.length}
            onUpdate={onUpdateItem}
            onRemove={onRemoveItem}
            onMove={onMoveItem}
            exportFormat={exportFormat}
          />
        );
      })}
    </div>
  );
};
