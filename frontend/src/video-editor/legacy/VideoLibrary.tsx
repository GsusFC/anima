import React, { useRef, useState } from 'react';
import { VideoFile } from '../types/video-editor.types';
import { useVideoEditor } from '../context/VideoEditorContextMulti';

interface VideoLibraryProps {}

export const VideoLibrary: React.FC<VideoLibraryProps> = () => {
  const { 
    project, 
    addVideoToLibrary, 
    selectVideo, 
    addVideoToSequence,
    removeVideoFromLibrary 
  } = useVideoEditor();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('video/')) {
        addVideoToLibrary(file);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleVideoClick = (video: VideoFile) => {
    selectVideo(video.id);
  };

  const handleVideoDoubleClick = (video: VideoFile) => {
    addVideoToSequence(video.id);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb < 1000 ? `${mb.toFixed(1)}MB` : `${(mb / 1024).toFixed(1)}GB`;
  };

  return (
    <div className="bg-gray-900 border-r border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">Video Library</h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Add Videos
          </button>
        </div>
        <p className="text-gray-400 text-xs mt-1">
          {project.library.videos.length} video{project.library.videos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Drop Zone / Video List */}
      <div className="flex-1 overflow-auto">
        {project.library.videos.length === 0 ? (
          <div
            className={`m-4 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-500/10' : 'hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="font-medium mb-2">Drop videos here</p>
              <p className="text-sm">or click "Add Videos" to browse</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 p-2">
            {project.library.videos.map((video) => (
              <div
                key={video.id}
                className={`bg-gray-800 rounded-lg p-3 cursor-pointer transition-colors border ${
                  project.library.selectedVideoId === video.id 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-700 hover:border-gray-600 hover:bg-gray-750'
                }`}
                onClick={() => handleVideoClick(video)}
                onDoubleClick={() => handleVideoDoubleClick(video)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/video-id', video.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
              >
                {/* Video Thumbnail */}
                <div className="relative mb-3">
                  {video.thumbnails[0] ? (
                    <img
                      src={video.thumbnails[0]}
                      alt={video.name}
                      className="w-full h-20 object-cover rounded bg-gray-700"
                    />
                  ) : (
                    <div className="w-full h-20 bg-gray-700 rounded flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                </div>

                {/* Video Info */}
                <div>
                  <h4 className="text-white text-sm font-medium truncate mb-1">{video.name}</h4>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>{video.width}×{video.height}</span>
                      <span>{formatFileSize(video.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{video.fps} fps</span>
                      <span>{formatDuration(video.duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700">
                  <span className="text-xs text-gray-500">Double-click to add</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVideoFromLibrary(video.id);
                    }}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />
    </div>
  );
};
