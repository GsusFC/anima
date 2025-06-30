import React from 'react';
import { VideoEditorProvider } from './context/VideoEditorContextMulti';
import { VideoLibrary } from './components/VideoLibrary';
import { VideoTimelineMulti } from './components/VideoTimelineMulti';
import { VideoPreviewMulti } from './components/VideoPreviewMulti';
import VideoExportMulti from './components/VideoExportMulti';

const VideoEditorApp: React.FC = () => {
  return (
    <VideoEditorProvider>
      <div style={{
        height: '100vh',
        backgroundColor: '#111827',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Space Mono", monospace'
      }}>
        {/* Header */}
        <div style={{
          height: '48px',
          backgroundColor: '#1f2937',
          borderBottom: '1px solid #374151',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px'
        }}>
          <h1 style={{
            fontSize: '18px',
            fontWeight: '600',
            margin: 0,
            color: '#ff4500'
          }}>
            🎬 AnimaGen - Professional Video Editor
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
            flexShrink: 0
          }}>
            <VideoLibrary />
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
              padding: '16px'
            }}>
              <VideoPreviewMulti />
            </div>

            {/* Timeline */}
            <div style={{
              height: '256px',
              borderTop: '1px solid #374151'
            }}>
              <VideoTimelineMulti />
            </div>
          </div>

          {/* Right Panel - Export Controls */}
          <div style={{
            width: '320px',
            flexShrink: 0,
            borderLeft: '1px solid #374151'
          }}>
            <VideoExportMulti />
          </div>
        </div>
      </div>
    </VideoEditorProvider>
  );
};

export default VideoEditorApp;
