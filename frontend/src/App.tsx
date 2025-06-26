import React from 'react';
import Header from './components/Header/Header';
import ImageUpload from './components/ImageUpload/ImageUpload';
import Preview from './components/Preview/Preview';
import Timeline from './components/Timeline/Timeline';
import ExportControls from './components/ExportControls/ExportControls';

const App: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0b',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Space Mono", monospace'
    }}>
      {/* Header */}
      <Header />
      
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
          minHeight: '580px'
        }}>
          {/* Left Sidebar - Image Upload */}
          <div style={{
            width: '320px',
            borderRight: '1px solid #343536',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <ImageUpload />
          </div>
          
          {/* Center - Preview */}
          <div style={{
            flex: 1,
            borderRight: '1px solid #343536',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Preview />
          </div>
          
          {/* Right Sidebar - Export Controls */}
          <div style={{
            width: '320px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <ExportControls />
          </div>
        </div>
        
        {/* Bottom Section - Timeline */}
        <div style={{
          height: '240px',
          borderTop: '1px solid #343536',
          flexShrink: 0
        }}>
          <Timeline />
        </div>
      </div>
    </div>
  );
};

export default App; 