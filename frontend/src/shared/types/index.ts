// Shared Types Index
// Central export point for all shared type definitions.
// Use `export type` to ensure only type information is re-exported,
// satisfying the compiler when `isolatedModules` is enabled.

export type * from './media.types';
export type * from './export.types';
export type * from './validation.types';
export type * from './global.types';

// Export unified types with explicit naming to avoid conflicts
export type {
  BaseFile,
  BaseUploadedInfo,
  BaseTimelineItem,
  BaseTransition,
  BaseResolution,
  BaseExportSettings,
  BaseExportState,
  BasePreviewState,
  BaseProject,
  BaseContext,
  ValidationResult as UnifiedValidationResult,
  BaseUploadConfig,
  BaseMediaListConfig,
  BaseTheme,
  BaseEventHandlers,
  BaseError,
  BaseAPIResponse,
  BasePagination,
  BaseFilter,
  BaseSort,
  BaseQuery,
  MediaType as UnifiedMediaType
} from './unified.types';
