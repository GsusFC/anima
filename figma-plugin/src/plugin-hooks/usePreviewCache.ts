import { useState, useCallback, useRef } from 'react';
import { PreviewCache, CacheEntry, TimelineItem, ImageFile } from '../types/slideshow.types';

interface UsePreviewCacheReturn {
  getCachedPreview: (timeline: TimelineItem[], images: ImageFile[]) => string | null;
  setCachedPreview: (timeline: TimelineItem[], images: ImageFile[], previewUrl: string) => void;
  clearCache: () => void;
  getCacheSize: () => number;
}

const CACHE_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 50; // Maximum number of cached previews

// Generate hash for timeline configuration
const generateTimelineHash = (timeline: TimelineItem[], images: ImageFile[]): string => {
  const timelineData = timeline.map(item => ({
    imageId: item.imageId,
    duration: item.duration,
    position: item.position,
    transition: item.transition
  }));
  
  const imageData = images.map(img => ({
    id: img.id,
    name: img.name,
    size: img.size
  }));
  
  const combinedData = { timeline: timelineData, images: imageData };
  return btoa(JSON.stringify(combinedData)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
};

export const usePreviewCache = (): UsePreviewCacheReturn => {
  const [cache, setCache] = useState<PreviewCache>({});
  const cacheRef = useRef<PreviewCache>({});
  
  // Update cache ref when state changes
  cacheRef.current = cache;

  const getCachedPreview = useCallback((timeline: TimelineItem[], images: ImageFile[]): string | null => {
    const hash = generateTimelineHash(timeline, images);
    const entry = cacheRef.current[hash];
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      // Remove expired entry
      setCache(prev => {
        const updated = { ...prev };
        delete updated[hash];
        return updated;
      });
      return null;
    }
    
    return entry.data;
  }, []);

  const setCachedPreview = useCallback((timeline: TimelineItem[], images: ImageFile[], previewUrl: string): void => {
    const hash = generateTimelineHash(timeline, images);
    const now = Date.now();
    
    const newEntry: CacheEntry<string> = {
      data: previewUrl,
      timestamp: now,
      expiresAt: now + CACHE_EXPIRY_TIME
    };
    
    setCache(prev => {
      const updated = { ...prev, [hash]: newEntry };
      
      // If cache is too large, remove oldest entries
      const entries = Object.entries(updated);
      if (entries.length > MAX_CACHE_SIZE) {
        // Sort by timestamp and keep only the newest MAX_CACHE_SIZE entries
        const sortedEntries = entries.sort(([, a], [, b]) => b.timestamp - a.timestamp);
        const trimmedEntries = sortedEntries.slice(0, MAX_CACHE_SIZE);
        return Object.fromEntries(trimmedEntries);
      }
      
      return updated;
    });
  }, []);

  const clearCache = useCallback((): void => {
    setCache({});
  }, []);

  const getCacheSize = useCallback((): number => {
    return Object.keys(cacheRef.current).length;
  }, []);

  return {
    getCachedPreview,
    setCachedPreview,
    clearCache,
    getCacheSize
  };
};
