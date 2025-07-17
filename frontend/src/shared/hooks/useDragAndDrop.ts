/**
 * Drag and Drop Hook
 * 
 * Reusable hook for drag and drop functionality across AnimaGen components.
 * Eliminates duplication between Timeline, ImageUpload, and other drag-enabled components.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// Drag and drop configuration
export interface DragDropConfig<T> {
  // Data
  items: T[];
  
  // Drag configuration
  dragEnabled?: boolean;
  dragDelay?: number;
  dragThreshold?: number;
  
  // Drop configuration
  dropEnabled?: boolean;
  dropZones?: string[];
  
  // Visual feedback
  dragClassName?: string;
  dropTargetClassName?: string;
  dragPreviewClassName?: string;
  
  // Callbacks
  onDragStart?: (item: T, index: number) => void;
  onDragEnd?: (item: T, index: number) => void;
  onDrop?: (draggedItem: T, targetIndex: number, sourceIndex: number) => void;
  onReorder?: (newItems: T[]) => void;
  onExternalDrop?: (files: FileList, targetIndex?: number) => void;
  
  // Item identification
  getItemId: (item: T) => string;
  getItemData?: (item: T) => any;
}

// Drag and drop state
export interface DragDropState<T> {
  // Current drag state
  isDragging: boolean;
  draggedItem: T | null;
  draggedIndex: number | null;
  
  // Drop target state
  dropTargetIndex: number | null;
  isValidDropTarget: boolean;
  
  // External drag state
  isExternalDragActive: boolean;
  externalDragType: string | null;
}

// Drag and drop return type
export interface DragDropReturn<T> {
  // State
  state: DragDropState<T>;
  
  // Drag handlers
  handleDragStart: (item: T, index: number) => (e: React.DragEvent) => void;
  handleDragEnd: (item: T, index: number) => (e: React.DragEvent) => void;
  handleDragOver: (index: number) => (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (index: number) => (e: React.DragEvent) => void;
  
  // External drag handlers
  handleExternalDragEnter: (e: React.DragEvent) => void;
  handleExternalDragOver: (e: React.DragEvent) => void;
  handleExternalDragLeave: (e: React.DragEvent) => void;
  handleExternalDrop: (e: React.DragEvent) => void;
  
  // Utility functions
  getDragItemClasses: (item: T, index: number) => string;
  getDropTargetClasses: (index: number) => string;
  resetDragState: () => void;
}

/**
 * Drag and Drop Hook
 * 
 * Provides comprehensive drag and drop functionality with support for:
 * - Internal reordering
 * - External file drops
 * - Visual feedback
 * - Touch support (future)
 */
