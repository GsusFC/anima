/**
 * Unified Types for AnimaGen
 * 
 * Centralized type definitions shared between slideshow and video-editor applications.
 * Eliminates type duplication and ensures consistency across the codebase.
 */

// Base media types
export type MediaType = 'image' | 'video' | 'audio';

// Base file information
export interface BaseFile {
  id: string;
  name: string;
  file: File;
  size: number;
  type: MediaType;
  createdAt: Date;
  updatedAt: Date;
}

// Base uploaded information
export interface BaseUploadedInfo {
  sessionId: string;
  uploadedAt: Date;
  url?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

// Base timeline item interface
export interface BaseTimelineItem {
  id: string;
  position: number;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

// Base transition configuration
export interface BaseTransition {
  type: string;
  duration: number;
  easing: string;
  properties?: Record<string, any>;
}

// Base resolution configuration
export interface BaseResolution {
  width: number;
  height: number;
  preset: 'original' | '480p' | '720p' | '1080p' | '4k' | 'custom';
}

// Base export settings
export interface BaseExportSettings {
  format: string;
  quality: string;
  fps?: number;
  resolution?: BaseResolution;
  bitrate?: number | string;
  filename?: string;
}

// Base export state
export interface BaseExportState {
  isExporting: boolean;
  progress: number;
  error: string | null;
  isCompleted: boolean;
  downloadUrl?: string;
  currentStep?: string;
  lastResult?: any;
}

// Base preview state
export interface BasePreviewState {
  url: string | null;
  isGenerating: boolean;
  error: string | null;
  lastGenerated?: Date;
}

// Base project interface
export interface BaseProject<TItem extends BaseTimelineItem, TSettings extends BaseExportSettings> {
  id: string;
  name: string;
  timeline: TItem[];
  exportSettings: TSettings;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// Base context interface
export interface BaseContext<
  TProject extends BaseProject<any, any>,
  TExportState extends BaseExportState,
  TPreviewState extends BasePreviewState
> {
  // Project state
  project: TProject;
  
  // Export state
  export: TExportState;
  
  // Preview state
  preview: TPreviewState;
  
  // Loading states
  isUploading: boolean;
  isLoading: boolean;
  
  // Computed properties
  hasContent: boolean;
  
  // Core actions
  updateProject: (updates: Partial<TProject>) => void;
  updateExportSettings: (updates: Partial<TProject['exportSettings']>) => void;
  updateExportState: (updates: Partial<TExportState>) => void;
  updatePreviewState: (updates: Partial<TPreviewState>) => void;
  
  // Timeline actions
  updateTimelineItem: (itemId: string, updates: any) => void;
  removeFromTimeline: (itemId: string) => void;
  reorderTimeline: (newTimeline: any[]) => void;
  
  // Media actions
  generatePreview: () => Promise<void>;
  exportProject: () => Promise<void>;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  canExport: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  messages: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    field?: string;
    code?: string;
  }>;
}

// Upload configuration
export interface BaseUploadConfig {
  accept: string[];
  multiple: boolean;
  maxSize: number;
  maxFiles?: number;
  autoUpload: boolean;
  showEmptyState?: boolean;
  validateOnSelect?: boolean;
}

// Media list configuration
export interface BaseMediaListConfig {
  layout: 'grid' | 'list';
  size: 'small' | 'medium' | 'large';
  showActions: boolean;
  showMetadata: boolean;
  showSelection: boolean;
  sortable: boolean;
  selectable: boolean;
  itemsPerPage?: number;
}

// Theme configuration
export interface BaseTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
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
}

// Event handler types
export interface BaseEventHandlers<TItem> {
  onUpload?: (files: File[]) => Promise<void>;
  onAdd?: (item: TItem) => void;
  onRemove?: (item: TItem) => void;
  onEdit?: (item: TItem) => void;
  onPreview?: (item: TItem) => void;
  onSelect?: (item: TItem) => void;
  onReorder?: (items: TItem[]) => void;
}

// Error types
export interface BaseError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// API response types
export interface BaseAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: BaseError;
  metadata?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

// Pagination types
export interface BasePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Search/Filter types
export interface BaseFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

export interface BaseSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface BaseQuery {
  filters?: BaseFilter[];
  sort?: BaseSort[];
  pagination?: Partial<BasePagination>;
  search?: string;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};

export type WithId<T> = T & {
  id: string;
};

// Mode-specific type helpers
export type ModeSpecific<T> = {
  slideshow: T;
  'video-editor': T;
};

export type GetModeType<T extends ModeSpecific<any>, M extends keyof T> = T[M];

// Type guards
export const isBaseFile = (obj: any): obj is BaseFile => {
  return obj && typeof obj === 'object' && 
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    obj.file instanceof File &&
    typeof obj.size === 'number' &&
    ['image', 'video', 'audio'].includes(obj.type);
};

export const isBaseTimelineItem = (obj: any): obj is BaseTimelineItem => {
  return obj && typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.position === 'number' &&
    typeof obj.duration === 'number' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date;
};

export const isValidationResult = (obj: any): obj is ValidationResult => {
  return obj && typeof obj === 'object' &&
    typeof obj.isValid === 'boolean' &&
    typeof obj.canExport === 'boolean' &&
    Array.isArray(obj.messages);
};
