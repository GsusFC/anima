import React, { useState, useRef } from 'react';
import { useVideoEditorContext } from '../context/VideoEditorContext';
import { showToast } from './Toast';

const VideoUploader: React.FC = () => {
  const { uploadVideo, isUploading, project } = useVideoEditorContext();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video-specific file types only
  const ACCEPTED_VIDEO_TYPES = '.mp4,.mov,.webm,.avi,.mkv';
  const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska'];

  const isVideoFile = (file: File): boolean => {
    return VIDEO_MIME_TYPES.includes(file.type) || 
           /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);
  };

  const handleFileSelect = async (files: FileList) => {
    const videoFiles = Array.from(files).filter(isVideoFile);
    
    if (videoFiles.length === 0) {
      showToast('Please select a valid video file (MP4, MOV, WebM, AVI, MKV)', 'warning');
      return;
    }

    if (videoFiles.length > 1) {
      showToast('Please select only one video file at a time', 'warning');
      return;
    }

    const videoFile = videoFiles[0];
    await uploadVideo(videoFile);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      await handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFileSelect(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px'
    }}>


      {/* Upload Area */}
      {!project.video ? (
        <div
          style={{
            flex: 1,
            border: `2px dashed ${dragActive ? '#ff4500' : '#343536'}`,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: dragActive ? 'rgba(255, 69, 0, 0.1)' : '#1a1a1b',
            minHeight: '200px'
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px'
          }}>


            <div style={{ textAlign: 'center' }}>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: dragActive ? '#ff4500' : '#d1d5db',
                fontWeight: 'bold',
                marginBottom: '5px'
              }}>
                {isUploading ? 'UPLOADING...' : 
                 dragActive ? 'DROP VIDEO HERE' : 'UPLOAD VIDEO'}
              </p>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: '#9ca3af'
              }}>
                Drag & drop or click to select
              </p>
              <p style={{
                margin: 0,
                fontSize: '11px',
                color: '#6b7280',
                marginTop: '8px'
              }}>
                Supports: MP4, MOV, WebM, AVI, MKV
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_VIDEO_TYPES}
            onChange={handleFileInput}
            style={{ display: 'none' }}
            disabled={isUploading}
          />
        </div>
      ) : (
        /* Video Info Display */
        <div style={{
          padding: '20px',
          backgroundColor: '#1a1a1b',
          borderRadius: '8px',
          border: '1px solid #343536'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '15px'
          }}>

            <div style={{ flex: 1 }}>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: '#d1d5db',
                fontWeight: 'bold',
                marginBottom: '2px'
              }}>
                {project.video.file.name}
              </p>
              <p style={{
                margin: 0,
                fontSize: '11px',
                color: '#9ca3af'
              }}>
                {project.video.duration.toFixed(1)}s • {project.video.width}×{project.video.height}
              </p>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '11px',
              backgroundColor: 'rgba(255, 69, 0, 0.1)',
              color: '#ff4500',
              border: '1px solid #ff4500',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: '"Space Mono", monospace',
              fontWeight: 'bold'
            }}
          >
            REPLACE VIDEO
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_VIDEO_TYPES}
            onChange={handleFileInput}
            style={{ display: 'none' }}
            disabled={isUploading}
          />
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
