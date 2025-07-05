import React from 'react';
import { COLORS } from './styles/theme';

const VideoEditorAppSimple: React.FC = () => {
  return (
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
        height: '60px',
        borderBottom: `1px solid ${COLORS.borderLight}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        backgroundColor: COLORS.panelBg
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '18px',
          color: COLORS.accent,
          fontWeight: 'bold'
        }}>
          🎬 PROFESSIONAL VIDEO EDITOR
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
          borderRight: `1px solid ${COLORS.borderLight}`,
          backgroundColor: COLORS.panelBg,
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: COLORS.accent }}>Video Library</h3>
          <div style={{
            border: `2px dashed ${COLORS.borderLight}`,
            borderRadius: '8px',
            padding: '40px 20px',
            textAlign: 'center',
            color: COLORS.grayText
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📹</div>
            <p>Drop videos here</p>
            <button style={{
              backgroundColor: COLORS.accent,
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '10px'
            }}>
              Add Videos
            </button>
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
            border: `1px solid ${COLORS.borderLight}`
          }}>
            <div style={{ textAlign: 'center', color: COLORS.grayText }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎥</div>
              <h3>Multi-Video Editor</h3>
              <p>Professional video editing with sequences</p>
            </div>
          </div>

          {/* Timeline */}
          <div style={{
            height: '200px',
            borderTop: `1px solid ${COLORS.borderLight}`,
            backgroundColor: COLORS.panelBgAlt,
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <h4 style={{ margin: 0, color: COLORS.accent }}>Timeline</h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{
                  backgroundColor: COLORS.borderLight,
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  ▶️ Play
                </button>
              </div>
            </div>
            <div style={{
              height: '80px',
              backgroundColor: COLORS.panelBg,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.grayText
            }}>
              Drag videos from library to create sequence
            </div>
          </div>
        </div>

        {/* Right Panel - Export Controls */}
        <div style={{
          width: '320px',
          borderLeft: `1px solid ${COLORS.borderLight}`,
          backgroundColor: COLORS.panelBg,
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: COLORS.accent }}>Export Settings</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: COLORS.grayText }}>
              Format
            </label>
            <select style={{
              width: '100%',
              padding: '8px',
              backgroundColor: COLORS.panelBgAlt,
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: '4px',
              color: 'white'
            }}>
              <option>MP4 (H.264)</option>
              <option>WebM (VP9)</option>
              <option>MOV</option>
              <option>GIF</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: COLORS.grayText }}>
              Quality
            </label>
            <select style={{
              width: '100%',
              padding: '8px',
              backgroundColor: COLORS.panelBgAlt,
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: '4px',
              color: 'white'
            }}>
              <option>Web</option>
              <option>Standard</option>
              <option>High</option>
              <option>Ultra</option>
            </select>
          </div>

          <button style={{
            width: '100%',
            backgroundColor: COLORS.accent,
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Export Video
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoEditorAppSimple;
