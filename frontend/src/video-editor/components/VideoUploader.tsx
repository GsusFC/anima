import React, { useMemo } from 'react';
import { useVideoEditorContext } from '../context/VideoEditorContext';
import { showToast } from './Toast';
import {
  DropZone,
  MediaThumbnail,
  UploadConfig,
  MediaEventHandlers
} from '../../shared/components/Media';
import { useMediaUpload } from '../../shared/hooks';

const VideoUploader: React.FC = () => {
  const { uploadVideo, isUploading, project } = useVideoEditorContext();

  // Upload configuration for videos
  const uploadConfig: UploadConfig = {
    accept: ['.mp4', '.mov', '.webm', '.avi', '.mkv', 'video/*'],
    multiple: false,
    maxSize: 500 * 1024 * 1024, // 500MB
    autoUpload: false, // We handle upload manually
  };

  // Custom validator for video files
  const videoValidator = (file: File): boolean | string => {
    const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska'];
    const isValidType = VIDEO_MIME_TYPES.includes(file.type) ||
                       /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);

    if (!isValidType) {
      return 'Please select a valid video file (MP4, MOV, WebM, AVI, MKV)';
    }

    return true;
  };

  // Media upload hook
  const { uploadFiles } = useMediaUpload({
    config: uploadConfig,
    validators: [videoValidator],
    onSuccess: async (items) => {
      if (items.length > 0) {
        await uploadVideo(items[0].file);
      }
    },
    onError: (errors) => {
      errors.forEach(error => {
        showToast(error.error, 'warning');
      });
    },
  });

  // Convert video to MediaItem format for display
  const videoMediaItem = useMemo(() => {
    if (!project.video) return null;

    return {
      id: 'current-video',
      file: project.video.file,
      name: project.video.file.name,
      type: 'video' as const,
      size: project.video.file.size,
      duration: project.video.duration,
      dimensions: {
        width: project.video.width,
        height: project.video.height,
      },
      thumbnails: project.video.thumbnails || [],
      preview: project.video.thumbnails?.[0] || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }, [project.video]);

  // Event handlers
  const handlers: MediaEventHandlers = {
    onUpload: async (files) => {
      await uploadFiles(files);
    },
  };

  return (
    <div className="h-full flex flex-col p-5">
      {!project.video ? (
        /* Upload Area */
        <div className="flex-1">
          <DropZone
            config={uploadConfig}
            handlers={handlers}
            loading={isUploading}
            className="h-full"
            style={{
              minHeight: '200px',
              backgroundColor: '#1a1a1b',
              borderColor: '#343536',
            }}
          >
          </DropZone>
        </div>
      ) : (
        /* Video Info Display */
        <div className="panel p-5">
          <div className="flex items-start gap-4 mb-4">
            {/* Video Thumbnail */}
            <div className="flex-shrink-0">
              <MediaThumbnail
                item={videoMediaItem!}
                size="large"
                showDuration={true}
                showType={true}
              />
            </div>

            {/* Video Info */}
            <div className="flex-1 min-w-0">
              <p className="m-0 text-sm text-dark-300 font-bold mb-1 font-mono truncate">
                {project.video.file.name}
              </p>
              <div className="text-xs text-dark-400 font-mono space-y-1">
                <div>Duration: {project.video.duration.toFixed(1)}s</div>
                <div>Resolution: {project.video.width}×{project.video.height}</div>
                <div>Size: {(project.video.file.size / (1024 * 1024)).toFixed(1)}MB</div>
                {project.video.fps && (
                  <div>FPS: {project.video.fps}</div>
                )}
              </div>
            </div>
          </div>

          <DropZone
            config={uploadConfig}
            handlers={handlers}
            loading={isUploading}
            className="h-12"
            style={{
              minHeight: '48px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderColor: '#22c55e',
            }}
          >
          </DropZone>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
