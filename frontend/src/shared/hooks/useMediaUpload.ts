import { useState, useCallback, useRef } from 'react';
import { MediaItem, UploadConfig, MediaValidator } from '../types/media.types';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  file: File;
}

interface UploadError {
  file: File;
  error: string;
  code?: string;
}

interface UseMediaUploadOptions {
  config: UploadConfig;
  onSuccess?: (items: MediaItem[]) => void;
  onError?: (errors: UploadError[]) => void;
  onProgress?: (progress: UploadProgress[]) => void;
  validators?: MediaValidator[];
  uploadEndpoint?: string;
  generatePreview?: boolean;
}

interface UseMediaUploadReturn {
  // State
  isUploading: boolean;
  progress: UploadProgress[];
  errors: UploadError[];
  uploadedItems: MediaItem[];
  
  // Actions
  uploadFiles: (files: File[]) => Promise<MediaItem[]>;
  cancelUpload: () => void;
  clearErrors: () => void;
  clearUploaded: () => void;
  
  // Utilities
  validateFile: (file: File) => string | null;
  generatePreviewUrl: (file: File) => Promise<string>;
  createMediaItem: (file: File, preview?: string) => MediaItem;
}

export const useMediaUpload = (
  options: UseMediaUploadOptions
): UseMediaUploadReturn => {
  const {
    config,
    onSuccess,
    onError,

    validators = [],
    uploadEndpoint = '/api/upload',
    generatePreview = true,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [errors, setErrors] = useState<UploadError[]>([]);
  const [uploadedItems, setUploadedItems] = useState<MediaItem[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;
    
    const isAccepted = config.accept.some(acceptedType => {
      if (acceptedType.startsWith('.')) {
        return fileExtension === acceptedType.toLowerCase();
      }
      if (acceptedType.includes('/*')) {
        return mimeType.startsWith(acceptedType.split('/')[0]);
      }
      return mimeType === acceptedType;
    });

    if (!isAccepted) {
      return `File type not supported. Accepted types: ${config.accept.join(', ')}`;
    }

    // Check file size
    if (config.maxSize && file.size > config.maxSize) {
      const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }

    // Run custom validators
    for (const validator of validators) {
      const result = validator(file);
      if (typeof result === 'string') {
        return result;
      }
      if (result === false) {
        return 'File validation failed';
      }
    }

    return null;
  }, [config, validators]);

  const generatePreviewUrl = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!generatePreview) {
        resolve('');
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to generate preview'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        // For videos, we might want to generate a thumbnail
        // For now, just return empty string
        resolve('');
      } else {
        resolve('');
      }
    });
  }, [generatePreview]);

  const createMediaItem = useCallback((file: File, preview?: string): MediaItem => {
    const now = new Date();
    const isVideo = file.type.startsWith('video/');
    
    const baseItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      preview,
      createdAt: now,
      updatedAt: now,
    };

    if (isVideo) {
      return {
        ...baseItem,
        type: 'video' as const,
        duration: 0, // Will be updated after video metadata is loaded
        dimensions: { width: 0, height: 0 },
        thumbnails: [],
      };
    } else {
      return {
        ...baseItem,
        type: 'image' as const,
      };
    }
  }, []);

  const uploadSingleFile = useCallback(async (
    file: File,
    _index: number
  ): Promise<MediaItem> => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    // Generate preview
    let preview = '';
    try {
      preview = await generatePreviewUrl(file);
    } catch (error) {
      console.warn('Failed to generate preview for', file.name, error);
    }

    // Create media item
    const mediaItem = createMediaItem(file, preview);

    // If auto-upload is disabled, return the item without uploading
    if (!config.autoUpload) {
      return mediaItem;
    }

    // Upload file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', mediaItem.type);

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
      signal: abortControllerRef.current?.signal,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const uploadResult = await response.json();
    
    // Update media item with upload info
    return {
      ...mediaItem,
      uploadedInfo: {
        filename: uploadResult.filename,
        path: uploadResult.path,
        sessionId: uploadResult.sessionId,
        uploadedAt: new Date(),
      },
    };
  }, [validateFile, generatePreviewUrl, createMediaItem, config, uploadEndpoint]);

  const uploadFiles = useCallback(async (files: File[]): Promise<MediaItem[]> => {
    if (isUploading) {
      throw new Error('Upload already in progress');
    }

    // Check file count limit
    if (config.maxFiles && files.length > config.maxFiles) {
      throw new Error(`Too many files. Maximum: ${config.maxFiles}`);
    }

    setIsUploading(true);
    setProgress([]);
    setErrors([]);
    
    // Create abort controller
    abortControllerRef.current = new AbortController();

    const uploadPromises: Promise<MediaItem>[] = [];
    const newErrors: UploadError[] = [];
    const newItems: MediaItem[] = [];

    try {
      // Start uploads
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const uploadPromise = uploadSingleFile(file, i)
          .then((item) => {
            newItems.push(item);
            return item;
          })
          .catch((error) => {
            const uploadError: UploadError = {
              file,
              error: error.message,
              code: error.code,
            };
            newErrors.push(uploadError);
            throw uploadError;
          });

        uploadPromises.push(uploadPromise);
      }

      // Wait for all uploads to complete
      const results = await Promise.allSettled(uploadPromises);
      
      // Separate successful uploads from errors
      const successfulItems: MediaItem[] = [];
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          successfulItems.push(result.value);
        }
      });

      // Update state
      setUploadedItems(prev => [...prev, ...successfulItems]);
      setErrors(prev => [...prev, ...newErrors]);

      // Call callbacks
      if (successfulItems.length > 0) {
        onSuccess?.(successfulItems);
      }
      if (newErrors.length > 0) {
        onError?.(newErrors);
      }

      return successfulItems;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setProgress([]);
      abortControllerRef.current = null;
    }
  }, [isUploading, config, uploadSingleFile, onSuccess, onError]);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setProgress([]);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearUploaded = useCallback(() => {
    setUploadedItems([]);
  }, []);

  return {
    // State
    isUploading,
    progress,
    errors,
    uploadedItems,
    
    // Actions
    uploadFiles,
    cancelUpload,
    clearErrors,
    clearUploaded,
    
    // Utilities
    validateFile,
    generatePreviewUrl,
    createMediaItem,
  };
};
