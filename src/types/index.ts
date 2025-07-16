import { Socket } from 'socket.io';
import { Request } from 'express';

/**
 * Represents an image file in the system
 */
export interface ImageFile {
  /** Unique identifier for the image */
  id?: string;
  /** Filename of the image on disk */
  filename: string;
  /** Original name of the uploaded file */
  originalname?: string;
  /** Alternative field for original name (for compatibility) */
  originalName?: string;
  /** File path on disk */
  path?: string;
  /** File size in bytes */
  size?: number;
  /** MIME type of the file */
  mimetype?: string;
  /** Base64 encoded image data (for Railway compatibility) */
  base64Data?: string;
  /** Additional metadata for the image */
  metadata?: any;
  /** Order position in a sequence */
  order?: number;
  /** Selection index from Figma plugin */
  selectionIndex?: number;
}

/**
 * Represents a transition between two images
 */
export interface Transition {
  /** Type of transition (fade, slide, etc.) */
  type: string;
  /** Duration of transition in milliseconds */
  duration: number;
  /** ID of the source frame (null for first frame) */
  fromFrameId?: string | null;
  /** ID of the destination frame */
  toFrameId?: string;
}

/**
 * Represents a composition of images and transitions
 */
export interface Composition {
  /** Unique identifier for the composition */
  id: string;
  /** Session ID associated with this composition */
  sessionId: string;
  /** Array of images in the composition */
  images: ImageFile[];
  /** Array of transitions between images */
  transitions: Transition[];
  /** Array of frame durations in milliseconds */
  frameDurations: number[];
  /** Quality setting for the composition */
  quality?: string;
  /** Type of composition (slideshow, video, etc.) */
  type?: string;
  /** Additional metadata */
  metadata?: {
    /** Source of the composition (figma-plugin, etc.) */
    source?: string;
    /** Version of the plugin that created the composition */
    pluginVersion?: string;
    /** Creation timestamp */
    createdAt?: string;
    /** Number of frames in the composition */
    framesCount?: number;
    /** Additional dynamic metadata fields */
    [key: string]: any;
  };
  /** Array of export records */
  exports?: any[];
  /** Creation timestamp */
  createdAt?: string;
}

/**
 * Settings for export operations
 */
export interface ExportSettings {
  /** Quality preset (web, standard, high, premium, ultra) */
  quality?: string;
  /** Frames per second */
  fps?: number;
  /** Encoding preset (ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow) */
  preset?: string;
  /** Video bitrate (e.g., "2M", "4M") */
  bitrate?: string | number;
  /** Whether to optimize for size */
  optimizeSize?: boolean;
  /** Whether to enable fast start for streaming */
  fastStart?: boolean;
  /** Output resolution */
  resolution?: { width: number; height: number };
  /** GIF-specific settings */
  gif?: {
    /** Dither algorithm (none, floyd_steinberg, bayer) */
    dither?: string;
    /** Number of colors in the palette */
    colors?: number;
    /** Whether to loop the GIF */
    loop?: boolean | string;
  };
  /** Additional dynamic settings */
  [key: string]: any;
}

/**
 * Quality preset configuration
 */
export interface QualityPreset {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Frames per second */
  fps: number;
  /** Video bitrate */
  bitrate: string;
  /** Constant Rate Factor (quality setting, lower is better) */
  crf: number;
  /** Additional dynamic settings */
  [key: string]: any;
}

/**
 * Image dimensions
 */
export interface ImageDimensions {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Extended Request interface with session ID
 */
export type Req = Request & { 
  /** Session ID for the request */
  sessionId?: string 
};

/**
 * Queue functions interface for job processing
 */
export interface QueueFunctions {
  /** Add a job to the queue */
  addJob: (jobType: string, data: any) => Promise<any>;
}

/**
 * Job types constants
 */
export const JobTypes = {
  VIDEO_TRIM: 'video_trim',
  SLIDESHOW: 'slideshow',
  VIDEO_EXPORT: 'video_export',
  GIF_EXPORT: 'gif_export',
  FORMAT_CONVERSION: 'format_conversion'
} as const;

/**
 * Type for job type values
 */
export type JobType = typeof JobTypes[keyof typeof JobTypes];

/**
 * Socket.IO related types
 */
export interface SocketEvents {
  /** Emit export progress update */
  emitExportProgress: (type: string, status: string, progress: number, message: string, extra?: Record<string, any>) => void;
}

/**
 * Declare global namespace augmentation for Socket.IO
 */
declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var io: import('socket.io').Server; // NOSONAR – global var used intentionally
}
