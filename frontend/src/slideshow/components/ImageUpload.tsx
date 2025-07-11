import React, { useMemo } from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';
import {
  MediaList,
  DropZone,
  UploadConfig,
  MediaEventHandlers,
  MediaListConfig,
  slideshowTheme
} from '../../shared/components/Media';
import type { MediaItem as MediaItemType } from '../../shared/types/media.types';
import { useMediaUpload } from '../../shared/hooks';

const ImageUpload: React.FC = () => {
    const {
        project,
        uploadImages,
        addToTimeline,
        removeImage,
    } = useSlideshowContext();

    // Convert slideshow images to MediaItem format
    const mediaItems: MediaItemType[] = useMemo(() => {
        return project.images.map(image => ({
            id: image.id,
            file: image.file,
            name: image.name,
            type: 'image' as const,
            size: image.file.size,
            preview: image.preview,
            uploadedInfo: image.uploadedInfo ? {
                sessionId: '',
                uploadedAt: new Date(),
                ...image.uploadedInfo
            } : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
    }, [project.images]);

    // Upload configuration
    const uploadConfig: UploadConfig = {
        accept: ['image/*'],
        multiple: true,
        maxSize: 10 * 1024 * 1024, // 10MB
        autoUpload: false, // We handle upload manually
    };

    // Media upload hook
    const { uploadFiles, isUploading } = useMediaUpload({
        config: uploadConfig,
        onSuccess: (items) => {
            // Convert MediaItems back to slideshow format and upload
            const files = items.map(item => item.file);
            uploadImages(files);
        },
        onError: (errors) => {
            console.error('Upload validation failed:', errors);
        },
    });

    // Media list configuration
    const listConfig: MediaListConfig = {
        layout: 'list',
        size: 'medium',
        showActions: false, // Hide actions since click adds to timeline
        showMetadata: false, // Clean look without metadata
        showSelection: false,
        sortable: false,
        selectable: false,
    };

    // Event handlers
    const handlers: MediaEventHandlers = {
        onAdd: (item) => {
            addToTimeline(item.id);
        },
        onRemove: (item) => {
            removeImage(item.id);
        },
        onUpload: async (files) => {
            await uploadFiles(files);
        },
    };



    return (
        <div className="h-full bg-dark-950 flex flex-col p-3">
            {/* Drop Zone */}
            <div className="flex-shrink-0 mb-3">
                <DropZone
                    config={uploadConfig}
                    handlers={handlers}
                    loading={isUploading}
                    className="h-15"
                    style={{
                        minHeight: '60px',
                        backgroundColor: 'transparent',
                        borderColor: '#343536',
                    }}
                >
                </DropZone>
            </div>

            {/* Media List */}
            <div className="flex-1 min-h-0">
                <MediaList
                    items={mediaItems}
                    config={listConfig}
                    handlers={handlers}
                    loading={isUploading}
                    theme={slideshowTheme}
                    className="h-full"
                    style={{
                        backgroundColor: 'transparent',
                        padding: 0,
                    }}
                />
            </div>

            {/* Quick Actions */}
            {mediaItems.length > 0 && (
                <div className="mt-3 flex gap-2 flex-shrink-0">
                    <button
                        onClick={() => {
                            mediaItems.forEach(item => addToTimeline(item.id));
                        }}
                        disabled={isUploading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '14px',
                            fontWeight: '600',
                            backgroundColor: 'rgba(236, 72, 153, 0.15)',
                            color: '#ec4899',
                            border: '1px solid #ec4899',
                            borderRadius: '3px',
                            cursor: isUploading ? 'not-allowed' : 'pointer',
                            fontFamily: '"Space Mono", monospace',
                            textTransform: 'uppercase',
                            opacity: isUploading ? 0.6 : 1,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isUploading) {
                                e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.25)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isUploading) {
                                e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.15)';
                            }
                        }}
                    >
                        ALL TO TIMELINE ({mediaItems.length})
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
