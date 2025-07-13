import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SlideshowProvider } from './context/SlideshowContext';
import ImageUpload from './components/ImageUpload';
import Preview from './components/Preview';
import Timeline from './components/Timeline';
import ExportControls from './components/ExportControls';
import { useSlideshowContext } from './context/SlideshowContext';
import APIKeyModal from '../components/APIKeyModal/APIKeyModal';
import Header from '../components/Header/Header';

// Internal component that uses the context
const SlideshowContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { loadSlideshowFromAPI } = useSlideshowContext();
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAPIKeyModalOpen, setIsAPIKeyModalOpen] = useState(false);

  const isViewerMode = !!id;

  // Load slideshow from API if in viewer mode
  useEffect(() => {
    if (isViewerMode && id) {
      setIsLoading(true);
      setLoadError(null);

      loadSlideshowFromAPI(id)
        .then((success) => {
          if (!success) {
            setLoadError('Failed to load slideshow');
          }
        })
        .catch((error) => {
          setLoadError(error.message || 'Failed to load slideshow');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, isViewerMode, loadSlideshowFromAPI]);

  // Loading state
  if (isLoading) {
    return (
      <div className="app-container custom-scrollbar">
        <div className="flex flex-col flex-1 min-h-0 items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading slideshow...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="app-container custom-scrollbar">
        <div className="flex flex-col flex-1 min-h-0 items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Slideshow</h2>
            <p className="text-gray-400 mb-4">{loadError}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Viewer mode layout (simplified)
  if (isViewerMode) {
    return (
      <>
        <div className="app-container custom-scrollbar">
          {/* Header */}
          <Header onOpenAPIKeyModal={() => setIsAPIKeyModalOpen(true)} />

          {/* Viewer info */}
          <div className="bg-dark-800 border-b border-dark-700 px-6 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-pink-500">Slideshow Viewer</h2>
                <p className="text-gray-400 text-sm">Viewing slideshow: {id}</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
                >
                  ← Back to AnimaGen
                </button>
              </div>
            </div>
          </div>

        {/* Main Content - Viewer Layout */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Preview takes most space */}
          <div className="flex-1 border-b border-dark-700 flex flex-col min-h-0">
            <Preview />
          </div>

          {/* Timeline at bottom */}
          <div className="h-[200px] border-t border-dark-700 flex-shrink-0 relative">
            <div className="h-full overflow-x-auto overflow-y-hidden">
              <Timeline />
            </div>
          </div>
        </div>

        {/* API Key Modal */}
        <APIKeyModal
          isOpen={isAPIKeyModalOpen}
          onClose={() => setIsAPIKeyModalOpen(false)}
        />
      </>
    );
  }

  // Editor mode layout (original)
  return (
    <>
      <div className="app-container custom-scrollbar">
        {/* Header */}
        <Header onOpenAPIKeyModal={() => setIsAPIKeyModalOpen(true)} />

        {/* Main Content */}
        <div className="flex flex-col flex-1 min-h-0">
        {/* Top Section - Three Columns */}
        <div className="flex flex-1 min-h-0">
          {/* Left Sidebar - Image Upload */}
          <div className="w-80 border-r border-dark-700 flex flex-col min-h-0">
            <ImageUpload />
          </div>

          {/* Center - Preview */}
          <div className="flex-1 border-r border-dark-700 flex flex-col min-h-0">
            <Preview />
          </div>

          {/* Right Sidebar - Export Controls */}
          <div className="w-80 flex flex-col min-h-0">
            <ExportControls />
          </div>
        </div>

        {/* Bottom Section - Enhanced Timeline */}
        <div className="h-[300px] border-t border-dark-700 flex-shrink-0 relative">
          <div className="h-full overflow-x-auto overflow-y-hidden">
            <Timeline />
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      <APIKeyModal
        isOpen={isAPIKeyModalOpen}
        onClose={() => setIsAPIKeyModalOpen(false)}
      />
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
