import { useCallback } from 'react';
import { apiService } from '../services/api';
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
  console.log(`🌐 Making preview API call using apiService`);
  console.log(`📤 Payload:`, payload);
  
  try {
    const result = await apiService.post<PreviewResponse>('/preview', payload);
    console.log(`✅ Preview API response:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Preview API error:`, error);
    throw error;
  }
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
          const filename = img?.uploadedInfo?.filename || img?.file?.name || img?.name;
          return { filename };
        }),
        transitions: timeline.slice(0, -1).map(item => ({
          type: item.transition?.type || 'cut',
          duration: item.transition?.duration || 0
        })),
        frameDurations: timeline.map(item => item.duration),
        sessionId
      };

      console.log('🔍 Preview generation debug info:', {
        timelineLength: timeline.length,
        imagesLength: images.length,
        sessionId: sessionId
      });

      console.log('📸 Images data:', images.map(img => ({
        id: img.id,
        name: img.name,
        hasUploadInfo: !!img.uploadedInfo,
        filename: img.uploadedInfo?.filename || img.file?.name || img.name
      })));

      console.log('⏱️ Timeline data:', timeline.map(item => ({
        id: item.id,
        imageId: item.imageId,
        duration: item.duration
      })));

      console.log('🔍 Preview payload being sent:', {
        sessionId: payload.sessionId,
        imagesCount: payload.images.length,
        imageFilenames: payload.images.map(img => img.filename),
        frameDurations: payload.frameDurations,
        transitions: payload.transitions
      });

      if (!payload.sessionId) throw new Error('No session ID. Upload images first.');
      if (payload.images.length === 0) throw new Error('No images in timeline.');

      // Check for missing filenames
      const missingFilenames = payload.images.filter(img => !img.filename);
      if (missingFilenames.length > 0) {
        console.error('⚠️ Some images missing filenames:', missingFilenames);
        throw new Error(`${missingFilenames.length} images missing filenames. Re-upload images.`);
      }

      const result = await generatePreviewAPI(payload);

      if (result.success) {
        const videoUrl = `${apiService.getBaseURL()}${result.previewUrl}?t=${Date.now()}`;
        console.log(`🎥 Preview video URL: ${videoUrl}`);
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