// @ts-nocheck
import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../constants';
import { ImageFile, UploadResponse } from '../types/slideshow.types';

// API call
const uploadImagesAPI = async (files: File[], sessionId: string): Promise<UploadResponse> => {
  const formData = new FormData();
  files.forEach((f) => formData.append('images', f, f.name));

  const res = await fetch(`${API_BASE_URL}/upload?sessionId=${sessionId}`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return res.json();
};

export const useImageManagement = (initialSessionId?: string) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionId, setSessionId] = useState(initialSessionId || '');

  const uploadImages = useCallback(async (files: File[]) => {
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

      setImages((prev) => [...prev, ...newImgs]);
      setSessionId(result.sessionId);

      return { images: newImgs, sessionId: result.sessionId };
    } finally {
      setIsUploading(false);
    }
  }, [sessionId]);

  const removeImage = useCallback((id: string) => setImages((prev) => prev.filter((img) => img.id !== id)), []);

  return {
    images,
    isUploading,
    sessionId,
    uploadImages,
    removeImage,
    hasImages: images.length > 0
  };
}; 