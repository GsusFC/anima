// Unified Media Types for AnimaGen
// Provides consistent type definitions across all media components

export type MediaType = 'image' | 'video';

export interface BaseMediaItem {
  id: string;
  file: File;
  name: string;
  type: MediaType;
  size: number;
  preview?: string;
  uploadedInfo?: UploadedInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageMediaItem extends BaseMediaItem {
  type: 'image';
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface VideoMediaItem extends BaseMediaItem {
  type: 'video';
  duration: number;
  dimensions: {
    width: number;
    height: number;
  };
  fps?: number;
  thumbnails: string[];
  metadata?: VideoMetadata;
}

export type MediaItem = ImageMediaItem | VideoMediaItem;

export interface UploadedInfo {
  filename: string;
  path: string;
  sessionId: string;
  uploadedAt: Date;
}

export interface VideoMetadata {
  duration: number;
  fps: number;
  width: number;
  height: number;
  bitrate: number;
  codec: string;
  hasAudio: boolean;
}

// Selection and interaction types
export interface MediaSelection {
  selectedIds: Set<string>;
  lastSelectedId?: string;
  selectionMode: 'single' | 'multiple';
}

export interface MediaAction {
  type: 'add' | 'remove' | 'select' | 'deselect' | 'reorder' | 'upload';
  payload?: any;
}

// Drag and drop types
export interface DragDropState {
  isDragging: boolean;
  draggedItem?: MediaItem;
  dropTarget?: string;
  dragOverIndex?: number;
}

// Component configuration types
export interface MediaItemConfig {
  showActions?: boolean;
  showMetadata?: boolean;
  showSelection?: boolean;
  size?: 'small' | 'medium' | 'large';
  layout?: 'list' | 'grid' | 'timeline';
  interactive?: boolean;
}

export interface MediaListConfig extends MediaItemConfig {
  virtualized?: boolean;
  itemHeight?: number;
  overscan?: number;
  sortable?: boolean;
  selectable?: boolean;
}

// Theme and styling types
export interface MediaTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
    success: string;
    warning: string;
    error: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

// Event handler types
export interface MediaEventHandlers {
  onSelect?: (item: MediaItem) => void;
  onDeselect?: (item: MediaItem) => void;
  onRemove?: (item: MediaItem) => void;
  onAdd?: (item: MediaItem) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onUpload?: (files: File[]) => Promise<void>;
  onPreview?: (item: MediaItem) => void;
  onEdit?: (item: MediaItem) => void;
}

// Upload configuration
export interface UploadConfig {
  accept: string[];
  multiple: boolean;
  maxSize?: number;
  maxFiles?: number;
  autoUpload?: boolean;
}

// Virtualization types
export interface VirtualizationConfig {
  enabled: boolean;
  itemHeight: number;
  overscan?: number;
  threshold?: number;
}

// Filter and search types
export interface MediaFilter {
  type?: MediaType[];
  name?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sizeRange?: {
    min: number;
    max: number;
  };
}

export interface MediaSort {
  field: 'name' | 'size' | 'createdAt' | 'updatedAt' | 'type';
  direction: 'asc' | 'desc';
}

// Component props interfaces
export interface MediaItemProps {
  item: MediaItem;
  config?: MediaItemConfig;
  theme?: Partial<MediaTheme>;
  handlers?: MediaEventHandlers;
  selected?: boolean;
  dragging?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface MediaListProps {
  items: MediaItem[];
  config?: MediaListConfig;
  theme?: Partial<MediaTheme>;
  handlers?: MediaEventHandlers;
  selection?: MediaSelection;
  filter?: MediaFilter;
  sort?: MediaSort;
  loading?: boolean;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface MediaUploaderProps {
  config: UploadConfig;
  theme?: Partial<MediaTheme>;
  handlers: Pick<MediaEventHandlers, 'onUpload'>;
  loading?: boolean;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Utility types
export type MediaItemRenderer = (item: MediaItem, config: MediaItemConfig) => React.ReactNode;
export type MediaActionHandler<T = any> = (action: MediaAction) => T;
export type MediaValidator = (file: File) => boolean | string;

// Context types
export interface MediaContextValue {
  items: MediaItem[];
  selection: MediaSelection;
  dragDrop: DragDropState;
  config: MediaListConfig;
  theme: MediaTheme;
  handlers: MediaEventHandlers;
  actions: {
    addItems: (items: MediaItem[]) => void;
    removeItems: (ids: string[]) => void;
    selectItems: (ids: string[]) => void;
    deselectItems: (ids: string[]) => void;
    reorderItems: (fromIndex: number, toIndex: number) => void;
    updateConfig: (config: Partial<MediaListConfig>) => void;
    updateTheme: (theme: Partial<MediaTheme>) => void;
  };
}
