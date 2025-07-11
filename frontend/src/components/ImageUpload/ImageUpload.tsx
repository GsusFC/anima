import React, { useState, useRef } from 'react';
import { useAPI } from '../../hooks/useAPI';

const ImageUpload: React.FC = () => {
  const { uploadFiles, isUploading } = useAPI();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{[key: string]: string}>({});
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: any}>({});
  const [sessionId, setSessionId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to add single file to timeline
  const addToTimeline = (file: File) => {
    const uploadedFile = uploadedFiles[file.name + file.size];
    // Store file data for timeline access
    (window as any).__selectedFile = file;
    (window as any).__uploadedFileInfo = uploadedFile;
    (window as any).__sessionId = sessionId;
    // Dispatch custom event to notify timeline
    window.dispatchEvent(new CustomEvent('addFileToTimeline', { 
      detail: { 
        file, 
        uploadedFile,
        sessionId 
      } 
    }));
  };



  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const createPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviews(prev => ({
          ...prev,
          [file.name + file.size]: e.target?.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      
      // Create previews locally for immediate feedback
      newFiles.forEach(createPreview);
      setFiles(prev => [...prev, ...newFiles]);
      
      // Upload to backend
      try {
        const currentSessionId = sessionId || Date.now().toString();
        setSessionId(currentSessionId);
        
        const response = await uploadFiles(newFiles, currentSessionId);
        if (response.success) {
          // Store uploaded file info for each local file
          newFiles.forEach((file, index) => {
            const uploadedFile = response.files[index];
            if (uploadedFile) {
              setUploadedFiles(prev => ({
                ...prev,
                [file.name + file.size]: uploadedFile
              }));
            }
          });
          console.log('Files uploaded successfully:', response);
        }
      } catch (error) {
        console.error('Upload failed:', error);
        // Could show error notification here
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      
      // Create previews locally for immediate feedback
      newFiles.forEach(createPreview);
      setFiles(prev => [...prev, ...newFiles]);
      
      // Upload to backend
      try {
        const currentSessionId = sessionId || Date.now().toString();
        setSessionId(currentSessionId);
        
        const response = await uploadFiles(newFiles, currentSessionId);
        if (response.success) {
          // Store uploaded file info for each local file
          newFiles.forEach((file, index) => {
            const uploadedFile = response.files[index];
            if (uploadedFile) {
              setUploadedFiles(prev => ({
                ...prev,
                [file.name + file.size]: uploadedFile
              }));
            }
          });
          console.log('Files uploaded successfully:', response);
        }
      } catch (error) {
        console.error('Upload failed:', error);
        // Could show error notification here
      }
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    if (fileToRemove) {
      const key = fileToRemove.name + fileToRemove.size;
      setPreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[key];
        return newPreviews;
      });
    }
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px'
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
            {isUploading ? 'UPLOADING...' : dragActive ? 'DROP HERE' : 'ADD IMAGES'}
          </span>
        </div>

        {/* Scrollable Images List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '8px',
          minHeight: 0,
          scrollbarWidth: 'thin',
          scrollbarColor: '#4b5563 transparent'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingBottom: '8px'
          }}>
            {/* Debug info */}
            <div style={{
              padding: '8px',
              backgroundColor: '#2a2a2a',
              color: '#ff4500',
              fontSize: '10px',
              fontFamily: '"Space Mono", monospace'
            }}>
              DEBUG: {files.length} images loaded
            </div>
            
            {/* Existing Images */}
            {files.map((file, index) => (
                <div 
                  key={index}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/x-file-name', file.name);
                    e.dataTransfer.setData('application/x-file-index', index.toString());
                    (window as any).__draggedFile = file;
                  }}
                  onClick={() => addToTimeline(file)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '60px',
                    backgroundColor: '#1a1a1b',
                    borderRadius: '2px',
                    border: '1px solid #343536',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#343536';
                    e.currentTarget.style.borderColor = '#ff4500';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1a1b';
                    e.currentTarget.style.borderColor = '#343536';
                  }}
                >
                  {previews[file.name + file.size] ? (
                    <img
                      src={previews[file.name + file.size]}
                      alt={file.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '2px'
                      }}
                    />
                  ) : (
                    <svg style={{ width: '32px', height: '32px', color: '#9ca3af' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  )}
                  

                  
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(239, 68, 68, 0.8)',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
          </div>
        </div>


      </div>
    </div>
  );
};

export default ImageUpload; 