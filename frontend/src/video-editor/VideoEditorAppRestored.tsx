import React from 'react';
import { VideoEditorProvider } from './context/VideoEditorContext';
import VideoUploader from './components/VideoUploader';
import VideoPreview from './components/VideoPreview';
import VideoTimeline from './components/VideoTimeline';
import VideoExportComplete from './components/VideoExportComplete';
import ToastContainer from './components/Toast';

const VideoEditorAppRestored: React.FC = () => {
  return (
    <VideoEditorProvider>
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
        <div style={{
          height: '60px',
          borderBottom: '1px solid #343536',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          backgroundColor: '#1a1a1b'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '18px',
            color: '#ff4500',
            fontWeight: 'bold'
          }}>
            🎬 VIDEO EDITOR - Enhanced Trimming Experience
          </h1>
          
          <div style={{
            marginLeft: 'auto',
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            ✅ Instant Trim • ✅ Hover Preview • ✅ Adaptive Thumbnails • ✅ Frame Navigation
          </div>
        </div>

        {/* Main Editor Layout */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          {/* Top Section - Upload + Preview + Export */}
          <div style={{
            flex: 1,
            display: 'flex',
            minHeight: 0
          }}>
            {/* Left - Video Upload */}
            <div style={{
              width: '320px',
              borderRight: '1px solid #343536',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}>
              <VideoUploader />
            </div>

            {/* Center - Video Preview */}
            <div style={{
              flex: 1,
              borderRight: '1px solid #343536',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}>
              <VideoPreview />
            </div>

            {/* Right - Export Controls */}
            <div style={{
              width: '320px',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'auto'
            }}>
              <VideoExportComplete />
            </div>
          </div>

          {/* Bottom Section - Video Timeline */}
          <div style={{
            height: '250px', // Optimized height after removing trim actions
            borderTop: '1px solid #343536',
            flexShrink: 0,
            overflow: 'auto'
          }}>
            <VideoTimeline />
          </div>
        </div>
      </div>
      <ToastContainer />
    </VideoEditorProvider>
  );
};

export default VideoEditorAppRestored;
