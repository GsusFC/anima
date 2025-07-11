import { useState, useCallback, useMemo } from 'react';
import { MediaItem, MediaSelection } from '../types/media.types';

interface UseMediaSelectionOptions {
  mode?: 'single' | 'multiple';
  initialSelection?: string[];
  onSelectionChange?: (selection: MediaSelection) => void;
}

interface UseMediaSelectionReturn {
  selection: MediaSelection;
  selectedItems: MediaItem[];
  isSelected: (id: string) => boolean;
  selectItem: (id: string) => void;
  deselectItem: (id: string) => void;
  toggleItem: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectRange: (startId: string, endId: string) => void;
  getSelectionCount: () => number;
  hasSelection: () => boolean;
}

export const useMediaSelection = (
  items: MediaItem[],
  options: UseMediaSelectionOptions = {}
): UseMediaSelectionReturn => {
  const {
    mode = 'multiple',
    initialSelection = [],
    onSelectionChange,
  } = options;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelection)
  );
  const [lastSelectedId, setLastSelectedId] = useState<string | undefined>();

  const selection: MediaSelection = useMemo(() => ({
    selectedIds,
    lastSelectedId,
    selectionMode: mode,
  }), [selectedIds, lastSelectedId, mode]);

  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.has(item.id));
  }, [items, selectedIds]);

  const isSelected = useCallback((id: string): boolean => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const selectItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSelection = new Set(prev);
      
      if (mode === 'single') {
        newSelection.clear();
      }
      
      newSelection.add(id);
      setLastSelectedId(id);
      
      const newSelectionObj: MediaSelection = {
        selectedIds: newSelection,
        lastSelectedId: id,
        selectionMode: mode,
      };
      
      onSelectionChange?.(newSelectionObj);
      return newSelection;
    });
  }, [mode, onSelectionChange]);

  const deselectItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSelection = new Set(prev);
      newSelection.delete(id);
      
      const newLastSelected = lastSelectedId === id ? undefined : lastSelectedId;
      setLastSelectedId(newLastSelected);
      
      const newSelectionObj: MediaSelection = {
        selectedIds: newSelection,
        lastSelectedId: newLastSelected,
        selectionMode: mode,
      };
      
      onSelectionChange?.(newSelectionObj);
      return newSelection;
    });
  }, [lastSelectedId, mode, onSelectionChange]);

  const toggleItem = useCallback((id: string) => {
    if (isSelected(id)) {
      deselectItem(id);
    } else {
      selectItem(id);
    }
  }, [isSelected, selectItem, deselectItem]);

  const selectAll = useCallback(() => {
    if (mode === 'single') return;
    
    const allIds = new Set(items.map(item => item.id));
    setSelectedIds(allIds);
    setLastSelectedId(items[items.length - 1]?.id);
    
    const newSelectionObj: MediaSelection = {
      selectedIds: allIds,
      lastSelectedId: items[items.length - 1]?.id,
      selectionMode: mode,
    };
    
    onSelectionChange?.(newSelectionObj);
  }, [items, mode, onSelectionChange]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(undefined);
    
    const newSelectionObj: MediaSelection = {
      selectedIds: new Set(),
      lastSelectedId: undefined,
      selectionMode: mode,
    };
    
    onSelectionChange?.(newSelectionObj);
  }, [mode, onSelectionChange]);

  const selectRange = useCallback((startId: string, endId: string) => {
    if (mode === 'single') return;
    
    const startIndex = items.findIndex(item => item.id === startId);
    const endIndex = items.findIndex(item => item.id === endId);
    
    if (startIndex === -1 || endIndex === -1) return;
    
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    
    const rangeIds = new Set(selectedIds);
    for (let i = minIndex; i <= maxIndex; i++) {
      rangeIds.add(items[i].id);
    }
    
    setSelectedIds(rangeIds);
    setLastSelectedId(endId);
    
    const newSelectionObj: MediaSelection = {
      selectedIds: rangeIds,
      lastSelectedId: endId,
      selectionMode: mode,
    };
    
    onSelectionChange?.(newSelectionObj);
  }, [items, selectedIds, mode, onSelectionChange]);

  const getSelectionCount = useCallback((): number => {
    return selectedIds.size;
  }, [selectedIds]);

  const hasSelection = useCallback((): boolean => {
    return selectedIds.size > 0;
  }, [selectedIds]);

  return {
    selection,
    selectedItems,
    isSelected,
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    deselectAll,
    selectRange,
    getSelectionCount,
    hasSelection,
  };
};
