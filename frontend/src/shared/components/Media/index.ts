// Media Components - Unified export
export { default as MediaItem } from './MediaItem';
export { default as MediaThumbnail } from './MediaThumbnail';
export { default as MediaList } from './MediaList';
export { default as DropZone } from './DropZone';
export { default as MediaUploader } from './MediaUploader';

// Re-export types for convenience
export type {
  MediaItem as MediaItemType,
  ImageMediaItem,
  VideoMediaItem,
  MediaItemConfig,
  MediaListConfig,
  MediaEventHandlers,
  MediaSelection,
  MediaFilter,
  MediaSort,
  UploadConfig,
  MediaTheme,
} from '../../types/media.types';

// Re-export theme utilities
export {
  defaultMediaTheme,
  slideshowTheme,
  videoEditorTheme,
  mediaSizes,
  mediaLayouts,
  mediaAnimations,
  getThemeValue,
  mergeThemes,
  createMediaStyles,
} from '../../theme/mediaTheme';
