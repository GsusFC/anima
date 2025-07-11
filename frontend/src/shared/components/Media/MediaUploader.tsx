import React, { useMemo } from 'react';
import { 
  MediaItem as MediaItemType, 
  UploadConfig, 
  MediaEventHandlers,
  MediaListConfig,
  MediaTheme 
} from '../../types/media.types';
import { defaultMediaTheme } from '../../theme/mediaTheme';
import { useMediaUpload } from '../../hooks';
import DropZone from './DropZone';
import MediaList from './MediaList';

interface MediaUploaderProps {
  // Configuration
  config: UploadConfig;
  listConfig?: MediaListConfig;
  theme?: Partial<MediaTheme>;
  
  // Data
  items?: MediaItemType[];
  
  // Event handlers
  onUpload?: (items: MediaItemType[]) => void;
  onError?: (errors: any[]) => void;
  onItemAction?: (action: string, item: MediaItemType) => void;
  
  // UI customization
  showList?: boolean;
  showDropZone?: boolean;
  
  // Layout
  layout?: 'vertical' | 'horizontal';
  className?: string;
  style?: React.CSSProperties;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  config,
  listConfig = {},
  theme = {},
  items = [],
  onUpload,
  onError,
  onItemAction,
  showList = true,
  showDropZone = true,
  layout = 'vertical',
  className = '',
  style = {},
}) => {
  const mergedTheme = { ...defaultMediaTheme, ...theme };

  // Media upload hook
  const { 
    uploadFiles, 
    isUploading, 
    errors: uploadErrors,
    clearErrors 
  } = useMediaUpload({
    config,
    onSuccess: (uploadedItems) => {
      onUpload?.(uploadedItems);
      clearErrors();
    },
    onError: (errors) => {
      onError?.(errors);
    },
  });

  // Event handlers for media components
  const handlers: MediaEventHandlers = {
    onUpload: async (files) => {
      await uploadFiles(files);
    },
    onAdd: (item) => {
      onItemAction?.('add', item);
    },
    onRemove: (item) => {
      onItemAction?.('remove', item);
    },
    onPreview: (item) => {
      onItemAction?.('preview', item);
    },
    onEdit: (item) => {
      onItemAction?.('edit', item);
    },
  };

  // Default list configuration
  const defaultListConfig: MediaListConfig = {
    layout: 'list',
    size: 'medium',
    showActions: true,
    showMetadata: true,
    showSelection: false,
    sortable: false,
    selectable: false,
    ...listConfig,
  };

  const containerStyle: React.CSSProperties = useMemo(() => ({
    display: 'flex',
    flexDirection: layout === 'vertical' ? 'column' : 'row',
    gap: mergedTheme.spacing.md,
    height: '100%',
    ...style,
  }), [layout, mergedTheme, style]);

  const dropZoneStyle: React.CSSProperties = {
    ...(layout === 'horizontal' && { 
      width: '300px',
      flexShrink: 0,
    }),
    ...(layout === 'vertical' && showList && {
      flexShrink: 0,
    }),
  };

  const listStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
  };

  return (
    <div 
      className={`media-uploader ${className}`}
      style={containerStyle}
    >
      {/* Drop Zone */}
      {showDropZone && (
        <div style={dropZoneStyle}>
          <DropZone
            config={config}
            handlers={handlers}
            loading={isUploading}
            error={uploadErrors.length > 0 ? uploadErrors[0]?.error : undefined}
          >
            <div className="flex flex-col items-center gap-3">
              {/* Upload Icon */}
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ opacity: 0.6 }}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>


            </div>
          </DropZone>
        </div>
      )}

      {/* Media List */}
      {showList && items.length > 0 && (
        <div style={listStyle}>
          <MediaList
            items={items}
            config={defaultListConfig}
            handlers={handlers}
            loading={isUploading}
            theme={theme}
          />
        </div>
      )}

      {/* Empty State for List */}
      {showList && items.length === 0 && !showDropZone && (
        <div style={{
          ...listStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: mergedTheme.colors.textSecondary,
          fontFamily: '"Space Mono", monospace',
        }}>
          <div className="text-center">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              style={{ 
                marginBottom: mergedTheme.spacing.md, 
                opacity: 0.5,
                margin: '0 auto',
              }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>
              No media files
            </p>
            <p style={{ 
              margin: `${mergedTheme.spacing.xs} 0 0 0`, 
              fontSize: '0.875rem', 
              opacity: 0.8 
            }}>
              Upload some files to get started
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {uploadErrors.length > 0 && (
        <div style={{
          padding: mergedTheme.spacing.md,
          backgroundColor: `${mergedTheme.colors.error}15`,
          border: `1px solid ${mergedTheme.colors.error}`,
          borderRadius: mergedTheme.borderRadius.md,
          color: mergedTheme.colors.error,
          fontSize: '0.875rem',
          fontFamily: '"Space Mono", monospace',
        }}>
          <strong>Upload Errors:</strong>
          <ul style={{ margin: `${mergedTheme.spacing.xs} 0 0 0`, paddingLeft: mergedTheme.spacing.lg }}>
            {uploadErrors.map((error, index) => (
              <li key={index}>{error.file.name}: {error.error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
