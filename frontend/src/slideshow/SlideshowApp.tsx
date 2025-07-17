import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SlideshowProvider } from './context/SlideshowContext';
import ImageUpload from './components/ImageUpload';
import Preview from './components/Preview';
import Timeline from './components/Timeline';
import ExportControls from './components/ExportControls';
import { useSlideshowContext } from './context/SlideshowContext';
import APIKeyModal from '../components/APIKeyModal/APIKeyModal';
import NavigationHeader from '../components/NavigationHeader/NavigationHeader';
import { ToastContainer } from '../shared/components/Toast';
import {
  UnifiedUploadPanel,
  UnifiedPreviewPanel,
  UnifiedExportPanel,
  UnifiedTimelinePanel
} from '../shared/components/unified';

// Internal component that uses the context
const SlideshowContent: React.FC = () => {
  const location = useLocation();
  const { loadImagesFromSession } = useSlideshowContext();
  const [isAPIKeyModalOpen, setIsAPIKeyModalOpen] = useState(false);

  // Extract sessionId from URL parameters for Figma import
  const urlParams = new URLSearchParams(location.search);
  const sessionId = urlParams.get('sessionId');

  // Load images from session if sessionId is provided (Figma plugin)
  useEffect(() => {
    if (sessionId) {
      console.log('🎬 Figma plugin session detected:', sessionId);
      loadImagesFromSession(sessionId)
        .then((success) => {
          if (success) {
            console.log('✅ Successfully loaded images from session');
          } else {
            console.log('❌ Failed to load images from session');
          }
        })
        .catch((error) => {
          console.error('❌ Error loading images from session:', error);
        });
    }
  }, [sessionId, loadImagesFromSession]);





  // Editor mode layout (original)
  return (
    <>
      <div className="app-container custom-scrollbar">
        {/* Navigation Header */}
        <NavigationHeader 
          currentMode="slideshow"
          onOpenAPIKeyModal={() => setIsAPIKeyModalOpen(true)} 
        />

        {/* Main Content */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Top Section - Three Columns */}
          <div className="flex flex-1 min-h-0" style={{ gap: '4px' }}>
            {/* Left Sidebar - Image Upload */}
            <UnifiedUploadPanel>
              <ImageUpload />
            </UnifiedUploadPanel>

            {/* Center - Preview */}
            <UnifiedPreviewPanel>
              <Preview />
            </UnifiedPreviewPanel>

            {/* Right Sidebar - Export Controls */}
            <UnifiedExportPanel>
              <ExportControls />
            </UnifiedExportPanel>
          </div>

          {/* Bottom Section - Enhanced Timeline */}
          <UnifiedTimelinePanel>
            <div className="h-full overflow-x-auto overflow-y-hidden">
              <Timeline />
            </div>
          </UnifiedTimelinePanel>
        </div>
      </div>

      {/* API Key Modal */}
      <APIKeyModal
        isOpen={isAPIKeyModalOpen}
        onClose={() => setIsAPIKeyModalOpen(false)}
      />

      {/* Toast System */}
      <ToastContainer />
    </>
  );
};

const SlideshowApp: React.FC = () => {
  return (
    <SlideshowProvider>
      <SlideshowContent />
    </SlideshowProvider>
  );
};

export default SlideshowApp;
