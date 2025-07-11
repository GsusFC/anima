import { useState, useCallback } from 'react';
import { VideoFile, LegacyVideoProject } from '../types/video-editor.types';

// Video-specific API functions
const uploadVideoFile = async (file: File, sessionId?: string): Promise<any> => {
  const formData = new FormData();
  formData.append('video', file);
  
  const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
    : window.location.origin;

  // Generate sessionId if not provided
  const currentSessionId = sessionId || `session_${Date.now()}`;
  
  const response = await fetch(`${API_BASE_URL}/video-editor/upload?sessionId=${currentSessionId}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Video upload failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Hook specialized in video upload and management
 */
export const useVideoManagement = (sessionId: string, setProject: React.Dispatch<React.SetStateAction<LegacyVideoProject>>) => {
  const [isUploading, setIsUploading] = useState(false);

  // Generate thumbnails for video preview
  const generateThumbnails = useCallback(async (videoElement: HTMLVideoElement, count: number = 8): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      console.log('🎬 Starting thumbnail generation for', count, 'thumbnails, duration:', videoElement.duration);
      const thumbnails: string[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('❌ Canvas context not available');
        resolve([]);
        return;
      }
      
      // Ensure video is ready
      if (videoElement.readyState < 3) {
        console.warn('⚠️ Video not ready, waiting...');
        videoElement.addEventListener('canplay', () => {
          generateThumbnails(videoElement, count).then(resolve).catch(reject);
        }, { once: true });
        return;
      }

      // Optimize canvas size - smaller for faster processing
      const maxWidth = 160;
      const maxHeight = 90;
      
      const videoAspect = videoElement.videoWidth / videoElement.videoHeight;
      if (videoAspect > maxWidth / maxHeight) {
        canvas.width = maxWidth;
        canvas.height = maxWidth / videoAspect;
      } else {
        canvas.height = maxHeight;
        canvas.width = maxHeight * videoAspect;
      }

      let processed = 0;
      let isGenerating = false;
      
      const generateNextThumbnail = async () => {
        if (isGenerating || processed >= count) return;
        isGenerating = true;
        
        try {
          const time = (videoElement.duration / (count - 1)) * processed; // Include start and end
          console.log(`🔄 Seeking to ${time.toFixed(2)}s for thumbnail ${processed + 1}/${count}`);
          
          // Set current time and wait for seek
          videoElement.currentTime = Math.min(time, videoElement.duration - 0.1);
          
          // Wait a moment for seek to complete
          await new Promise(resolve => setTimeout(resolve, 150));
          
          // Capture frame
          if (videoElement.readyState >= 2) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL('image/jpeg', 0.4);
            thumbnails.push(dataURL);
            console.log(`📸 Generated thumbnail ${processed + 1}/${count} at ${time.toFixed(2)}s`);
          } else {
            console.warn(`⚠️ Video not ready for thumbnail ${processed + 1}/${count}`);
          }
          
          processed++;
          isGenerating = false;
          
          // Generate next thumbnail
          if (processed < count) {
            setTimeout(generateNextThumbnail, 200); // Slower but more reliable
          } else {
            console.log('✅ All thumbnails generated:', thumbnails.length);
            resolve(thumbnails);
          }
        } catch (error) {
          console.error('❌ Error generating thumbnail:', error);
          processed++;
          isGenerating = false;
          
          if (processed < count) {
            setTimeout(generateNextThumbnail, 200);
          } else {
            resolve(thumbnails);
          }
        }
      };

      // Ensure video is paused during thumbnail generation
      const wasPaused = videoElement.paused;
      if (!wasPaused) {
        videoElement.pause();
      }
      
      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Thumbnail generation timeout, resolving with partial thumbnails');
        resolve(thumbnails);
      }, 20000); // 20 second timeout
      
      // Override resolve to clear timeout and restore state
      const originalResolve = resolve;
      resolve = (result) => {
        clearTimeout(timeoutId);
        if (!wasPaused) {
          videoElement.play().catch(() => {});
        }
        originalResolve(result);
      };
      
      // Start generating thumbnails
      console.log('🚀 Starting thumbnail generation process');
      generateNextThumbnail();
    });
  }, [setProject]);

  const uploadVideo = useCallback(async (file: File): Promise<VideoFile | null> => {
    setIsUploading(true);
    try {
      // Quick metadata extraction without thumbnails
      const videoElement = document.createElement('video');
      videoElement.src = URL.createObjectURL(file);
      
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = resolve;
      });

      const videoMetadata: VideoFile = {
        file,
        id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        duration: videoElement.duration,
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
        thumbnails: [], // Empty initially
        addedAt: new Date(),
        videoUrl: URL.createObjectURL(file)
      };

      // Generate thumbnails in background
      generateThumbnails(videoElement, 8).then(thumbnails => {
        console.log('🎥 Generated thumbnails:', thumbnails.length, 'URLs:', thumbnails.slice(0, 2));
        videoMetadata.thumbnails = thumbnails;
        // Update the project state to trigger re-render
        setProject((prev: LegacyVideoProject) => ({
          ...prev,
          video: {
            ...prev.video!,
            thumbnails
          }
        }));
      }).catch(error => {
        console.error('❌ Thumbnail generation failed:', error);
      });

      // Upload to backend (when endpoint is ready)
      try {
        const uploadResult = await uploadVideoFile(file, sessionId);
        console.log('✅ Video uploaded successfully:', uploadResult);
        
        videoMetadata.uploadedInfo = uploadResult.video; // Extract video object
      } catch (error) {
        console.warn('⚠️ Backend upload failed, using local file:', error);
      }

      URL.revokeObjectURL(videoElement.src);
      return videoMetadata;
    } catch (error) {
      console.error('❌ Video upload failed:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [sessionId, generateThumbnails]);

  return {
    uploadVideo,
    generateThumbnails,
    isUploading
  };
};
