import React from 'react';
import { SlideshowProvider } from './context/SlideshowContext';
import ImageUpload from './components/ImageUpload';
import Preview from './components/Preview';
import Timeline from './components/Timeline';
import ExportControls from './components/ExportControls';

const SlideshowApp: React.FC = () => {
  return (
    <SlideshowProvider>
      <div className="app-container custom-scrollbar">
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
          <div className="h-[300px] border-t border-dark-700 flex-shrink-0 overflow-hidden">
            <Timeline />
          </div>
        </div>
      </div>
    </SlideshowProvider>
  );
};

export default SlideshowApp;
