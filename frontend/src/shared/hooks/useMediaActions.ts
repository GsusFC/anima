import { useCallback, useMemo } from 'react';
import { MediaItem, MediaAction } from '../types/media.types';

interface UseMediaActionsOptions {
  onAdd?: (items: MediaItem[]) => void;
  onRemove?: (ids: string[]) => void;
  onUpdate?: (id: string, updates: Partial<MediaItem>) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onDuplicate?: (id: string) => void;
  onPreview?: (item: MediaItem) => void;
  onEdit?: (item: MediaItem) => void;
  onSelect?: (ids: string[]) => void;
  onDeselect?: (ids: string[]) => void;
}

interface UseMediaActionsReturn {
  // Single item actions
  addItem: (item: MediaItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<MediaItem>) => void;
  duplicateItem: (id: string) => void;
  previewItem: (item: MediaItem) => void;
  editItem: (item: MediaItem) => void;
  selectItem: (id: string) => void;
  deselectItem: (id: string) => void;
  
  // Batch actions
  addItems: (items: MediaItem[]) => void;
  removeItems: (ids: string[]) => void;
  selectItems: (ids: string[]) => void;
  deselectItems: (ids: string[]) => void;
  
  // List manipulation
  reorderItems: (fromIndex: number, toIndex: number) => void;
  moveItemToIndex: (id: string, newIndex: number) => void;
  
  // Utility actions
  clearAll: () => void;
  duplicateItems: (ids: string[]) => void;
  
  // Action dispatcher
  dispatch: (action: MediaAction) => void;
}

export const useMediaActions = (
  items: MediaItem[],
  options: UseMediaActionsOptions = {}
): UseMediaActionsReturn => {
  const {
    onAdd,
    onRemove,
    onUpdate,
    onReorder,
    onDuplicate,
    onPreview,
    onEdit,
    onSelect,
    onDeselect,
  } = options;

  // Single item actions
  const addItem = useCallback((item: MediaItem) => {
    onAdd?.([item]);
  }, [onAdd]);

  const removeItem = useCallback((id: string) => {
    onRemove?.([id]);
  }, [onRemove]);

  const updateItem = useCallback((id: string, updates: Partial<MediaItem>) => {
    onUpdate?.(id, updates);
  }, [onUpdate]);

  const duplicateItem = useCallback((id: string) => {
    onDuplicate?.(id);
  }, [onDuplicate]);

  const previewItem = useCallback((item: MediaItem) => {
    onPreview?.(item);
  }, [onPreview]);

  const editItem = useCallback((item: MediaItem) => {
    onEdit?.(item);
  }, [onEdit]);

  const selectItem = useCallback((id: string) => {
    onSelect?.([id]);
  }, [onSelect]);

  const deselectItem = useCallback((id: string) => {
    onDeselect?.([id]);
  }, [onDeselect]);

  // Batch actions
  const addItems = useCallback((newItems: MediaItem[]) => {
    onAdd?.(newItems);
  }, [onAdd]);

  const removeItems = useCallback((ids: string[]) => {
    onRemove?.(ids);
  }, [onRemove]);

  const selectItems = useCallback((ids: string[]) => {
    onSelect?.(ids);
  }, [onSelect]);

  const deselectItems = useCallback((ids: string[]) => {
    onDeselect?.(ids);
  }, [onDeselect]);

  // List manipulation
  const reorderItems = useCallback((fromIndex: number, toIndex: number) => {
    onReorder?.(fromIndex, toIndex);
  }, [onReorder]);

  const moveItemToIndex = useCallback((id: string, newIndex: number) => {
    const currentIndex = items.findIndex(item => item.id === id);
    if (currentIndex !== -1 && currentIndex !== newIndex) {
      onReorder?.(currentIndex, newIndex);
    }
  }, [items, onReorder]);

  // Utility actions
  const clearAll = useCallback(() => {
    const allIds = items.map(item => item.id);
    onRemove?.(allIds);
  }, [items, onRemove]);

  const duplicateItems = useCallback((ids: string[]) => {
    ids.forEach(id => onDuplicate?.(id));
  }, [onDuplicate]);

  // Action dispatcher
  const dispatch = useCallback((action: MediaAction) => {
    switch (action.type) {
      case 'add':
        if (Array.isArray(action.payload)) {
          addItems(action.payload);
        } else {
          addItem(action.payload);
        }
        break;
        
      case 'remove':
        if (Array.isArray(action.payload)) {
          removeItems(action.payload);
        } else {
          removeItem(action.payload);
        }
        break;
        
      case 'select':
        if (Array.isArray(action.payload)) {
          selectItems(action.payload);
        } else {
          selectItem(action.payload);
        }
        break;
        
      case 'deselect':
        if (Array.isArray(action.payload)) {
          deselectItems(action.payload);
        } else {
          deselectItem(action.payload);
        }
        break;
        
      case 'reorder':
        if (action.payload && typeof action.payload === 'object') {
          const { fromIndex, toIndex } = action.payload;
          reorderItems(fromIndex, toIndex);
        }
        break;
        
      default:
        console.warn('Unknown media action type:', action.type);
    }
  }, [addItem, addItems, removeItem, removeItems, selectItem, selectItems, 
      deselectItem, deselectItems, reorderItems]);

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // Single item actions
    addItem,
    removeItem,
    updateItem,
    duplicateItem,
    previewItem,
    editItem,
    selectItem,
    deselectItem,
    
    // Batch actions
    addItems,
    removeItems,
    selectItems,
    deselectItems,
    
    // List manipulation
    reorderItems,
    moveItemToIndex,
    
    // Utility actions
    clearAll,
    duplicateItems,
    
    // Action dispatcher
    dispatch,
  }), [
    addItem, removeItem, updateItem, duplicateItem, previewItem, editItem,
    selectItem, deselectItem, addItems, removeItems, selectItems, deselectItems,
    reorderItems, moveItemToIndex, clearAll, duplicateItems, dispatch
  ]);
};
