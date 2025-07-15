import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import SlideshowApp from './slideshow/SlideshowApp';
import VideoEditorApp from './video-editor/VideoEditorApp';

// SlideShow App Component with Navigation
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
      <SlideshowApp />
    </div>
  );
};

// Video Editor App Component with Navigation
const VideoEditorRoute: React.FC = () => {
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
      <VideoEditorApp />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/slideshow" element={<SlideShowRoute />} />
        <Route path="/video-editor" element={<VideoEditorRoute />} />
      </Routes>
    </Router>
  );
};

export default App; 