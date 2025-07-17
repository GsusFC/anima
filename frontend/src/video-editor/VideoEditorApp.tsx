import React from 'react';
import { VideoEditorProvider } from './context/VideoEditorContext';
import VideoUploader from './components/VideoUploader';
import VideoPreview from './components/VideoPreview';
import { VideoTimelineBuilder } from './components/timeline/VideoTimelineBuilder';
import { VideoExportBuilder } from './components/export/VideoExportBuilder';
import { ToastContainer } from '../shared/components/Toast';
import NavigationHeader from '../components/NavigationHeader/NavigationHeader';
import {
  UnifiedUploadPanel,
  UnifiedPreviewPanel,
  UnifiedExportPanel,
  UnifiedTimelinePanel
} from '../shared/components/unified';

const VideoEditorApp: React.FC = () => {
  return (
    <VideoEditorProvider>
      <div className="app-container custom-scrollbar">
        {/* Navigation Header */}
        <NavigationHeader currentMode="video-editor" />

        {/* Main Editor Layout */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top Section - Upload + Preview + Export */}
          <div className="flex-1 flex min-h-0" style={{ gap: '4px' }}>
            {/* Left - Video Upload */}
            <UnifiedUploadPanel>
              <VideoUploader />
            </UnifiedUploadPanel>

            {/* Center - Video Preview */}
            <UnifiedPreviewPanel>
              <VideoPreview />
            </UnifiedPreviewPanel>

            {/* Right - Export Controls */}
            <UnifiedExportPanel>
              <VideoExportBuilder />
            </UnifiedExportPanel>
          </div>

          {/* Bottom Section - Video Timeline */}
          <UnifiedTimelinePanel>
            <VideoTimelineBuilder />
          </UnifiedTimelinePanel>
        </div>
      </div>
      <ToastContainer />
    </VideoEditorProvider>
  );
};

export default VideoEditorApp;
