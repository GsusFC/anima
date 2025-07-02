// @ts-nocheck
import { useCallback } from 'react';
import { API_BASE_URL } from '../constants';
import { TimelineItem, ImageFile } from '../types/slideshow.types';

// --- Types -------------------------------------------------------------
export interface PreviewResponse {
  success: boolean;
  previewUrl: string;
  message?: string;
}

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

// --- Helpers -----------------------------------------------------------
const generatePreviewAPI = async (payload: any): Promise<PreviewResponse> => {
  const res = await fetch(`${API_BASE_URL}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// --- Hook --------------------------------------------------------------
export const usePreviewGeneration = ({
  timeline,
  images,
  sessionId,
  updatePreviewState
}: UsePreviewGenerationProps): PreviewActions => {
  // Build & call preview endpoint
  const generatePreview = useCallback(async () => {
    if (timeline.length === 0) return;

    updatePreviewState({ isGenerating: true, error: null });

    try {
      const payload = {
        images: timeline.map(item => {
          const img = images.find(i => i.id === item.imageId);
          const filename = img?.uploadedInfo?.filename || img?.name;
          return { filename };
        }),
        transitions: timeline.slice(0, -1).map(item => ({
          type: item.transition?.type || 'cut',
          duration: item.transition?.duration || 0
        })),
        frameDurations: timeline.map(item => item.duration),
        sessionId
      };

      if (!payload.sessionId) throw new Error('No session ID. Upload images first.');
      if (payload.images.length === 0) throw new Error('No images in timeline.');

      const result = await generatePreviewAPI(payload);

      if (result.success) {
        const videoUrl = `${API_BASE_URL}${result.previewUrl}?t=${Date.now()}`;
        updatePreviewState({ url: videoUrl, isGenerating: false, error: null });
      } else {
        throw new Error(result.message || 'Preview generation failed');
      }
    } catch (err: any) {
      console.error('Preview generation failed', err);
      updatePreviewState({
        isGenerating: false,
        error: err?.message || 'Preview generation failed'
      });
    }
  }, [timeline, images, sessionId, updatePreviewState]);

  const clearPreview = useCallback(() => {
    updatePreviewState({ url: null, error: null });
  }, [updatePreviewState]);

  return { generatePreview, clearPreview };
}; 