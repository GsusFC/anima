import { useState, useCallback } from 'react';
import { 
  VideoProject, 
  VideoFile, 
  VideoTimelineItem,
  VideoExportSettings,
  TimelineItem
} from '../types/video-editor.types';

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

const generateVideoThumbnails = async (file: File, duration: number, count: number = 10): Promise<string[]> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const thumbnails: string[] = [];
    let currentIndex = 0;
    
    video.onloadeddata = () => {
      canvas.width = 160;
      canvas.height = 90;
      
      const captureFrame = () => {
        if (currentIndex >= count) {
          URL.revokeObjectURL(video.src);
          resolve(thumbnails);
          return;
        }
        
        const time = (currentIndex / (count - 1)) * duration;
        video.currentTime = time;
      };
      
      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        thumbnails.push(canvas.toDataURL('image/jpeg', 0.7));
        currentIndex++;
        captureFrame();
      };
      
      captureFrame();
    };
    
    video.src = URL.createObjectURL(file);
  });
};

const extractVideoMetadata = async (file: File): Promise<VideoFile> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = async () => {
      const thumbnails = await generateVideoThumbnails(file, video.duration);
      
      const videoFile: VideoFile = {
        file,
        id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        duration: video.duration,
        fps: (() => {
          // Attempt to derive FPS from VideoPlaybackQuality if supported
          try {
            // Safari/WebKit may not support it; wrap in try
            const q: any = (video as any).getVideoPlaybackQuality?.();
            if (q && q.totalVideoFrames && video.duration > 0) {
              const calc = q.totalVideoFrames / video.duration;
              if (!isNaN(calc) && calc > 0) return Math.round(calc);
            }
          } catch {/* ignore */}
          return 30;
        })(),
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
        thumbnails,
        addedAt: new Date()
      };
      
      URL.revokeObjectURL(video.src);
      resolve(videoFile);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      // Fallback with default values
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
};

