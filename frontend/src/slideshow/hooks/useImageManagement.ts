import { useState, useCallback } from 'react';
import { ImageFile, UploadResponse } from '../types/slideshow.types';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : window.location.origin;

// API function for upload
const uploadImagesAPI = async (files: File[], sessionId: string): Promise<UploadResponse> => {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));

  const response = await fetch(`${API_BASE_URL}/upload?sessionId=${sessionId}`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
};

export const useImageManagement = (sessionId: string) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const uploadImages = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    
    // Generate sessionId if not provided
    const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('📤 Upload starting with sessionId:', currentSessionId);

    try {
      const uploadResult = await uploadImagesAPI(files, currentSessionId);
      
      if (uploadResult.success && uploadResult.files) {
        console.log('✅ Images uploaded successfully:', uploadResult);
        
        // Convert uploaded files to ImageFile format
        const newImages: ImageFile[] = files.map((file, index) => {
          const uploadedInfo = uploadResult.files[index];
          return {
            file: file,
            id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            size: file.size,
            preview: URL.createObjectURL(file),
            uploadedInfo: uploadedInfo,
            addedAt: new Date()
          };
        });

        setImages(prev => [...prev, ...newImages]);
        
        return {
          images: newImages,
          sessionId: uploadResult.sessionId
        };
      }
      
      throw new Error('Upload failed - no response from server');
    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [sessionId]);

  const removeImage = useCallback((imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  return {
    // State
    images,
    isUploading,
    dragActive,
    
    // Computed
    hasImages: images.length > 0,
    
    // Actions
    uploadImages,
    removeImage,
    clearImages,
    setDragActive
  };
};
