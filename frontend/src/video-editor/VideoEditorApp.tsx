import React from 'react';
import { VideoEditorProvider } from './context/VideoEditorContext';
import VideoUploader from './components/VideoUploader';
import VideoPreview from './components/VideoPreview';
import { VideoTimelineBuilder } from './components/timeline/VideoTimelineBuilder';
import { VideoExportBuilder } from './components/export/VideoExportBuilder';
import ToastContainer from './components/Toast';

const VideoEditorApp: React.FC = () => {
  return (
    <VideoEditorProvider>
      <div className="app-container custom-scrollbar">
        {/* Header */}
        <div className="h-15 border-b border-dark-700 flex items-center px-5 bg-dark-900">
          <h1 className="m-0 text-lg text-accent-green font-bold">
            🎬 VIDEO EDITOR - Enhanced Trimming Experience
          </h1>
        </div>

        {/* Main Editor Layout */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top Section - Upload + Preview + Export */}
          <div className="flex-1 flex min-h-0">
            {/* Left - Video Upload */}
            <div className="w-80 border-r border-dark-700 flex flex-col min-h-0">
              <VideoUploader />
            </div>

            {/* Center - Video Preview */}
            <div className="flex-1 border-r border-dark-700 flex flex-col min-h-0">
              <VideoPreview />
            </div>

            {/* Right - Export Controls */}
            <div className="w-80 flex flex-col min-h-0 overflow-auto">
              <VideoExportBuilder />
            </div>
          </div>

          {/* Bottom Section - Video Timeline */}
          <div className="h-[250px] border-t border-dark-700 flex-shrink-0 overflow-auto">
            <VideoTimelineBuilder />
          </div>
        </div>
      </div>
      <ToastContainer />
    </VideoEditorProvider>
  );
};

export default VideoEditorApp;
