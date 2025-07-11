import React, { useState, useMemo, useCallback } from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';
import { TimelineItem as TimelineItemType } from '../types/slideshow.types';
import TimelineItem, { DragState, DragHandlers, ActionHandlers, UIHandlers } from './timeline/TimelineItem';
import TransitionElement from './timeline/TransitionElement';
import TransitionModal from './TransitionModal';
import FloatingExportButton from './export/FloatingExportButton';
import { useExportValidation, ExportSettings as ValidationExportSettings } from '../../hooks/useExportValidation';

// Types for rendering
interface TimelineRenderItem {
  type: 'image' | 'transition';
  id: string;
  data: TimelineItemType | TransitionData;
  index: number;
}

interface TransitionData {
  id: string;
  fromItemId: string;
  toItemId: string;
  config?: any;
}

interface TransitionModalState {
  isOpen: boolean;
  itemId: string;
  frameNumber: number;
}



const initialModalState: TransitionModalState = {
  isOpen: false,
  itemId: '',
  frameNumber: 0
};

const Timeline: React.FC = () => {
  const {
    project,
    hasTimeline,
    updateTimelineItem,
    removeFromTimeline,
    reorderTimeline,
    export: exportState,
    exportSlideshow
  } = useSlideshowContext();

  // Local state
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hoveredItems, setHoveredItems] = useState<Set<string>>(new Set());
  const [transitionModal, setTransitionModal] = useState<TransitionModalState>(initialModalState);

  // Duration formatting utility
  const formatDuration = useCallback((duration: number): string => {
    return `${(duration / 1000).toFixed(1)}s`;
  }, []);

  // Export validation for floating button
  const currentValidationSettings: ValidationExportSettings = {
    format: project.exportSettings.format as any,
    fps: project.exportSettings.fps,
    quality: project.exportSettings.quality as any,
    resolution: project.exportSettings.resolution,
    gif: project.exportSettings.gif
  };
  const exportValidation = useExportValidation(currentValidationSettings);

  // Convert timeline to render structure
  const renderItems = useMemo((): TimelineRenderItem[] => {
    const items: TimelineRenderItem[] = [];

    project.timeline.forEach((item, index) => {
      // Add image item
      items.push({
        type: 'image',
        id: item.id,
        data: item,
        index
      });

      // Add transition if not the last item
      if (index < project.timeline.length - 1) {
        items.push({
          type: 'transition',
          id: `transition-${item.id}`,
          data: {
            id: `transition-${item.id}`,
            fromItemId: item.id,
            toItemId: project.timeline[index + 1].id,
            config: item.transition
          },
          index
        });
      }
    });

    return items;
  }, [project.timeline]);

  // Get drag state for specific item
  const getDragStateForItem = useCallback((itemId: string): DragState => {
    const itemIndex = project.timeline.findIndex(item => item.id === itemId);
    return {
      isDragged: draggedItem === itemId,
      isDraggedOver: dragOverIndex === itemIndex,
      isHovered: hoveredItems.has(itemId)
    };
  }, [draggedItem, dragOverIndex, hoveredItems, project.timeline]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const draggedItemId = e.dataTransfer.getData('text/plain');

    if (!draggedItemId) return;

    const draggedIndex = project.timeline.findIndex(item => item.id === draggedItemId);
    if (draggedIndex === -1 || draggedIndex === dropIndex) return;

    // Reorder timeline
    const newTimeline = [...project.timeline];
    const [draggedItem] = newTimeline.splice(draggedIndex, 1);
    newTimeline.splice(dropIndex, 0, draggedItem);

    // Update positions
    const updatedTimeline = newTimeline.map((item, index) => ({
      ...item,
      position: index
    }));

    reorderTimeline(updatedTimeline);
    setDraggedItem(null);
    setDragOverIndex(null);
  }, [draggedItem, project.timeline, reorderTimeline]);

  // UI handlers
  const handleMouseEnter = useCallback((itemId: string) => {
    setHoveredItems(prev => new Set(prev).add(itemId));
  }, []);

  const handleMouseLeave = useCallback((itemId: string) => {
    setHoveredItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  }, []);

  // Action handlers
  const handleRemove = useCallback((itemId: string) => {
    removeFromTimeline(itemId);
  }, [removeFromTimeline]);

  const handleDurationChange = useCallback((itemId: string, duration: number) => {
    updateTimelineItem(itemId, { duration });
  }, [updateTimelineItem]);

  const handleTransitionEdit = useCallback((itemId: string) => {
    const itemIndex = project.timeline.findIndex(item => item.id === itemId);
    setTransitionModal({
      isOpen: true,
      itemId,
      frameNumber: itemIndex + 1
    });
  }, [project.timeline]);

  // Export handler for floating button
  const handleFloatingExport = useCallback(() => {
    if (!exportValidation.canExport) {
      const errorMessages = exportValidation.messages
        .filter(m => m.type === 'error')
        .map(m => m.message)
        .join('\n');
      alert(`Export configuration invalid:\n${errorMessages}`);
      return;
    }
    exportSlideshow();
  }, [exportValidation, exportSlideshow]);

  // Create handlers for each item
  const createHandlersForItem = useCallback((item: TimelineItemType, index: number) => {
    const dragHandlers: DragHandlers = {
      onDragStart: (e) => handleDragStart(e, item.id),
      onDragEnd: handleDragEnd,
      onDragOver: (e) => handleDragOver(e, index),
      onDragLeave: handleDragLeave,
      onDrop: (e) => handleDrop(e, index)
    };

    const actionHandlers: ActionHandlers = {
      onRemove: () => handleRemove(item.id),
      onDurationChange: (duration) => handleDurationChange(item.id, duration)
    };

    const uiHandlers: UIHandlers = {
      onMouseEnter: () => handleMouseEnter(item.id),
      onMouseLeave: () => handleMouseLeave(item.id)
    };

    return {
      drag: dragHandlers,
      actions: actionHandlers,
      ui: uiHandlers
    };
  }, [
    handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop,
    handleRemove, handleDurationChange, handleMouseEnter, handleMouseLeave
  ]);

  if (!hasTimeline) {
    return (
      <div className="timeline-empty" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '120px',
        color: '#6b7280',
        fontFamily: '"Space Mono", monospace',
        fontSize: '14px'
      }}>
        No images in timeline. Drag images here to create your slideshow.
      </div>
    );
  }

  return (
    <div className="timeline-container" style={{
      position: 'relative', // ✅ Añadido para que FloatingExportButton se posicione correctamente
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '16px',
      backgroundColor: '#0a0a0b',
      borderRadius: '8px',
      border: '1px solid #374151'
    }}>
      {/* Timeline Track */}
      <div className="timeline-track" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px', // Increased gap for better spacing with larger cards
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '12px 0', // Increased padding
        minHeight: '140px' // Increased to accommodate larger cards + controls
      }}>
        {renderItems.map((renderItem) => {
          if (renderItem.type === 'image') {
            const item = renderItem.data as TimelineItemType;
            const image = project.images.find(img => img.id === item.imageId);

            return image ? (
              <TimelineItem
                key={renderItem.id}
                item={item}
                image={image}
                index={renderItem.index}
                dragState={getDragStateForItem(item.id)}
                handlers={createHandlersForItem(item, renderItem.index)}
                utilities={{ formatDuration }}
              />
            ) : null;
          } else {
            const transitionData = renderItem.data as TransitionData;
            const fromItem = project.timeline.find(item => item.id === transitionData.fromItemId);
            const toItem = project.timeline.find(item => item.id === transitionData.toItemId);

            return fromItem && toItem ? (
              <TransitionElement
                key={renderItem.id}
                fromItem={fromItem}
                toItem={toItem}
                index={renderItem.index}
                handlers={{
                  onEdit: handleTransitionEdit
                }}
              />
            ) : null;
          }
        })}
      </div>

      {/* Floating Export Button */}
      {hasTimeline && (
        <FloatingExportButton
          exportState={exportState}
          validation={exportValidation}
          currentFormat={project.exportSettings.format}
          onExport={handleFloatingExport}
        />
      )}

      {/* Transition Modal */}
      <TransitionModal
        isOpen={transitionModal.isOpen}
        onClose={() => setTransitionModal(initialModalState)}
        onSave={(transition) => {
          updateTimelineItem(transitionModal.itemId, { transition });
          setTransitionModal(initialModalState);
        }}
        currentTransition={project.timeline.find(item => item.id === transitionModal.itemId)?.transition}
        frameNumber={transitionModal.frameNumber}
      />
    </div>
  );
};

export default Timeline;
