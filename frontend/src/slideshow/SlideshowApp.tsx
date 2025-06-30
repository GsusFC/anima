import React from 'react';
import { SlideshowProvider } from './context/SlideshowContext';
import ImageUpload from './components/ImageUpload';
import Preview from './components/Preview';
import Timeline from './components/Timeline';
import ExportControls from './components/ExportControls';

const SlideshowApp: React.FC = () => {
  return (
    <SlideshowProvider>
      <div style={{
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
    </SlideshowProvider>
  );
};

export default SlideshowApp;
