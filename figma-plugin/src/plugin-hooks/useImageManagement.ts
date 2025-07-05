import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { ImageFile, UploadResponse } from '../types/slideshow.types';

// API call
const uploadImagesAPI = async (files: File[], sessionId: string): Promise<UploadResponse> => {
  const formData = new FormData();
  files.forEach((f) => formData.append('images', f, f.name));

  console.log(`🔄 Uploading ${files.length} files with sessionId: ${sessionId}`);
  console.log(`🌐 Using API base URL: ${apiService.getBaseURL()}`);

  const uploadURL = `${apiService.getBaseURL()}/upload?sessionId=${sessionId}`;
  console.log(`📤 Upload URL: ${uploadURL}`);

  const res = await fetch(uploadURL, {
    method: 'POST',
    body: formData
  });

  console.log(`📥 Upload response status: ${res.status}`);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`❌ Upload failed:`, errorText);
    throw new Error(`Upload failed: ${res.statusText}`);
  }
  
  const result = await res.json();
  console.log(`✅ Upload successful:`, result);
  return result;
};

interface UseImageManagementReturn {
  images: ImageFile[];
  isUploading: boolean;
  sessionId: string;
  uploadImages: (files: File[]) => Promise<{ images: ImageFile[]; sessionId: string } | undefined>;
  removeImage: (id: string) => void;
  hasImages: boolean;
}

export const useImageManagement = (initialSessionId?: string): UseImageManagementReturn => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>(initialSessionId || '');

  const uploadImages = useCallback(async (files: File[]): Promise<{ images: ImageFile[]; sessionId: string } | undefined> => {
    if (!files.length) return;
    setIsUploading(true);

    const currentSession = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const result = await uploadImagesAPI(files, currentSession);
      if (!result.success) throw new Error('Backend returned failure');

      const newImgs: ImageFile[] = files.map((file, idx) => ({
        file,
        id: `img_${Date.now()}_${idx}`,
        name: file.name,
        size: file.size,
        preview: URL.createObjectURL(file),
        uploadedInfo: result.files[idx],
        addedAt: new Date()
      }));

      setImages((prev: ImageFile[]) => [...prev, ...newImgs]);
      setSessionId(result.sessionId);

      return { images: newImgs, sessionId: result.sessionId };
    } finally {
      setIsUploading(false);
    }
  }, [sessionId]);

  const removeImage = useCallback((id: string) => {
    setImages((prev: ImageFile[]) => prev.filter((img: ImageFile) => img.id !== id));
  }, []);

  return {
    images,
    isUploading,
    sessionId,
    uploadImages,
    removeImage,
    hasImages: images.length > 0
  };
}; 