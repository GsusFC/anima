import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header/Header';
import SlideshowApp from './slideshow/SlideshowApp';
import VideoEditorApp from './video-editor/VideoEditorApp';
// import { FFmpegTest } from './components/FFmpegTest'; // Removed - FFmpeg not available

// SlideShow App Component  
const SlideShowRoute: React.FC = () => {
  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#0a0a0b',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Space Mono", monospace',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Header />
      
      {/* Slideshow Content */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <SlideshowApp />
      </div>
    </div>
  );
};

// Mode Selector Component
const ModeSelector: React.FC = () => {
  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#0a0a0b',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Space Mono", monospace'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '600px',
        padding: '40px'
      }}>
        <h1 style={{
          fontSize: '48px',
          margin: '0 0 20px 0',
          color: '#ec4899'
        }}>
          AnimaGen
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#9ca3af',
          margin: '0 0 40px 0'
        }}>
          Choose your editing mode
        </p>
        
        <div style={{
          display: 'flex',
          gap: '30px',
          justifyContent: 'center'
        }}>
          <Link 
            to="/slideshow"
            style={{
              textDecoration: 'none',
              padding: '30px',
              backgroundColor: '#1a1a1b',
              border: '2px solid #343536',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '200px'
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '15px' }}>🖼️</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#ec4899' }}>SlideShow</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              Create videos from images with transitions
            </p>
          </Link>

          <Link 
            to="/video-editor"
            style={{
              textDecoration: 'none',
              padding: '30px',
              backgroundColor: '#1a1a1b',
              border: '2px solid #343536',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '200px'
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '15px' }}>🎬</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#ec4899' }}>Video Editor</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              Trim and edit video files
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ModeSelector />} />
        <Route path="/slideshow" element={<SlideShowRoute />} />
        <Route path="/video-editor" element={<VideoEditorApp />} />
        {/* <Route path="/ffmpeg-test" element={<FFmpegTest />} /> */}
      </Routes>
    </Router>
  );
};

export default App; 