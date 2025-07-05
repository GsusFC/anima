import React from 'react';

// Correct relative imports (legacy folder structure)
import { VideoEditorProvider } from './VideoEditorContextMulti';
import { VideoLibrary } from './VideoLibrary';
import { VideoTimelineMulti } from './VideoTimelineMulti';
import { VideoPreviewMulti } from './VideoPreviewMulti';
import VideoExportMulti from './VideoExportMulti';

// Shared design tokens
import { COLORS } from './styles/theme';

const VideoEditorApp: React.FC = () => {
  return (
    <VideoEditorProvider>
      <div style={{
        height: '100vh',
        backgroundColor: COLORS.bg,
        color: COLORS.text,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Space Mono", monospace'
      }}>
        {/* Header */}
        <div style={{
          height: '48px',
          backgroundColor: COLORS.headerBg,
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px'
        }}>
          <h1 style={{
            fontSize: '18px',
            fontWeight: '600',
            margin: 0,
            color: COLORS.accent
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
            borderLeft: `1px solid ${COLORS.border}`
          }}>
            <VideoExportMulti />
          </div>
        </div>
      </div>
    </VideoEditorProvider>
  );
};

export default VideoEditorApp;
