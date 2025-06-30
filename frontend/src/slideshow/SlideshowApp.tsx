import React from 'react';
import { SlideshowProvider } from './context/SlideshowContext';
import ImageUpload from './components/ImageUpload';
import Preview from './components/Preview';
import Timeline from './components/Timeline';
import ExportControls from './components/ExportControls';

const SlideshowApp: React.FC = () => {
  return (
    <SlideshowProvider>
      <div className="slideshow-app" style={{
        height: '100vh',
        backgroundColor: '#0a0a0b',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Space Mono", monospace',
        overflow: 'hidden'
      }}>
        {/* Main Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          {/* Top Section - Three Columns */}
          <div style={{
            flex: 1,
            display: 'flex',
            minHeight: 0
          }}>
            {/* Left Sidebar - Image Upload */}
            <div style={{
              width: '320px',
              borderRight: '1px solid #343536',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}>
              <ImageUpload />
            </div>
            
            {/* Center - Preview */}
            <div style={{
              flex: 1,
              borderRight: '1px solid #343536',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}>
              <Preview />
            </div>
            
            {/* Right Sidebar - Export Controls */}
            <div style={{
              width: '320px',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}>
              <ExportControls />
            </div>
          </div>
          
          {/* Bottom Section - Enhanced Timeline */}
          <div style={{
            height: '300px', // Even bigger with all space optimizations
            borderTop: '1px solid #343536',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            <Timeline />
          </div>
        </div>
      </div>

      {/* Global Slideshow Styles */}
      <style>{`
        /* Reset margins and ensure full viewport usage */
        body, html {
          margin: 0 !important;
          padding: 0 !important;
          height: 100%;
          overflow: hidden;
        }

        #root {
          height: 100vh;
          overflow: hidden;
        }

        .slideshow-app {
          box-sizing: border-box;
        }

        /* Custom Scrollbar Styles for Slideshow App */
        .slideshow-app ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .slideshow-app ::-webkit-scrollbar-track {
          background: rgba(15, 15, 16, 0.5);
          border-radius: 4px;
        }

        .slideshow-app ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.7), rgba(190, 24, 93, 0.8));
          border-radius: 4px;
          border: 1px solid rgba(15, 15, 16, 0.2);
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.1);
        }

        .slideshow-app ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.9), rgba(190, 24, 93, 1));
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 0 4px rgba(236, 72, 153, 0.3);
        }

        .slideshow-app ::-webkit-scrollbar-thumb:active {
          background: linear-gradient(135deg, rgba(190, 24, 93, 1), rgba(157, 23, 77, 1));
        }

        .slideshow-app ::-webkit-scrollbar-corner {
          background: rgba(15, 15, 16, 0.5);
        }

        /* Firefox Scrollbar Support */
        .slideshow-app * {
          scrollbar-width: thin;
          scrollbar-color: rgba(236, 72, 153, 0.7) rgba(15, 15, 16, 0.5);
        }
      `}</style>
    </SlideshowProvider>
  );
};

export default SlideshowApp;