export const useVideoEditorMulti = () => {
  const [project, setProject] = useState<VideoProject>({
    id: `project_${Date.now()}`,
    library: {
      videos: [],
      selectedVideoId: null
    },
    sequence: {
      items: [],
      totalDuration: 0
    },
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

  // Video Library Management
  const addVideoToLibrary = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Extract metadata from video file
      const videoFile = await extractVideoMetadata(file);
      
      // Upload to backend (when endpoint is ready)
      try {
        const uploadResult = await uploadVideoFile(file);
        videoFile.uploadedInfo = uploadResult;
      } catch (uploadError) {
        console.warn('Backend upload failed, continuing with local file:', uploadError);
        // Continue without upload for now - will work once backend is ready
      }

      setProject(prev => ({
        ...prev,
        library: {
          ...prev.library,
          videos: [...prev.library.videos, videoFile]
        }
      }));

      console.log('✅ Video added to library:', {
        name: file.name,
        duration: videoFile.duration,
        resolution: `${videoFile.width}×${videoFile.height}`,
        size: `${(file.size / 1024 / 1024).toFixed(1)}MB`
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load video';
      setError(errorMessage);
      console.error('❌ Video upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const removeVideoFromLibrary = useCallback((videoId: string) => {
    setProject(prev => {
      // Remove from library
      const updatedLibrary = {
        ...prev.library,
        videos: prev.library.videos.filter(v => v.id !== videoId),
        selectedVideoId: prev.library.selectedVideoId === videoId ? null : prev.library.selectedVideoId
      };

      // Remove from sequence
      const updatedSequence = {
        ...prev.sequence,
        items: prev.sequence.items.filter(item => 
          item.type !== 'video' || (item as VideoTimelineItem).videoId !== videoId
        )
      };

      // Recalculate sequence duration
      updatedSequence.totalDuration = calculateSequenceDuration(updatedSequence.items);

      return {
        ...prev,
        library: updatedLibrary,
        sequence: updatedSequence
      };
    });
  }, []);

  const selectVideo = useCallback((videoId: string | null) => {
    setProject(prev => ({
      ...prev,
      library: {
        ...prev.library,
        selectedVideoId: videoId
      }
    }));
  }, []);

  // Timeline/Sequence Management
  const addVideoToSequence = useCallback((videoId: string, position?: number) => {
    setProject(prev => {
      const video = prev.library.videos.find(v => v.id === videoId);
      if (!video) return prev;

      const sequencePosition = position ?? prev.sequence.totalDuration;

      const newVideoItem: VideoTimelineItem = {
        id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'video',
        videoId,
        position: sequencePosition,
        duration: video.duration,
        startTime: 0,
        endTime: video.duration,
        speed: 1,
        effects: []
      };

      const updatedItems = [...prev.sequence.items, newVideoItem]
        .sort((a, b) => a.position - b.position);

      const updatedSequence = {
        items: updatedItems,
        totalDuration: calculateSequenceDuration(updatedItems)
      };

      return {
        ...prev,
        sequence: updatedSequence
      };
    });
  }, []);

  const removeItemFromSequence = useCallback((itemId: string) => {
    setProject(prev => {
      const updatedItems = prev.sequence.items.filter(item => item.id !== itemId);
      const updatedSequence = {
        items: updatedItems,
        totalDuration: calculateSequenceDuration(updatedItems)
      };

      return {
        ...prev,
        sequence: updatedSequence
      };
    });
  }, []);

  const moveSequenceItem = useCallback((itemId: string, newPosition: number) => {
    setProject(prev => {
      const updatedItems = prev.sequence.items.map(item =>
        item.id === itemId ? { ...item, position: newPosition } : item
      ).sort((a, b) => a.position - b.position);

      const updatedSequence = {
        items: updatedItems,
        totalDuration: calculateSequenceDuration(updatedItems)
      };

      return {
        ...prev,
        sequence: updatedSequence
      };
    });
  }, []);

  const updateVideoItem = useCallback((itemId: string, updates: Partial<VideoTimelineItem>) => {
    setProject(prev => {
      const updatedItems = prev.sequence.items.map(item =>
        item.id === itemId && item.type === 'video' 
          ? { ...item, ...updates } 
          : item
      );

      const updatedSequence = {
        items: updatedItems,
        totalDuration: calculateSequenceDuration(updatedItems)
      };

      return {
        ...prev,
        sequence: updatedSequence
      };
    });
  }, []);

  // Export
  const setExportSettings = useCallback((settings: VideoExportSettings) => {
    setProject(prev => ({
      ...prev,
      exportSettings: settings
    }));
  }, []);

  // Utilities
  const getSequenceDuration = useCallback(() => {
    return project.sequence.totalDuration;
  }, [project.sequence.totalDuration]);

  const getVideoById = useCallback((videoId: string): VideoFile | null => {
    return project.library.videos.find(v => v.id === videoId) || null;
  }, [project.library.videos]);

  const clearProject = useCallback(() => {
    setProject({
      id: `project_${Date.now()}`,
      library: {
        videos: [],
        selectedVideoId: null
      },
      sequence: {
        items: [],
        totalDuration: 0
      },
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
    hasVideos: project.library.videos.length > 0,
    hasSequence: project.sequence.items.length > 0,
    addVideoToLibrary,
    removeVideoFromLibrary,
    selectVideo,
    addVideoToSequence,
    removeItemFromSequence,
    moveSequenceItem,
    updateVideoItem,
    setExportSettings,
    getSequenceDuration,
    getVideoById,
    clearProject
  };
};

// Helper function to calculate sequence duration
function calculateSequenceDuration(items: TimelineItem[]): number {
  if (items.length === 0) return 0;
  
  let maxEndTime = 0;
  
  for (const item of items) {
    const itemEndTime = item.position + item.duration;
    if (itemEndTime > maxEndTime) {
      maxEndTime = itemEndTime;
    }
  }
  
  return maxEndTime;
}
