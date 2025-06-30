import React from 'react';
import { VideoEditorProvider } from './context/VideoEditorContextMulti';
import { VideoLibrary } from './components/VideoLibrary';
import { VideoTimelineMulti } from './components/VideoTimelineMulti';
import { VideoPreviewMulti } from './components/VideoPreviewMulti';
import VideoExportMulti from './components/VideoExportMulti';

const VideoEditorAppHybrid: React.FC = () => {
  return (
    <VideoEditorProvider>
      <div style={{
        height: '100vh',
        backgroundColor: '#0a0a0b',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Space Mono", monospace'
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
            color: '#22c55e',
            fontWeight: 'bold'
          }}>
            🎬 PROFESSIONAL VIDEO EDITOR - Multi-Video
          </h1>
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          display: 'flex'
        }}>
          {/* Left Panel - Video Library */}
          <div style={{
            width: '320px',
            borderRight: '1px solid #343536',
            backgroundColor: '#1a1a1b',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}>
            <div style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#22c55e' }}>Video Library</h3>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <VideoLibrary />
            </div>
          </div>

          {/* Center Panel - Preview & Timeline */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Video Preview */}
            <div style={{
              flex: 1,
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #343536',
              position: 'relative'
            }}>
              <VideoPreviewMulti />
            </div>

            {/* Timeline */}
            <div style={{
              height: '200px',
              borderTop: '1px solid #343536',
              backgroundColor: '#272729'
            }}>
              <VideoTimelineMulti />
            </div>
          </div>

          {/* Right Panel - Export Controls */}
          <div style={{
            width: '320px',
            borderLeft: '1px solid #343536',
            backgroundColor: '#1a1a1b',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <VideoExportMulti />
          </div>
        </div>
      </div>
    </VideoEditorProvider>
  );
};

export default VideoEditorAppHybrid;
