// Shared Types Index
// Central export point for all shared type definitions

export * from './media.types';
export * from './export.types';
export * from './validation.types';
export * from './global.types';

// Export unified types with explicit naming to avoid conflicts
export {
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
