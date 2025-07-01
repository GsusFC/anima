import { useCallback } from 'react';
import { TimelineItem, ImageFile, PreviewResponse } from '../types/slideshow.types';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : window.location.origin;

// API function for preview generation
const generatePreviewAPI = async (payload: any): Promise<PreviewResponse> => {
  const response = await fetch(`${API_BASE_URL}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

export interface PreviewState {
  url: string | null;
  isGenerating: boolean;
  error: string | null;
}

export interface PreviewActions {
  generatePreview: () => Promise<void>;
  clearPreview: () => void;
}

export interface UsePreviewGenerationProps {
  timeline: TimelineItem[];
  images: ImageFile[];
  sessionId?: string;
  updatePreviewState: (updates: Partial<PreviewState>) => void;
}

export const usePreviewGeneration = ({
  timeline,
  images,
  sessionId,
  updatePreviewState
}: UsePreviewGenerationProps): PreviewActions => {
  
  const generatePreview = useCallback(async () => {
    if (timeline.length === 0) return;

    updatePreviewState({ 
      isGenerating: true, 
      error: null 
    });

    try {
      const payload = {
        images: timeline.map(item => {
          const image = images.find(img => img.id === item.imageId);
          const filename = image?.uploadedInfo?.filename || image?.name;
          console.log(`🔍 Timeline item ${item.id} → image ${image?.id} → filename: ${filename}`);
          return { filename };
        }),
        transitions: timeline.slice(0, -1).map(item => ({
          type: item.transition?.type || 'cut', // Default to 'cut' (no transition)
          duration: item.transition?.duration || 0 // No duration for cuts
        })),
        frameDurations: timeline.map(item => item.duration),
        sessionId: sessionId
      };

      console.log('🎬 Preview payload:', payload);
      console.log('🔍 State project:', {
        timelineLength: timeline.length,
        imagesLength: images.length,
        sessionId: sessionId
      });
      
      if (!payload.sessionId) {
        throw new Error('No session ID available. Please upload images first.');
      }

      if (payload.images.length === 0) {
        throw new Error('No images in timeline. Please add images to timeline first.');
      }

      const result = await generatePreviewAPI(payload);
      
      console.log('🎬 Preview result:', result);
      
      if (result.success) {
        const videoUrl = `${API_BASE_URL}${result.previewUrl}?t=${Date.now()}`;
        console.log('🎬 Preview video URL:', videoUrl);
        updatePreviewState({
          url: videoUrl,
          isGenerating: false,
          error: null
        });
      } else {
        throw new Error(result.message || 'Preview generation failed');
      }
    } catch (error) {
      console.error('❌ Preview generation failed:', error);
      updatePreviewState({
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Preview generation failed'
      });
    }
  }, [timeline, images, sessionId, updatePreviewState]);

  const clearPreview = useCallback(() => {
    updatePreviewState({ 
      url: null, 
      error: null 
    });
  }, [updatePreviewState]);

  return {
    generatePreview,
    clearPreview
  };
};
