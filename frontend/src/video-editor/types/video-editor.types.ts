// Multi-Video Editor Types - Professional Architecture

export interface VideoFile {
  file: File;
  id: string;
  name: string;           // Display name
  duration: number;
  fps?: number;
  width: number;
  height: number;
  size: number;
  thumbnails: string[];
  uploadedInfo?: UploadedVideoInfo;
  sessionId?: string;     // Session ID for backend file tracking
  addedAt: Date;          // When added to library
  videoUrl?: string;      // Local or remote video URL
}

export interface UploadedVideoInfo {
  filename: string;
  path: string;
  sessionId: string;
  metadata: VideoMetadata;
}

export interface VideoMetadata {
  duration: number;
  fps: number;
  width: number;
  height: number;
  bitrate: number;
  codec: string;
  hasAudio: boolean;
}

// Timeline items can be videos or transitions
export interface TimelineItem {
  id: string;
  type: 'video' | 'transition';
  position: number;       // Position in timeline (seconds)
  duration: number;       // Duration of this item
}

export interface VideoTimelineItem extends TimelineItem {
  type: 'video';
  videoId: string;        // Reference to VideoFile
  startTime: number;      // Trim start in original video
  endTime: number;        // Trim end in original video
  speed: number;          // Playback speed (0.25x - 4x)
  effects: VideoEffect[];
}

export interface TransitionTimelineItem extends TimelineItem {
  type: 'transition';
  transitionType: TransitionType;
  parameters: Record<string, any>;
}

export interface VideoLibrary {
  videos: VideoFile[];
  selectedVideoId: string | null;
}

export interface VideoSequence {
  items: TimelineItem[];
  totalDuration: number;
}

export interface VideoProject {
  id: string;
  library: VideoLibrary;
  sequence: VideoSequence;
  exportSettings: VideoExportSettings;
}

export interface VideoEffect {
  id: string;
  type: 'filter' | 'adjustment';
  name: string;
  parameters: Record<string, any>;
}

export type TransitionType = 'cut' | 'fade' | 'slide' | 'zoom' | 'wipe' | 'dissolve';

// Type for quality settings values
export type QualityValue = 'web' | 'standard' | 'high' | 'max';

// Type for resolution preset values  
export type ResolutionPreset = 'original' | 'large' | 'medium' | 'small' | 'custom';

// Type for GIF loop settings
export type GIFLoopValue = 'infinite' | 'once' | '3' | '5';

// Type for GIF color palette settings
export type GIFColorValue = 256 | 128 | 64 | 32;

export interface VideoExportSettings {
  format: 'mp4' | 'webm' | 'mov' | 'gif';
  quality: QualityValue;
  resolution: {
    width: number;
    height: number;
    preset: ResolutionPreset;
  };
  fps: number;
  bitrate?: string;
  gif?: {
    loop: GIFLoopValue;
    colors: GIFColorValue;
    dither: boolean;
  };
}

export interface VideoThumbnail {
  time: number;
  dataUrl: string;
  keyframe: boolean;
}

export interface VideoTimelineState {
  currentTime: number;
  zoom: number;
  viewportStart: number;
  viewportEnd: number;
  isPlaying: boolean;
  isDragging: boolean;
}

// Legacy single-video types for compatibility
export interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
  originalStart?: number;
  originalEnd?: number;
  videoId?: string;
  createdAt?: Date;
  // Note: No more trimmedPath - segments are now UI-only until export
}

// Type for partial updates to video segments
export type VideoSegmentUpdate = Partial<Pick<VideoSegment, 'startTime' | 'endTime' | 'originalStart' | 'originalEnd'>>;

export interface LegacyVideoProject {
  id: string;
  video: VideoFile | null;
  segments: VideoSegment[];
  effects?: VideoEffect[];
  exportSettings?: Partial<VideoExportSettings>;
  sessionId?: string;
}


