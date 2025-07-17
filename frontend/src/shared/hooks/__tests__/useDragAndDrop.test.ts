/**
 * useDragAndDrop Hook Tests
 * 
 * Tests for the unified drag and drop hook to ensure it works correctly
 * across different components and use cases.
 */

import { renderHook, act } from '@testing-library/react';
import { useDragAndDrop } from '../useDragAndDrop';

// Mock data
interface TestItem {
  id: string;
  name: string;
}

const mockItems: TestItem[] = [
  { id: '1', name: 'Item 1' },
  { id: '2', name: 'Item 2' },
  { id: '3', name: 'Item 3' }
];

const mockConfig = {
  items: mockItems,
  getItemId: (item: TestItem) => item.id,
  onDragStart: jest.fn(),
  onDragEnd: jest.fn(),
  onDrop: jest.fn(),
  onReorder: jest.fn(),
  onExternalDrop: jest.fn()
};

// Mock drag event
const createMockDragEvent = (type: string, dataTransfer?: Partial<DataTransfer>) => {
  const event = new Event(type) as any;
  event.dataTransfer = {
    setData: jest.fn(),
    getData: jest.fn(),
    setDragImage: jest.fn(),
    effectAllowed: 'move',
    dropEffect: 'move',
    types: [],
    files: [],
    ...dataTransfer
  };
  event.preventDefault = jest.fn();
  event.currentTarget = {
    cloneNode: jest.fn().mockReturnValue(document.createElement('div')),
    getBoundingClientRect: jest.fn().mockReturnValue({
      left: 0, top: 0, right: 100, bottom: 100
    })
  };
  event.clientX = 50;
  event.clientY = 50;
  return event;
};

