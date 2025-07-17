// Media Hooks - Unified export
export { useMediaSelection } from './useMediaSelection';
export { useMediaDragDrop } from './useMediaDragDrop';
export { useMediaActions } from './useMediaActions';
export { useMediaUpload } from './useMediaUpload';

// Base Hooks - New unified hooks
export { useBaseMediaEditor } from './useBaseMediaEditor';
export { useDragAndDrop } from './useDragAndDrop';
export { useScrollNavigation } from './useScrollNavigation';

// Re-export hook-related types
export type {
  MediaSelection,
  DragDropState,
  MediaAction,
  MediaValidator,
} from '../types/media.types';

// Re-export new unified hook types
export type {
  BaseMediaEditorConfig,
  BaseMediaEditorReturn
} from './useBaseMediaEditor';

export type {
  DragDropConfig,
  DragDropReturn
} from './useDragAndDrop';

export type {
  ScrollNavigationConfig,
  ScrollNavigationState,
  ScrollNavigationReturn
} from './useScrollNavigation';
