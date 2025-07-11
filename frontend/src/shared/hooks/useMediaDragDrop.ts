import { useState, useCallback, useRef } from 'react';
import { MediaItem, DragDropState } from '../types/media.types';

interface UseMediaDragDropOptions {
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onDrop?: (droppedItem: MediaItem, targetIndex: number) => void;
  enabled?: boolean;
}

interface UseMediaDragDropReturn {
  dragDropState: DragDropState;
  dragHandlers: {
    onDragStart: (e: React.DragEvent, item: MediaItem, index: number) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDragEnter: (e: React.DragEvent, index: number) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
  };
  isDragging: (itemId: string) => boolean;
  isDraggedOver: (index: number) => boolean;
  resetDragState: () => void;
}

export const useMediaDragDrop = (
  items: MediaItem[],
  options: UseMediaDragDropOptions = {}
): UseMediaDragDropReturn => {
  const {
    onReorder,
    onDrop,
    enabled = true,
  } = options;

  const [dragDropState, setDragDropState] = useState<DragDropState>({
    isDragging: false,
    draggedItem: undefined,
    dropTarget: undefined,
    dragOverIndex: undefined,
  });

  const dragCounterRef = useRef(0);
  const draggedIndexRef = useRef<number | null>(null);

  const resetDragState = useCallback(() => {
    setDragDropState({
      isDragging: false,
      draggedItem: undefined,
      dropTarget: undefined,
      dragOverIndex: undefined,
    });
    dragCounterRef.current = 0;
    draggedIndexRef.current = null;
  }, []);

  const onDragStart = useCallback((e: React.DragEvent, item: MediaItem, index: number) => {
    if (!enabled) return;

    draggedIndexRef.current = index;
    
    setDragDropState(prev => ({
      ...prev,
      isDragging: true,
      draggedItem: item,
    }));

    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: item.id,
      index,
      type: 'media-item',
    }));

    // Add drag image styling
    if (e.dataTransfer.setDragImage) {
      const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = '0.8';
      dragImage.style.transform = 'scale(1.05)';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      
      // Clean up drag image after a short delay
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    }
  }, [enabled]);

  const onDragEnd = useCallback((_e: React.DragEvent) => {
    if (!enabled) return;

    resetDragState();
  }, [enabled, resetDragState]);

  const onDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (!enabled) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    setDragDropState(prev => ({
      ...prev,
      dragOverIndex: index,
    }));
  }, [enabled]);

  const onDragEnter = useCallback((e: React.DragEvent, index: number) => {
    if (!enabled) return;

    e.preventDefault();
    dragCounterRef.current++;

    setDragDropState(prev => ({
      ...prev,
      dragOverIndex: index,
      dropTarget: `index-${index}`,
    }));
  }, [enabled]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    if (!enabled) return;

    e.preventDefault();
    dragCounterRef.current--;

    if (dragCounterRef.current === 0) {
      setDragDropState(prev => ({
        ...prev,
        dragOverIndex: undefined,
        dropTarget: undefined,
      }));
    }
  }, [enabled]);

  const onDropHandler = useCallback((e: React.DragEvent, dropIndex: number) => {
    if (!enabled) return;

    e.preventDefault();
    e.stopPropagation();

    try {
      // Get drag data
      const dragData = e.dataTransfer.getData('application/json');
      const itemId = e.dataTransfer.getData('text/plain');

      if (!itemId) {
        resetDragState();
        return;
      }

      let draggedIndex: number;
      let draggedItem: MediaItem | undefined;

      if (dragData) {
        const parsed = JSON.parse(dragData);
        draggedIndex = parsed.index;
        draggedItem = items.find(item => item.id === parsed.id);
      } else {
        // Fallback: find by ID
        draggedIndex = items.findIndex(item => item.id === itemId);
        draggedItem = items[draggedIndex];
      }

      if (draggedItem && draggedIndex !== -1 && draggedIndex !== dropIndex) {
        // Call appropriate handler
        if (onReorder) {
          onReorder(draggedIndex, dropIndex);
        } else if (onDrop) {
          onDrop(draggedItem, dropIndex);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    } finally {
      resetDragState();
    }
  }, [enabled, items, onReorder, onDrop, resetDragState]);

  const isDragging = useCallback((itemId: string): boolean => {
    return dragDropState.draggedItem?.id === itemId;
  }, [dragDropState.draggedItem]);

  const isDraggedOver = useCallback((index: number): boolean => {
    return dragDropState.dragOverIndex === index;
  }, [dragDropState.dragOverIndex]);

  return {
    dragDropState,
    dragHandlers: {
      onDragStart,
      onDragEnd,
      onDragOver,
      onDragEnter,
      onDragLeave,
      onDrop: onDropHandler,
    },
    isDragging,
    isDraggedOver,
    resetDragState,
  };
};