describe('useDragAndDrop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock document.body methods
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    document.body.contains = jest.fn().mockReturnValue(true);
  });

  describe('Initial State', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useDragAndDrop(mockConfig));

      expect(result.current.state.isDragging).toBe(false);
      expect(result.current.state.draggedItem).toBe(null);
      expect(result.current.state.draggedIndex).toBe(null);
      expect(result.current.state.dropTargetIndex).toBe(null);
      expect(result.current.state.isValidDropTarget).toBe(false);
      expect(result.current.state.isExternalDragActive).toBe(false);
      expect(result.current.state.externalDragType).toBe(null);
    });
  });

  describe('Drag Start', () => {
    it('handles drag start correctly', () => {
      const { result } = renderHook(() => useDragAndDrop(mockConfig));
      const dragEvent = createMockDragEvent('dragstart');

      act(() => {
        result.current.handleDragStart(mockItems[0], 0)(dragEvent);
      });

      expect(result.current.state.isDragging).toBe(true);
      expect(result.current.state.draggedItem).toBe(mockItems[0]);
      expect(result.current.state.draggedIndex).toBe(0);
      expect(mockConfig.onDragStart).toHaveBeenCalledWith(mockItems[0], 0);
      expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith('text/plain', '1');
    });

    it('prevents drag start when drag is disabled', () => {
      const disabledConfig = { ...mockConfig, dragEnabled: false };
      const { result } = renderHook(() => useDragAndDrop(disabledConfig));
      const dragEvent = createMockDragEvent('dragstart');

      act(() => {
        result.current.handleDragStart(mockItems[0], 0)(dragEvent);
      });

      expect(dragEvent.preventDefault).toHaveBeenCalled();
      expect(result.current.state.isDragging).toBe(false);
    });
  });

  describe('Drag End', () => {
    it('handles drag end correctly', () => {
      const { result } = renderHook(() => useDragAndDrop(mockConfig));
      const dragEvent = createMockDragEvent('dragend');

      // Start drag first
      act(() => {
        result.current.handleDragStart(mockItems[0], 0)(createMockDragEvent('dragstart'));
      });

      // End drag
      act(() => {
        result.current.handleDragEnd(mockItems[0], 0)(dragEvent);
      });

      expect(result.current.state.isDragging).toBe(false);
      expect(result.current.state.draggedItem).toBe(null);
      expect(result.current.state.draggedIndex).toBe(null);
      expect(mockConfig.onDragEnd).toHaveBeenCalledWith(mockItems[0], 0);
    });
  });

  describe('Drag Over', () => {
    it('handles drag over correctly', () => {
      const { result } = renderHook(() => useDragAndDrop(mockConfig));
      const dragEvent = createMockDragEvent('dragover');

      act(() => {
        result.current.handleDragOver(1)(dragEvent);
      });

      expect(dragEvent.preventDefault).toHaveBeenCalled();
      expect(result.current.state.dropTargetIndex).toBe(1);
      expect(result.current.state.isValidDropTarget).toBe(true);
    });

    it('does not handle drag over when drop is disabled', () => {
      const disabledConfig = { ...mockConfig, dropEnabled: false };
      const { result } = renderHook(() => useDragAndDrop(disabledConfig));
      const dragEvent = createMockDragEvent('dragover');

      act(() => {
        result.current.handleDragOver(1)(dragEvent);
      });

      expect(dragEvent.preventDefault).not.toHaveBeenCalled();
      expect(result.current.state.dropTargetIndex).toBe(null);
    });
  });

  describe('Drop', () => {
    it('handles internal drop correctly', () => {
      const { result } = renderHook(() => useDragAndDrop(mockConfig));
      const dropEvent = createMockDragEvent('drop');

      // Start drag first
      act(() => {
        result.current.handleDragStart(mockItems[0], 0)(createMockDragEvent('dragstart'));
      });

      // Drop
      act(() => {
        result.current.handleDrop(2)(dropEvent);
      });

      expect(dropEvent.preventDefault).toHaveBeenCalled();
      expect(mockConfig.onDrop).toHaveBeenCalledWith(mockItems[0], 2, 0);
      expect(result.current.state.isDragging).toBe(false);
    });

    it('calls onReorder when no custom drop handler provided', () => {
      const configWithoutDrop = { ...mockConfig, onDrop: undefined };
      const { result } = renderHook(() => useDragAndDrop(configWithoutDrop));
      const dropEvent = createMockDragEvent('drop');

      // Start drag first
      act(() => {
        result.current.handleDragStart(mockItems[0], 0)(createMockDragEvent('dragstart'));
      });

      // Drop
      act(() => {
        result.current.handleDrop(2)(dropEvent);
      });

      expect(mockConfig.onReorder).toHaveBeenCalledWith([
        mockItems[1], // Item 2
        mockItems[2], // Item 3
        mockItems[0]  // Item 1 moved to end
      ]);
    });
  });

  describe('External Drag and Drop', () => {
    it('handles external drag enter correctly', () => {
      const { result } = renderHook(() => useDragAndDrop(mockConfig));
      const dragEvent = createMockDragEvent('dragenter', {
        types: ['Files']
      });

      act(() => {
        result.current.handleExternalDragEnter(dragEvent);
      });

      expect(result.current.state.isExternalDragActive).toBe(true);
      expect(result.current.state.externalDragType).toBe('files');
    });

    it('handles external drop correctly', () => {
      const { result } = renderHook(() => useDragAndDrop(mockConfig));
      const mockFiles = [new File([''], 'test.jpg')] as any;
      const dropEvent = createMockDragEvent('drop', {
        files: mockFiles
      });

      act(() => {
        result.current.handleExternalDrop(dropEvent);
      });

      expect(mockConfig.onExternalDrop).toHaveBeenCalledWith(mockFiles, undefined);
      expect(result.current.state.isExternalDragActive).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    it('returns correct drag item classes', () => {
      const { result } = renderHook(() => useDragAndDrop(mockConfig));

      // Start drag
      act(() => {
        result.current.handleDragStart(mockItems[0], 0)(createMockDragEvent('dragstart'));
      });

      const classes = result.current.getDragItemClasses(mockItems[0], 0);
      expect(classes).toBe('dragging');

      const otherClasses = result.current.getDragItemClasses(mockItems[1], 1);
      expect(otherClasses).toBe('');
    });

    it('returns correct drop target classes', () => {
      const { result } = renderHook(() => useDragAndDrop(mockConfig));

      // Set drop target
      act(() => {
        result.current.handleDragOver(1)(createMockDragEvent('dragover'));
      });

      const classes = result.current.getDropTargetClasses(1);
      expect(classes).toBe('drop-target');

      const otherClasses = result.current.getDropTargetClasses(0);
      expect(otherClasses).toBe('');
    });

    it('resets drag state correctly', () => {
      const { result } = renderHook(() => useDragAndDrop(mockConfig));

      // Start drag
      act(() => {
        result.current.handleDragStart(mockItems[0], 0)(createMockDragEvent('dragstart'));
      });

      expect(result.current.state.isDragging).toBe(true);

      // Reset
      act(() => {
        result.current.resetDragState();
      });

      expect(result.current.state.isDragging).toBe(false);
      expect(result.current.state.draggedItem).toBe(null);
      expect(result.current.state.draggedIndex).toBe(null);
    });
  });

  describe('Configuration Options', () => {
    it('uses custom class names', () => {
      const customConfig = {
        ...mockConfig,
        dragClassName: 'custom-dragging',
        dropTargetClassName: 'custom-drop-target'
      };

      const { result } = renderHook(() => useDragAndDrop(customConfig));

      // Start drag
      act(() => {
        result.current.handleDragStart(mockItems[0], 0)(createMockDragEvent('dragstart'));
      });

      // Set drop target
      act(() => {
        result.current.handleDragOver(1)(createMockDragEvent('dragover'));
      });

      expect(result.current.getDragItemClasses(mockItems[0], 0)).toBe('custom-dragging');
      expect(result.current.getDropTargetClasses(1)).toBe('custom-drop-target');
    });
  });
});
