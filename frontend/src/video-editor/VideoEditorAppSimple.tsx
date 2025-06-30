import React from 'react';

const VideoEditorAppSimple: React.FC = () => {
  return (
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
          color: '#ff4500',
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
          borderRight: '1px solid #343536',
          backgroundColor: '#1a1a1b',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#ff4500' }}>Video Library</h3>
          <div style={{
            border: '2px dashed #343536',
            borderRadius: '8px',
            padding: '40px 20px',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📹</div>
            <p>Drop videos here</p>
            <button style={{
              backgroundColor: '#ff4500',
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
            border: '1px solid #343536'
          }}>
            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎥</div>
              <h3>Multi-Video Editor</h3>
              <p>Professional video editing with sequences</p>
            </div>
          </div>

          {/* Timeline */}
          <div style={{
            height: '200px',
            borderTop: '1px solid #343536',
            backgroundColor: '#272729',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <h4 style={{ margin: 0, color: '#ff4500' }}>Timeline</h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{
                  backgroundColor: '#343536',
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
              backgroundColor: '#1a1a1b',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af'
            }}>
              Drag videos from library to create sequence
            </div>
          </div>
        </div>

        {/* Right Panel - Export Controls */}
        <div style={{
          width: '320px',
          borderLeft: '1px solid #343536',
          backgroundColor: '#1a1a1b',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#ff4500' }}>Export Settings</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db' }}>
              Format
            </label>
            <select style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#272729',
              border: '1px solid #343536',
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
            <label style={{ display: 'block', marginBottom: '8px', color: '#d1d5db' }}>
              Quality
            </label>
            <select style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#272729',
              border: '1px solid #343536',
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
            backgroundColor: '#ff4500',
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
