import React, { useEffect, useRef } from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';

const Preview: React.FC = () => {
  const { preview, hasTimeline, generatePreview } = useSlideshowContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-generate preview when timeline changes (but not on errors)
  useEffect(() => {
    if (hasTimeline && !preview.isGenerating && !preview.url && !preview.error) {
      // Only generate if timeline actually changed (not just on re-renders)
      generatePreview();
    }
  }, [hasTimeline, preview.isGenerating, preview.url]);

  if (!hasTimeline) {
    return (
      <div style={{
        height: '100%',
        backgroundColor: '#0a0a0b',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px' // Reduced padding
      }}>
        <div style={{
          flex: 1,
          backgroundColor: '#1a1a1b',
          borderRadius: '8px',
          border: '1px solid #343536',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <svg style={{ width: '48px', height: '48px', color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2" />
          </svg>
          <div style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontFamily: '"Space Mono", monospace'
          }}>
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>No Preview Available</div>
            <div style={{ fontSize: '11px' }}>Add images to timeline to generate preview</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      backgroundColor: '#0a0a0b',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px' // Reduced padding
    }}>

      
      {/* Preview Area */}
      <div style={{
        flex: 1,
        backgroundColor: '#1a1a1b',
        borderRadius: '8px',
        border: '1px solid #343536',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        minHeight: '500px',
        overflow: 'hidden'
      }}>
        {preview.isGenerating && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 10
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #343536',
              borderTop: '3px solid #ff4500',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{
              color: '#ff4500',
              fontSize: '12px',
              fontWeight: 'bold',
              fontFamily: '"Space Mono", monospace'
            }}>
              Generating Preview...
            </div>
          </div>
        )}

        {preview.error && (
          <div style={{
            textAlign: 'center',
            color: '#ef4444',
            fontFamily: '"Space Mono", monospace'
          }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>Preview Error</div>
            <div style={{ fontSize: '11px', marginBottom: '12px' }}>{preview.error}</div>
            <button
              onClick={generatePreview}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ec4899',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Space Mono", monospace'
              }}
            >
              Retry Preview
            </button>
          </div>
        )}

        {preview.url && !preview.isGenerating && (
          <video
            ref={videoRef}
            src={preview.url}
            controls
            loop
            autoPlay
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '4px'
            }}
            onError={() => console.error('Video playback error')}
          />
        )}

        {!preview.url && !preview.isGenerating && !preview.error && (
          <div style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontFamily: '"Space Mono", monospace'
          }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>Ready to Preview</div>
            <button
              onClick={generatePreview}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ec4899',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Space Mono", monospace'
              }}
            >
              Generate Preview
            </button>
          </div>
        )}
      </div>



      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Preview;
