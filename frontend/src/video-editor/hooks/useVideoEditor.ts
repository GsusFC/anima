import { useState, useCallback } from 'react';
import { LegacyVideoProject, VideoFile, VideoSegment } from '../types/video-editor.types';

// Video-specific API functions
const uploadVideoFile = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('video', file);
  
  const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : window.location.origin;

  const response = await fetch(`${API_BASE_URL}/video-editor/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Video upload failed: ${response.statusText}`);
  }

  return response.json();
};

// Trim video API function
// Legacy function - commented out as it's no longer used (UI-only trimming)
/*
const _trimVideoFile = async (videoPath: string, startTime: number, endTime: number): Promise<any> => {
  const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : window.location.origin;

  const response = await fetch(`${API_BASE_URL}/video-editor/trim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      videoPath,
      startTime,
      endTime,
      sessionId: Date.now().toString()
    }),
  });

  if (!response.ok) {
    throw new Error(`Video trim failed: ${response.statusText}`);
  }

  return response.json();
};
*/

const generateVideoThumbnails = async (file: File, duration: number, count: number = 8): Promise<string[]> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const thumbnails: string[] = [];
    let currentIndex = 0;
    
    // Optimize canvas size - smaller for faster processing
    video.onloadeddata = () => {
      canvas.width = 80;
      canvas.height = 45;
      
      const captureFrame = () => {
        if (currentIndex >= count) {
          URL.revokeObjectURL(video.src);
          resolve(thumbnails);
          return;
        }
        
        const time = (currentIndex / (count - 1)) * duration;
        video.currentTime = time;
      };
      
      let seekTimeout: number;
      video.onseeked = () => {
        // Debounce rapid seek events
        clearTimeout(seekTimeout);
        seekTimeout = setTimeout(() => {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            thumbnails.push(canvas.toDataURL('image/jpeg', 0.3)); // Much lower quality for speed
            currentIndex++;
            captureFrame();
          } catch (error) {
            console.warn('Thumbnail generation error:', error);
            currentIndex++;
            captureFrame();
          }
        }, 50);
      };
      
      // Set video properties for faster seeking
      video.preload = 'metadata';
      captureFrame();
    };
    
    video.onerror = () => {
      console.warn('Video thumbnail generation failed');
      URL.revokeObjectURL(video.src);
      resolve([]); // Return empty array on error
    };
    
    video.src = URL.createObjectURL(file);
  });
};

// Removed extractVideoMetadata - now handled inline in uploadVideo for speed

export const useVideoEditor = () => {
  const [project, setProject] = useState<LegacyVideoProject>({
    id: `project_${Date.now()}`,
    video: null,
    segments: [],
    effects: [],
    exportSettings: {
      format: 'mp4',
      quality: 'standard',
      resolution: {
        width: 1920,
        height: 1080,
        preset: 'original'
      },
      fps: 30
    }
  });

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadVideo = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      console.log('📹 Starting video upload and processing...', `File size: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      
      // Quick metadata extraction without thumbnails
      const videoMetadata = await new Promise<VideoFile>((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          const videoFile: VideoFile = {
            file,
            id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            duration: video.duration,
            fps: 30,
            width: video.videoWidth,
            height: video.videoHeight,
            size: file.size,
            thumbnails: [], // Empty initially
            addedAt: new Date()
          };
          
          URL.revokeObjectURL(video.src);
          resolve(videoFile);
        };
        
        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          resolve({
            file,
            id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            duration: 0,
            fps: 30,
            width: 1920,
            height: 1080,
            size: file.size,
            thumbnails: [],
            addedAt: new Date()
          });
        };
        
        video.src = URL.createObjectURL(file);
      });

      console.log('⚡ Video metadata extracted quickly!');
      
      // Upload to backend (when endpoint is ready)
      console.log('🌐 Uploading to backend...');
      try {
        const uploadResult = await uploadVideoFile(file);
        console.log('✅ Backend upload successful!', uploadResult);
        videoMetadata.uploadedInfo = uploadResult;
        // Server path is now stored in uploadedInfo.path
      } catch (uploadError) {
        console.warn('⚠️ Backend upload failed, continuing with local file:', uploadError);
      }

      // Create initial full-video segment
      const initialSegment: VideoSegment = {
        id: `segment_${Date.now()}`,
        startTime: 0,
        endTime: videoMetadata.duration,
        originalStart: 0,
        originalEnd: videoMetadata.duration
      };

      // Set project immediately with basic metadata
      setProject(prev => {
        const newProject = {
          ...prev,
          video: videoMetadata,
          segments: [initialSegment]
        };
        console.log('✅ Video loaded immediately:', {
          name: file.name,
          duration: videoMetadata.duration,
          resolution: `${videoMetadata.width}×${videoMetadata.height}`,
          size: `${(file.size / 1024 / 1024).toFixed(1)}MB`
        });
        return newProject;
      });

      setIsUploading(false);

      // Generate thumbnails in background
      console.log('🖼️ Generating thumbnails in background...');
      generateVideoThumbnails(file, videoMetadata.duration).then(thumbnails => {
        console.log('✅ Thumbnails generated!', thumbnails.length);
        setProject(prev => {
          if (prev.video?.id === videoMetadata.id) {
            return {
              ...prev,
              video: {
                ...prev.video,
                thumbnails
              }
            };
          }
          return prev;
        });
      }).catch(err => {
        console.warn('Thumbnail generation failed:', err);
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load video';
      setError(errorMessage);
      console.error('❌ Video upload error:', err);
      setIsUploading(false);
    }
  }, []);

  const addSegment = useCallback((startTime: number, endTime: number) => {
    if (!project.video) return;

    const newSegment: VideoSegment = {
      id: `segment_${Date.now()}`,
      startTime,
      endTime,
      originalStart: startTime,
      originalEnd: endTime
    };

    setProject(prev => ({
      ...prev,
      segments: [...prev.segments, newSegment]
    }));
  }, [project.video]);

  const updateSegment = useCallback((segmentId: string, updates: Partial<VideoSegment>) => {
    setProject(prev => ({
      ...prev,
      segments: prev.segments.map(segment =>
        segment.id === segmentId ? { ...segment, ...updates } : segment
      )
    }));
  }, []);

  const removeSegment = useCallback((segmentId: string) => {
    setProject(prev => ({
      ...prev,
      segments: prev.segments.filter(segment => segment.id !== segmentId)
    }));
  }, []);

  const trimVideo = useCallback(async (segmentId: string, startTime: number, endTime: number) => {
    // UI-only trim - instant feedback, no backend processing
    console.log(`✂️ UI Trim segment ${segmentId}: ${startTime.toFixed(3)}s - ${endTime.toFixed(3)}s`);
    
    // Simply update the segment timestamps - processing happens at export
    updateSegment(segmentId, {
      startTime,
      endTime
    });

    console.log('✅ Segment updated instantly (UI-only)');
    return { success: true, message: 'Segment trimmed in UI' };
  }, [updateSegment]);

  const clearProject = useCallback(() => {
    setProject({
      id: `project_${Date.now()}`,
      video: null,
      segments: [],
      effects: [],
      exportSettings: {
        format: 'mp4',
        quality: 'standard',
        resolution: {
          width: 1920,
          height: 1080,
          preset: 'original'
        },
        fps: 30
      }
    });
    setError(null);
  }, []);

  return {
    project,
    isUploading,
    error,
    hasVideo: !!project.video,
    uploadVideo,
    addSegment,
    updateSegment,
    removeSegment,
    trimVideo,
    clearProject
  };
};
