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
    <div className="h-full flex flex-col p-5">
      {/* Upload Area */}
      {!project.video ? (
        <div
          className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all min-h-[200px] ${
            dragActive 
              ? 'border-accent-green bg-accent-green/10' 
              : 'border-dark-700 bg-dark-900'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <p className={`m-0 text-lg font-bold mb-1 font-mono ${
                dragActive ? 'text-accent-green' : 'text-dark-300'
              }`}>
                {isUploading ? 'UPLOADING...' : 
                 dragActive ? 'DROP VIDEO HERE' : 'UPLOAD VIDEO'}
              </p>
              <p className="m-0 text-sm text-dark-400 font-mono">
                Drag & drop or click to select
              </p>
              <p className="m-0 text-xs text-dark-500 mt-2 font-mono">
                Supports: MP4, MOV, WebM, AVI, MKV
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_VIDEO_TYPES}
            onChange={handleFileInput}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      ) : (
        /* Video Info Display */
        <div className="panel p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex-1">
              <p className="m-0 text-sm text-dark-300 font-bold mb-0.5 font-mono">
                {project.video.file.name}
              </p>
              <p className="m-0 text-xs text-dark-400 font-mono">
                {project.video.duration.toFixed(1)}s • {project.video.width}×{project.video.height}
              </p>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 px-3 text-xs bg-accent-green/10 text-accent-green border border-accent-green rounded cursor-pointer font-mono font-bold hover:bg-accent-green/20 transition-colors"
          >
            REPLACE VIDEO
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_VIDEO_TYPES}
            onChange={handleFileInput}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
