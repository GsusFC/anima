import path from 'path';

// Server configuration
export const SERVER_CONFIG = {
  port: parseInt(process.env.PORT || '3002', 10),
  timeouts: {
    server: 10 * 60 * 1000, // 10 minutes
    keepAlive: 5 * 60 * 1000, // 5 minutes
    headers: 6 * 60 * 1000, // 6 minutes (must be greater than keepAliveTimeout)
    exportRequest: 10 * 60 * 1000, // 10 minutes for export endpoints
    previewRequest: 5 * 60 * 1000 // 5 minutes for preview endpoints
  },
  cors: {
    origins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',') 
      : [
          "http://localhost:5173", 
          "http://localhost:5174", 
          "http://localhost:5175", 
          "http://localhost:5176", 
          "http://localhost:5177", 
          "http://localhost:5178", 
          "http://localhost:5179", 
          "http://localhost:5180"
        ],
    methods: ["GET", "POST"]
  }
};

// File upload configuration
export const UPLOAD_CONFIG = {
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '50000000', 10) || 50 * 1024 * 1024, // 50 MB
    files: parseInt(process.env.MAX_FILES || '50', 10) || 50, // Max 50 files
    videoSize: 100 * 1024 * 1024 // 100MB limit for videos
  },
  allowedTypes: {
    images: /jpeg|jpg|png|gif|bmp|webp/,
    videos: /mp4|mov|webm|avi|mkv/
  }
};

// Directory paths
export const PATHS = {
  root: __dirname,
  outputDir: path.join(__dirname, '..', '..', process.env.OUTPUT_DIR || 'output'),
  tempDir: path.join(__dirname, '..', '..', process.env.TEMP_DIR || 'uploads'), // Changed from 'temp' to 'uploads' for persistence
  compositionsDir: path.join(__dirname, '..', '..', 'compositions'),
  logsDir: path.join(__dirname, '..', '..', 'logs'),
  publicDir: path.join(__dirname, '..', '..', 'public')
};

// Quality presets for different output formats
export interface QualityPreset {
  width: number;
  height: number;
  fps: number;
  bitrate: string;
  crf: number;
  [key: string]: any;
}

export const QUALITY_PRESETS: Record<string, QualityPreset> = {
  web: { 
    width: 720, 
    height: 480, 
    fps: parseInt(process.env.DEFAULT_FPS || '24', 10) || 24, 
    bitrate: '1M', 
    crf: 28 
  },
  standard: { 
    width: 1280, 
    height: 720, 
    fps: parseInt(process.env.DEFAULT_FPS || '30', 10) || 30, 
    bitrate: '2M', 
    crf: 23 
  },
  high: { 
    width: 1920, 
    height: 1080, 
    fps: parseInt(process.env.DEFAULT_FPS || '30', 10) || 30, 
    bitrate: '4M', 
    crf: 20 
  },
  premium: { 
    width: 1920, 
    height: 1080, 
    fps: 60, 
    bitrate: '8M', 
    crf: 18 
  },
  ultra: { 
    width: 3840, 
    height: 2160, 
    fps: 60, 
    bitrate: '20M', 
    crf: 16 
  }
};

// Transition effects mapping (using real FFmpeg xfade transitions)
export const TRANSITION_EFFECTS: Record<string, string> = {
  none: 'none',
  cut: 'none', // Handle cut transitions as no transition
  
  // Basic fades
  fade: 'fade',
  fadeblack: 'fadeblack',
  fadewhite: 'fadewhite',
  dissolve: 'dissolve',
  
  // Slide transitions
  slideleft: 'slideleft',
  slideright: 'slideright', 
  slideup: 'slideup',
  slidedown: 'slidedown',
  
  // Wipe transitions
  wipeleft: 'wipeleft',
  wiperight: 'wiperight',
  wipeup: 'wipeup',
  wipedown: 'wipedown',
  wipetl: 'wipetl',
  wipetr: 'wipetr',
  wipebl: 'wipebl',
  wipebr: 'wipebr',
  
  // Smooth transitions
  smoothleft: 'smoothleft',
  smoothright: 'smoothright',
  smoothup: 'smoothup',
  smoothdown: 'smoothdown',
  
  // Circle/Shape transitions
  circlecrop: 'circlecrop',
  rectcrop: 'rectcrop',
  circleopen: 'circleopen',
  circleclose: 'circleclose',
  
  // Open/Close transitions
  horzopen: 'horzopen',
  horzclose: 'horzclose',
  vertopen: 'vertopen',
  vertclose: 'vertclose',
  
  // Diagonal transitions
  diagbl: 'diagbl',
  diagbr: 'diagbr',
  diagtl: 'diagtl',
  diagtr: 'diagtr',
  
  // Advanced effects
  radial: 'radial',
  pixelize: 'pixelize',
  distance: 'distance',
  squeezev: 'squeezev',
  squeezeh: 'squeezeh',
  zoomin: 'zoomin',
  
  // Cover/Reveal transitions
  coverleft: 'coverleft',
  coverright: 'coverright',
  coverup: 'coverup',
  coverdown: 'coverdown',
  revealleft: 'revealleft',
  revealright: 'revealright',
  revealup: 'revealup',
  revealdown: 'revealdown',
  
  // Wind/Slice effects
  hlwind: 'hlwind',
  hrwind: 'hrwind',
  vuwind: 'vuwind',
  vdwind: 'vdwind',
  hlslice: 'hlslice',
  hrslice: 'hrslice',
  vuslice: 'vuslice',
  vdslice: 'vdslice',
  
  // Additional effects
  fadegrays: 'fadegrays',
  hblur: 'hblur',

  // Legacy compatibility mappings
  slide: 'slideleft', // Map legacy 'slide' to 'slideleft'
  zoom: 'zoomin'      // Map legacy 'zoom' to 'zoomin'
};

// Default export for convenience
export default {
  server: SERVER_CONFIG,
  upload: UPLOAD_CONFIG,
  paths: PATHS,
  qualityPresets: QUALITY_PRESETS,
  transitionEffects: TRANSITION_EFFECTS
};
