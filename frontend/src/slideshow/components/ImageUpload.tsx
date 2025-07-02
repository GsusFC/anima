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
    <div className="h-full bg-dark-950 flex flex-col p-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* File List */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Add Image Card - Always visible at top */}
        <div 
          className={`drop-zone h-15 cursor-pointer flex items-center justify-center mb-2 flex-shrink-0 ${
            dragActive ? 'active' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="w-6 h-6 text-dark-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className={`text-sm font-mono ${
            dragActive ? 'text-accent-pink' : 'text-dark-400'
          }`}>
            {isUploading ? 'Uploading...' : 'Add Images'}
          </span>
        </div>

        {/* Uploaded Files */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 custom-scrollbar">
          {project.images.map((image) => (
            <div
              key={image.id}
              className="timeline-item group relative w-full h-20 p-2 gap-3"
              onClick={() => addToTimeline(image.id)}
              title="Click to add to timeline"
            >
              {/* Professional Thumbnail - 2:1 Aspect Ratio */}
              <div className="timeline-thumbnail shadow-lg">
                <img
                  src={image.preview}
                  alt="Media"
                  className="w-full h-full object-cover"
                />
                
                {/* Add Overlay on Hover */}
                <div className="add-overlay absolute inset-0 bg-green-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="w-8 h-8 bg-accent-pink rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                    +
                  </div>
                </div>
              </div>
              
              {/* Only Remove Button */}
              <div className="ml-auto flex gap-1 items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                  className="w-4 h-4 bg-accent-red/80 hover:bg-accent-red text-white text-xs rounded flex items-center justify-center transition-all duration-200 opacity-60 hover:opacity-100"
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
          <div className="mt-2 flex gap-2 flex-shrink-0">
            <button
              onClick={() => project.images.forEach(img => addToTimeline(img.id))}
              className="btn-pink flex-1 text-xs py-2"
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
