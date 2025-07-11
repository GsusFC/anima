import React, { useMemo, useCallback, useState } from 'react';
import {
  MediaItem as MediaItemType,
  MediaListConfig,
  MediaEventHandlers,
  MediaSelection,
  MediaFilter,
  MediaSort,
  MediaTheme
} from '../../types/media.types';
import { defaultMediaTheme, mediaLayouts } from '../../theme/mediaTheme';
import MediaItem from './MediaItem';

interface MediaListProps {
  items: MediaItemType[];
  config?: MediaListConfig;
  handlers?: MediaEventHandlers;
  selection?: MediaSelection;
  filter?: MediaFilter;
  sort?: MediaSort;
  loading?: boolean;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
  theme?: Partial<MediaTheme>;
}

export const MediaList: React.FC<MediaListProps> = ({
  items,
  config = {},
  handlers = {},
  selection,
  filter,
  sort,
  loading = false,
  error,
  className = '',
  style = {},
  theme = {},
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const {
    layout = 'list',
    size = 'medium',

    sortable = false,
    selectable = false,
    showActions = true,
    showMetadata = true,
    showSelection = false,
  } = config;

  const mergedTheme = { ...defaultMediaTheme, ...theme };
  const layoutConfig = mediaLayouts[layout];

  // Filter and sort items
  const processedItems = useMemo(() => {
    let result = [...items];

    // Apply filter
    if (filter) {
      result = result.filter(item => {
        if (filter.type && !filter.type.includes(item.type)) return false;
        if (filter.name && !item.name.toLowerCase().includes(filter.name.toLowerCase())) return false;
        if (filter.sizeRange) {
          if (item.size < filter.sizeRange.min || item.size > filter.sizeRange.max) return false;
        }
        if (filter.dateRange) {
          if (item.createdAt < filter.dateRange.start || item.createdAt > filter.dateRange.end) return false;
        }
        return true;
      });
    }

    // Apply sort
    if (sort) {
      result.sort((a, b) => {
        let aValue: any = a[sort.field];
        let bValue: any = b[sort.field];

        if (sort.field === 'createdAt' || sort.field === 'updatedAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sort.direction === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [items, filter, sort]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    if (!sortable) return;
    
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  }, [sortable]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (!sortable) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, [sortable]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    if (!sortable) return;
    
    e.preventDefault();
    const draggedItemId = e.dataTransfer.getData('text/plain');
    
    if (!draggedItemId || !handlers.onReorder) return;

    const dragIndex = processedItems.findIndex(item => item.id === draggedItemId);
    if (dragIndex === -1 || dragIndex === dropIndex) return;

    handlers.onReorder(dragIndex, dropIndex);
    setDraggedItem(null);
    setDragOverIndex(null);
  }, [sortable, processedItems, handlers]);

  const containerStyle: React.CSSProperties = useMemo(() => ({
    display: 'flex',
    flexDirection: layoutConfig.direction,
    gap: layoutConfig.gap,
    padding: mergedTheme.spacing.md,
    backgroundColor: mergedTheme.colors.background,
    borderRadius: mergedTheme.borderRadius.md,
    minHeight: '200px',
    maxHeight: '100%',
    position: 'relative',
    overflow: 'hidden', // Prevent container overflow
    ...style,
  }), [layoutConfig, theme, style]);

  const listStyle: React.CSSProperties = {
    display: layout === 'grid' ? 'grid' : 'flex',
    flexDirection: layout === 'list' ? 'column' : 'row',
    gap: layoutConfig.gap,
    width: '100%',
    height: '100%',
    // Scroll handling based on layout
    ...(layout === 'list' && {
      overflowY: 'auto',
      overflowX: 'hidden',
    }),
    ...(layout === 'grid' && {
      gridTemplateColumns: `repeat(auto-fill, minmax(${(layoutConfig as any).minItemWidth || '200px'}, 1fr))`,
      overflowY: 'auto',
      overflowX: 'hidden',
    }),
    ...(layout === 'timeline' && {
      overflowX: 'auto',
      overflowY: 'hidden',
      paddingBottom: mergedTheme.spacing.sm,
    }),
    // Custom scrollbar styling
    scrollbarWidth: 'thin',
    scrollbarColor: `${mergedTheme.colors.border} transparent`,
  };

  const emptyStateStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: mergedTheme.spacing.xl,
    color: mergedTheme.colors.textSecondary,
    textAlign: 'center',
    fontFamily: '"Space Mono", monospace',
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: mergedTheme.spacing.xl,
    color: mergedTheme.colors.textSecondary,
    fontFamily: '"Space Mono", monospace',
  };

  const errorStyle: React.CSSProperties = {
    color: mergedTheme.colors.error,
    backgroundColor: `${mergedTheme.colors.error}15`,
    border: `1px solid ${mergedTheme.colors.error}`,
    borderRadius: mergedTheme.borderRadius.md,
    padding: mergedTheme.spacing.md,
    margin: mergedTheme.spacing.md,
    fontSize: '0.875rem',
    fontFamily: '"Space Mono", monospace',
  };

  if (loading) {
    return (
      <div className={`media-list ${className}`} style={containerStyle}>
        <div style={loadingStyle}>
          <div
            style={{
              width: '24px',
              height: '24px',
              border: `2px solid ${mergedTheme.colors.border}`,
              borderTop: `2px solid ${mergedTheme.colors.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginRight: mergedTheme.spacing.sm,
            }}
          />
          Loading media...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`media-list ${className}`} style={containerStyle}>
        <div style={errorStyle}>
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (processedItems.length === 0) {
    return (
      <div className={`media-list ${className}`} style={containerStyle}>
        <div style={emptyStateStyle}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            style={{ marginBottom: mergedTheme.spacing.md, opacity: 0.5 }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>
            No media files
          </p>
          <p style={{ margin: `${mergedTheme.spacing.xs} 0 0 0`, fontSize: '0.875rem', opacity: 0.8 }}>
            {filter ? 'No files match your filter criteria' : 'Upload some files to get started'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`media-list ${className}`} style={containerStyle}>
      <div style={listStyle}>
        {processedItems.map((item, index) => (
          <div
            key={item.id}
            draggable={sortable}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            style={{
              ...(layout === 'timeline' && { flexShrink: 0, width: layoutConfig.itemWidth }),
            }}
          >
            <MediaItem
              item={item}
              config={{
                size,
                layout,
                showActions,
                showMetadata,
                showSelection: selectable || showSelection,
                interactive: true,
              }}
              handlers={handlers}
              selected={selection?.selectedIds.has(item.id)}
              dragging={draggedItem === item.id}
              draggedOver={dragOverIndex === index}
            />
          </div>
        ))}
      </div>

      {/* CSS for animations and custom scrollbar */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Custom scrollbar styles */
        .media-list ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .media-list ::-webkit-scrollbar-track {
          background: transparent;
        }

        .media-list ::-webkit-scrollbar-thumb {
          background: ${mergedTheme.colors.border};
          border-radius: 3px;
        }

        .media-list ::-webkit-scrollbar-thumb:hover {
          background: ${mergedTheme.colors.primary};
        }

        .media-list ::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default MediaList;