export function useDragAndDrop<T>(
  config: DragDropConfig<T>
): DragDropReturn<T> {
  
  const {
    items,
    dragEnabled = true,
    dropEnabled = true,
    dragDelay: _dragDelay = 0,
    dragThreshold: _dragThreshold = 5,
    dragClassName = 'dragging',
    dropTargetClassName = 'drop-target',
    dragPreviewClassName = 'drag-preview',
    onDragStart,
    onDragEnd,
    onDrop,
    onReorder,
    onExternalDrop,
    getItemId,
    getItemData
  } = config;

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<T | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [isValidDropTarget, setIsValidDropTarget] = useState(false);
  
  // External drag state
  const [isExternalDragActive, setIsExternalDragActive] = useState(false);
  const [externalDragType, setExternalDragType] = useState<string | null>(null);
  
  // Refs for drag tracking
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragTimer = useRef<NodeJS.Timeout | null>(null);
  const dragCounter = useRef(0);

  // Reset drag state
  const resetDragState = useCallback(() => {
    setIsDragging(false);
    setDraggedItem(null);
    setDraggedIndex(null);
    setDropTargetIndex(null);
    setIsValidDropTarget(false);
    setIsExternalDragActive(false);
    setExternalDragType(null);
    dragStartPos.current = null;
    dragCounter.current = 0;
    
    if (dragTimer.current) {
      clearTimeout(dragTimer.current);
      dragTimer.current = null;
    }
  }, []);

  // Internal drag handlers
  const handleDragStart = useCallback((item: T, index: number) => {
    return (e: React.DragEvent) => {
      if (!dragEnabled) {
        e.preventDefault();
        return;
      }

      const itemId = getItemId(item);
      const itemData = getItemData?.(item) || item;

      // Set drag data
      e.dataTransfer.setData('text/plain', itemId);
      e.dataTransfer.setData('application/json', JSON.stringify(itemData));
      e.dataTransfer.effectAllowed = 'move';

      // Set drag image if available
      const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
      dragImage.classList.add(dragPreviewClassName);
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      
      // Clean up drag image after a delay
      setTimeout(() => {
        if (document.body.contains(dragImage)) {
          document.body.removeChild(dragImage);
        }
      }, 0);

      // Update state
      setIsDragging(true);
      setDraggedItem(item);
      setDraggedIndex(index);

      onDragStart?.(item, index);
    };
  }, [dragEnabled, getItemId, getItemData, dragPreviewClassName, onDragStart]);

  const handleDragEnd = useCallback((item: T, index: number) => {
    return (_e: React.DragEvent) => {
      onDragEnd?.(item, index);
      resetDragState();
    };
  }, [onDragEnd, resetDragState]);

  const handleDragOver = useCallback((index: number) => {
    return (e: React.DragEvent) => {
      if (!dropEnabled) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      // Update drop target
      if (dropTargetIndex !== index) {
        setDropTargetIndex(index);
        setIsValidDropTarget(true);
      }
    };
  }, [dropEnabled, dropTargetIndex]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only reset if leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropTargetIndex(null);
      setIsValidDropTarget(false);
    }
  }, []);

  const handleDrop = useCallback((index: number) => {
    return (e: React.DragEvent) => {
      e.preventDefault();

      if (!dropEnabled || draggedIndex === null || draggedItem === null) {
        return;
      }

      // Handle internal reordering
      if (draggedIndex !== index) {
        onDrop?.(draggedItem, index, draggedIndex);
        
        // Auto-reorder if no custom handler
        if (!onDrop && onReorder) {
          const newItems = [...items];
          const [movedItem] = newItems.splice(draggedIndex, 1);
          newItems.splice(index, 0, movedItem);
          onReorder(newItems);
        }
      }

      resetDragState();
    };
  }, [dropEnabled, draggedIndex, draggedItem, onDrop, onReorder, items, resetDragState]);

  // External drag handlers
  const handleExternalDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    
    if (dragCounter.current === 1) {
      setIsExternalDragActive(true);
      
      // Detect drag type
      const types = Array.from(e.dataTransfer.types);
      if (types.includes('Files')) {
        setExternalDragType('files');
      } else if (types.includes('text/plain')) {
        setExternalDragType('text');
      } else {
        setExternalDragType('unknown');
      }
    }
  }, []);

  const handleExternalDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleExternalDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    
    if (dragCounter.current === 0) {
      setIsExternalDragActive(false);
      setExternalDragType(null);
    }
  }, []);

  const handleExternalDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    dragCounter.current = 0;
    setIsExternalDragActive(false);
    setExternalDragType(null);

    // Handle file drops
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onExternalDrop?.(e.dataTransfer.files, dropTargetIndex || undefined);
    }

    resetDragState();
  }, [onExternalDrop, dropTargetIndex, resetDragState]);

  // Utility functions
  const getDragItemClasses = useCallback((_item: T, index: number): string => {
    const classes: string[] = [];
    
    if (isDragging && draggedIndex === index) {
      classes.push(dragClassName);
    }
    
    return classes.join(' ');
  }, [isDragging, draggedIndex, dragClassName]);

  const getDropTargetClasses = useCallback((index: number): string => {
    const classes: string[] = [];
    
    if (isValidDropTarget && dropTargetIndex === index) {
      classes.push(dropTargetClassName);
    }
    
    return classes.join(' ');
  }, [isValidDropTarget, dropTargetIndex, dropTargetClassName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragTimer.current) {
        clearTimeout(dragTimer.current);
      }
    };
  }, []);

  // State object
  const state: DragDropState<T> = {
    isDragging,
    draggedItem,
    draggedIndex,
    dropTargetIndex,
    isValidDropTarget,
    isExternalDragActive,
    externalDragType
  };

  return {
    state,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleExternalDragEnter,
    handleExternalDragOver,
    handleExternalDragLeave,
    handleExternalDrop,
    getDragItemClasses,
    getDropTargetClasses,
    resetDragState
  };
}

export default useDragAndDrop;
