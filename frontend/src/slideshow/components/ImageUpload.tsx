import React, { useRef } from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';

const ImageUpload: React.FC = () => {
  const { 
    project, 
    isUploading, 
    dragActive, 
    uploadImages, 
    addToTimeline, 
    removeImage, 
    setDragActive 
  } = useSlideshowContext();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (files.length > 0) {
        try {
          await uploadImages(files);
        } catch (error) {
          console.error('Upload failed:', error);
        }
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      try {
        await uploadImages(files);
      } catch (error) {
        console.error('Upload failed:', error);
      }
      
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div style={{
      height: '100%',
      backgroundColor: '#0a0a0b',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px' // Reduced padding
    }}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* File List */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        {/* Add Image Card - Always visible at top */}
        <div 
          style={{
            position: 'relative',
            width: '100%',
            height: '60px',
            backgroundColor: dragActive ? '#1a1a1b' : '#0f0f0f',
            borderRadius: '2px',
            border: `2px dashed ${dragActive ? '#ff4500' : '#343536'}`,
            cursor: 'pointer',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            marginBottom: '8px',
            flexShrink: 0
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg style={{ width: '24px', height: '24px', color: '#6b7280', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span style={{ 
            color: dragActive ? '#ff4500' : '#9ca3af', 
            fontSize: '12px', 
            fontFamily: '"Space Mono", monospace' 
          }}>
            {isUploading ? 'Uploading...' : 'Add Images'}
          </span>
        </div>

        {/* Uploaded Files */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {project.images.map((image) => (
            <div
              key={image.id}
              style={{
                position: 'relative',
                width: '100%',
                height: '80px',
                backgroundColor: '#1a1a1b',
                borderRadius: '6px',
                border: '1px solid #343536',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                gap: '12px',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onClick={() => addToTimeline(image.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2a2a2b';
                e.currentTarget.style.borderColor = '#22c55e';
                e.currentTarget.style.transform = 'scale(1.02)';
                const overlay = e.currentTarget.querySelector('.add-overlay') as HTMLElement;
                if (overlay) overlay.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a1a1b';
                e.currentTarget.style.borderColor = '#343536';
                e.currentTarget.style.transform = 'scale(1)';
                const overlay = e.currentTarget.querySelector('.add-overlay') as HTMLElement;
                if (overlay) overlay.style.opacity = '0';
              }}
              title="Click to add to timeline"
            >
              {/* Professional Thumbnail - 2:1 Aspect Ratio */}
              <div style={{
                width: '128px',
                height: '64px',
                position: 'relative',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #4b5563',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}>
                <img
                  src={image.preview}
                  alt="Media"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                
                {/* Add Overlay on Hover */}
                <div 
                  className="add-overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    pointerEvents: 'none'
                  }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#22c55e',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                    +
                  </div>
                </div>
              </div>
              
              {/* Only Remove Button */}
              <div style={{ 
                marginLeft: 'auto',
                display: 'flex', 
                gap: '4px',
                alignItems: 'center'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                  style={{
                    width: '18px',
                    height: '18px',
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    border: 'none',
                    borderRadius: '3px',
                    color: 'white',
                    fontSize: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    opacity: 0.6
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.6';
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.8)';
                  }}
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        {project.images.length > 0 && (
          <div style={{
            marginTop: '8px',
            display: 'flex',
            gap: '8px',
            flexShrink: 0
          }}>
            <button
              onClick={() => project.images.forEach(img => addToTimeline(img.id))}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#22c55e',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Space Mono", monospace'
              }}
            >
              + ALL TO TIMELINE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
