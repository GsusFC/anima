import React, { useMemo } from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';
import { slideshowTheme } from '../../shared/components/Media';
import BaseUpload from '../../shared/components/base/BaseUpload';
import type { MediaItem as MediaItemType, UploadConfig, MediaListConfig } from '../../shared/types/media.types';

const ImageUpload: React.FC = () => {
    const {
        project,
        uploadImages,
        addToTimeline,
        removeImage,
        isUploading
    } = useSlideshowContext();

    // Upload configuration
    const uploadConfig: UploadConfig = {
        accept: ['image/*'],
        multiple: true,
        maxSize: 10 * 1024 * 1024, // 10MB
        autoUpload: false,
        showEmptyState: true
    };

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

    // Convert slideshow image to MediaItem format
    const convertToMediaItem = (image: typeof project.images[0]): MediaItemType => ({
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
    });

    // Handle upload
    const handleUpload = async (files: File[]) => {
        await uploadImages(files);
    };

    // Handle item actions
    const handleItemAction = (action: string, item: typeof project.images[0]) => {
        switch (action) {
            case 'add':
                addToTimeline(item.id);
                break;
            case 'remove':
                removeImage(item.id);
                break;
            default:
                console.log(`Unhandled action: ${action}`);
        }
    };

    // Handle upload errors
    const handleUploadError = (errors: Array<{ file: File; error: string }>) => {
        errors.forEach(error => {
            console.error('Upload validation failed:', error.error, error.file.name);
        });
    };



    return (
        <BaseUpload
            mode="slideshow"
            items={project.images}
            uploadConfig={uploadConfig}
            listConfig={listConfig}
            theme={slideshowTheme}
            onUpload={handleUpload}
            onItemAction={handleItemAction}
            onError={handleUploadError}
            convertToMediaItem={convertToMediaItem}
            isUploading={isUploading}
            customContent={
                <div className="flex flex-col h-full">
                    <BaseUpload
                        mode="slideshow"
                        items={project.images}
                        uploadConfig={uploadConfig}
                        listConfig={listConfig}
                        theme={slideshowTheme}
                        onUpload={handleUpload}
                        onItemAction={handleItemAction}
                        onError={handleUploadError}
                        convertToMediaItem={convertToMediaItem}
                        isUploading={isUploading}
                        showDropZone={false}
                        className="flex-1"
                    />

                    {/* Quick Actions - Always visible at bottom */}
                    {project.images.length > 0 && (
                        <div className="flex gap-2 flex-shrink-0" style={{ marginTop: '8px' }}>
                            <button
                                onClick={() => {
                                    project.images.forEach(image => addToTimeline(image.id));
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
                                    letterSpacing: '0.5px',
                                    transition: 'all 0.2s ease',
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
                                ALL TO TIMELINE ({project.images.length})
                            </button>
                        </div>
                    )}
                </div>
            }
        />
    );
};

export default ImageUpload;
