import React, { useMemo } from 'react';
import { UnifiedUploadInterface, UnifiedUploadEmptyState } from '../unified';
import { MediaList } from '../Media/MediaList';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import type { 
  MediaItem, 
  UploadConfig, 
  MediaEventHandlers, 
  MediaListConfig,
  MediaTheme 
} from '../../types/media.types';

// Base upload configuration
export interface BaseUploadConfig extends UploadConfig {
  // Additional base-specific config
  showEmptyState?: boolean;
  emptyStateText?: string;
}

// Base upload props
export interface BaseUploadProps<TItem> {
  // Core props
  mode: 'slideshow' | 'video-editor';
  
  // Data
  items: TItem[];
  
  // Configuration
  uploadConfig: BaseUploadConfig;
  listConfig?: Partial<MediaListConfig>;
  theme?: Partial<MediaTheme>;
  
  // Handlers
  onUpload: (files: File[]) => Promise<void>;
  onItemAction?: (action: string, item: TItem) => void;
  onError?: (errors: Array<{ file: File; error: string }>) => void;
  
  // Item conversion
  convertToMediaItem: (item: TItem) => MediaItem;
  
  // Loading state
  isUploading?: boolean;
  
  // Layout
  layout?: 'vertical' | 'horizontal';
  showList?: boolean;
  showDropZone?: boolean;
  
  // Custom content
  customContent?: React.ReactNode;
  emptyStateContent?: React.ReactNode;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Base Upload Component
 * 
 * Unified foundation for upload functionality across slideshow and video-editor.
 * Eliminates code duplication between ImageUpload.tsx and VideoUploader.tsx.
 * 
 * Features:
 * - Generic item type support
 * - Unified drag & drop interface
 * - Configurable media list display
 * - Custom validation and error handling
 * - Mode-specific theming
 * - Flexible layout options
 */
export function BaseUpload<TItem>({
  mode,
  items,
  uploadConfig,
  listConfig = {},
  theme = {},
  onUpload,
  onItemAction,
  onError,
  convertToMediaItem,
  isUploading = false,
  layout = 'vertical',
  showList = true,
  showDropZone = true,
  customContent,
  emptyStateContent,
  className = '',
  style = {}
}: BaseUploadProps<TItem>) {

  // Convert items to MediaItem format for display
  const mediaItems: MediaItem[] = useMemo(() => {
    return items.map(convertToMediaItem);
  }, [items, convertToMediaItem]);

  // Media upload hook for validation and processing
  const { uploadFiles, errors: _uploadErrors, clearErrors } = useMediaUpload({
    config: uploadConfig,
    onSuccess: (uploadedItems) => {
      // Extract files from uploaded items and pass to parent handler
      const files = uploadedItems.map(item => item.file);
      onUpload(files);
      clearErrors();
    },
    onError: (errors) => {
      onError?.(errors);
    },
  });

  // Default list configuration
  const defaultListConfig: MediaListConfig = {
    layout: 'list',
    size: 'medium',
    showActions: true,
    showMetadata: true,
    showSelection: false,
    sortable: false,
    selectable: false,
    ...listConfig
  };

  // Event handlers
  const handlers: MediaEventHandlers = {
    onUpload: async (files) => {
      await uploadFiles(files);
    },
    onAdd: (item) => {
      onItemAction?.('add', items.find(i => convertToMediaItem(i).id === item.id)!);
    },
    onRemove: (item) => {
      onItemAction?.('remove', items.find(i => convertToMediaItem(i).id === item.id)!);
    },
    onPreview: (item) => {
      onItemAction?.('preview', items.find(i => convertToMediaItem(i).id === item.id)!);
    },
    onEdit: (item) => {
      onItemAction?.('edit', items.find(i => convertToMediaItem(i).id === item.id)!);
    }
  };

  // Determine if we should show empty state
  const shouldShowEmptyState = items.length === 0 && uploadConfig.showEmptyState !== false;

  // Get theme based on mode
  const getThemeForMode = (): Partial<MediaTheme> => {
    const baseTheme = {
      colors: {
        primary: mode === 'slideshow' ? '#ec4899' : '#3b82f6',
        secondary: '#6b7280',
        accent: mode === 'slideshow' ? '#ec4899' : '#3b82f6',
        background: '#0a0a0b',
        surface: '#1f2937',
        text: '#f3f4f6',
        textSecondary: '#9ca3af',
        border: '#374151',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      ...theme
    };
    return baseTheme;
  };

  const mergedTheme = getThemeForMode();

  // Render content based on state
  const renderContent = () => {
    if (customContent) {
      return customContent;
    }

    if (shouldShowEmptyState) {
      return emptyStateContent || <UnifiedUploadEmptyState mode={mode} />;
    }

    if (showList && mediaItems.length > 0) {
      return (
        <div className="flex-1 min-h-0">
          <MediaList
            items={mediaItems}
            config={defaultListConfig}
            handlers={handlers}
            loading={isUploading}
            theme={mergedTheme}
            mode={mode}
            className="h-full"
            style={{
              backgroundColor: 'transparent',
              padding: 0,
            }}
          />
        </div>
      );
    }

    return null;
  };

  // Layout classes
  const containerClasses = [
    'h-full',
    layout === 'horizontal' ? 'flex flex-row' : 'flex flex-col',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} style={style}>
      {showDropZone ? (
        <UnifiedUploadInterface
          mode={mode}
          config={uploadConfig}
          handlers={handlers}
          loading={isUploading}
        >
          {renderContent()}
        </UnifiedUploadInterface>
      ) : (
        renderContent()
      )}
    </div>
  );
}

export default BaseUpload;
