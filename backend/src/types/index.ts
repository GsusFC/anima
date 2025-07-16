/**
 * AnimaGen Backend - TypeScript Type Definitions
 * 
 * This file contains all type definitions for the AnimaGen backend application.
 */

import { Request, Response, NextFunction } from 'express';
import { Job, Queue, Worker, QueueEvents } from 'bullmq';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { FilterGraph } from '../FilterGraph';

// =========================================
// 1. Core Request/Response Types
// =========================================

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}

export interface UploadResponse extends ApiResponse {
  sessionId: string;
  files: UploadedFile[];
}

export interface ExportResponse extends ApiResponse {
  jobId?: string;
  outputPath?: string;
  downloadUrl?: string;
  statusUrl?: string;
  previewUrl?: string;
}

export interface HealthCheckResponse extends ApiResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  env: string;
  port: number | string;
  directories: {
    output: boolean;
    uploads: boolean;
    compositions: boolean;
  };
}

export interface StatusResponse extends ApiResponse {
  status: 'running' | 'stopped' | 'error';
  version: string;
  jobQueue: {
    enabled: boolean;
    status: string;
  };
  endpoints: Record<string, string>;
}

export interface JobStatusResponse extends ApiResponse {
  jobId: string;
  status: JobStatus;
  progress: number;
  result?: any;
  error?: string;
  createdAt: string;
  processedAt?: string;
  finishedAt?: string;
}

export interface AuthResponse extends ApiResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    plan: string;
    permissions: string[];
  };
  expiresAt?: string;
  apiKey?: string;
}

export interface SlideshowResponse extends ApiResponse {
  slideshow: SlideshowData;
}

// =========================================
// 2. Job Queue Types
// =========================================

export enum JobType {
  SLIDESHOW = 'slideshow',
  VIDEO = 'video',
  GIF = 'gif',
  VIDEO_TRIM = 'video_trim',
  FORMAT_CONVERSION = 'format_conversion',
  UNIFIED_EXPORT = 'unified_export'
}

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
  STALLED = 'stalled'
}

export interface JobData {
  jobType: JobType;
  sessionId: string;
  outputPath?: string;
  outputFilename?: string;
  settings: ExportSettings;
  [key: string]: any;
}

export interface JobResult {
  outputPath: string;
  downloadUrl: string;
  previewUrl?: string;
  duration?: number;
  fileSize?: number;
  resolution?: string;
  format?: string;
}

export interface QueueEventData {
  jobId: string;
  data?: number | any;
  returnvalue?: JobResult;
  failedReason?: string;
}

export interface WorkerManagerStatus {
  running: boolean;
  workers: number;
  activeJobs: number;
  waitingJobs: number;
  completedJobs: number;
  failedJobs: number;
}

// =========================================
// 3. Export Settings and Quality Presets
// =========================================

export enum ExportFormat {
  MP4 = 'mp4',
  GIF = 'gif',
  WEBM = 'webm',
  MOV = 'mov'
}

export enum QualityPreset {
  WEB = 'web',
  STANDARD = 'standard',
  HIGH = 'high',
  PREMIUM = 'premium',
  ULTRA = 'ultra'
}

export interface QualitySettings {
  width: number;
  height: number;
  fps: number;
  bitrate: string;
  crf: number;
}

export interface ExportSettings {
  format: ExportFormat;
  quality: QualityPreset;
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  loop?: boolean;
  frameDurations?: number[];
  transitions?: Transition[];
  audio?: AudioSettings;
  watermark?: WatermarkSettings;
  outputFilename?: string;
}

export interface AudioSettings {
  enabled: boolean;
  path?: string;
  volume?: number;
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

export interface WatermarkSettings {
  enabled: boolean;
  path?: string;
  position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center';
  opacity?: number;
  size?: number;
}

export type TransitionType = 
  | 'none' | 'cut' | 'fade' | 'fadeblack' | 'fadewhite' | 'dissolve' 
  | 'slideleft' | 'slideright' | 'slideup' | 'slidedown'
  | 'wipeleft' | 'wiperight' | 'wipeup' | 'wipedown'
  | 'wipetl' | 'wipetr' | 'wipebl' | 'wipebr'
  | 'smoothleft' | 'smoothright' | 'smoothup' | 'smoothdown'
  | 'circlecrop' | 'rectcrop' | 'circleopen' | 'circleclose'
  | 'horzopen' | 'horzclose' | 'vertopen' | 'vertclose'
  | 'diagbl' | 'diagbr' | 'diagtl' | 'diagtr'
  | 'radial' | 'pixelize' | 'distance' | 'squeezev' | 'squeezeh' | 'zoomin'
  | 'coverleft' | 'coverright' | 'coverup' | 'coverdown'
  | 'revealleft' | 'revealright' | 'revealup' | 'revealdown'
  | 'hlwind' | 'hrwind' | 'vuwind' | 'vdwind'
  | 'hlslice' | 'hrslice' | 'vuslice' | 'vdslice'
  | 'fadegrays' | 'hblur' | 'slide' | 'zoom';

export interface Transition {
  type: TransitionType;
  duration: number;
  fromFrameId?: string | null;
  toFrameId?: string;
}

export interface TransitionEffectsMap {
  [key: string]: string;
}

// A mapped type cannot be declared inside an `interface`, so we use a `type` alias
export type QualityPresetsMap = {
  [key in QualityPreset]: QualitySettings;
};

// =========================================
// 4. File Upload and Composition Types
// =========================================

export interface UploadedFile {
  id: string;
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
  selectionIndex?: number;
  base64Data?: string;
}

export interface ImageMetadata {
  dimensions?: {
    width: number;
    height: number;
  };
  format?: string;
  originalName?: string;
  [key: string]: any;
}

export interface CompositionImage {
  id: string;
  filename: string;
  originalName: string;
  path?: string;
  size?: number;
  mimetype?: string;
  base64Data?: string;
  metadata?: ImageMetadata;
  order?: number;
}

export interface Composition {
  id: string;
  sessionId: string;
  images: CompositionImage[];
  transitions?: Transition[];
  frameDurations?: number[];
  quality?: QualityPreset;
  type?: string;
  metadata?: {
    source?: string;
    pluginVersion?: string;
    createdAt?: string;
    framesCount?: number;
    [key: string]: any;
  };
  exports?: CompositionExport[];
  createdAt?: string;
}

export interface CompositionExport {
  format: ExportFormat;
  quality: QualityPreset;
  outputPath: string;
  downloadUrl: string;
  fileSize?: number;
  duration?: number;
  timestamp: string;
}

export interface SlideshowData {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  frames: SlideshowFrame[];
  settings: {
    totalDuration: number;
    autoPlay: boolean;
    loop: boolean;
    quality: string;
    format: string;
  };
  metadata: {
    source: string;
    framesCount: number;
    [key: string]: any;
  };
}

export interface SlideshowFrame {
  id: string;
  name: string;
  order: number;
  duration: number;
  transition: string;
  imageUrl: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface FigmaImportRequest {
  sessionId?: string;
  frames?: FigmaFrame[];
  source?: string;
  pluginVersion?: string;
}

export interface FigmaFrame {
  name: string;
  imageData?: number[] | Buffer;
  metadata?: ImageMetadata;
  selectionIndex?: number;
}

export interface BatchInfo {
  current: number;
  total: number;
  isLastBatch: boolean;
}

// =========================================
// 5. Socket.IO Event Types
// =========================================

export interface SocketIOProgressEvent {
  type: 'job' | 'export' | 'preview' | 'master' | 'processing';
  status: 'waiting' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  jobId?: string;
  outputPath?: string;
  downloadUrl?: string;
  error?: string;
  [key: string]: any;
}

// NodeJS.Global is not exported in newer @types/node versions.
// Use `typeof global` to extend the actual global object type.
export type GlobalWithIO = typeof global & {
  io: SocketIOServer;
};

// =========================================
// 6. Configuration Types
// =========================================

export interface AppConfig {
  port: number;
  env: string;
  outputDir: string;
  tempDir: string;
  compositionsDir: string;
  logsDir: string;
  maxFileSize: number;
  maxFiles: number;
  defaultFps: number;
  corsOrigins: string[];
}

export interface APIKey {
  key: string;
  email: string;
  name: string;
  purpose: string;
  createdAt: string;
  lastUsed: string | null;
  active: boolean;
}

export interface APIKeysStore {
  [key: string]: APIKey;
}

// =========================================
// 7. Worker Types for Job Processing
// =========================================

export interface WorkerConfig {
  concurrency: number;
  connection: any;
  limiter?: {
    max: number;
    duration: number;
  };
}

export interface VideoTrimJobData extends JobData {
  videoPath: string;
  startTime: number;
  endTime: number;
  outputName?: string;
}

export interface FormatConversionJobData extends JobData {
  inputPath: string;
  outputFormat: string;
  quality?: QualityPreset;
}

export interface SlideshowJobData extends JobData {
  images: CompositionImage[];
  transitions?: Transition[];
  frameDurations?: number[];
  audio?: AudioSettings;
}

export interface UnifiedExportJobData extends JobData {
  compositionId: string;
  exportType: 'slideshow' | 'video' | 'gif';
  exportSettings: ExportSettings;
}

// =========================================
// 8. Error Handling Types
// =========================================

export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  PROCESSING = 'PROCESSING_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  INTERNAL = 'INTERNAL_ERROR'
}

export interface AppError extends Error {
  type: ErrorType;
  statusCode: number;
  isOperational: boolean;
  details?: any;
}

export interface ErrorHandlerOptions {
  logToConsole?: boolean;
  logToFile?: boolean;
  sendToClient?: boolean;
}

// =========================================
// 9. Extended Express Types
// =========================================

export interface RequestWithSessionId extends Request {
  sessionId?: string;
}

export type ErrorHandlerMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => void;

// =========================================
// 10. FFmpeg Helper Types
// =========================================

export interface FilterGraphOptions {
  width: number;
  height: number;
  fps: number;
  duration: number;
  transitionDuration?: number;
  transitionType?: string;
}

export interface InputDurationCalculation {
  totalDuration: number;
  inputDurations: number[];
  maxTransitionDuration: number;
}

export interface FFmpegCommand {
  addInput: (input: string) => FFmpegCommand;
  addInputOptions: (options: string[]) => FFmpegCommand;
  addOutput: (output: string) => FFmpegCommand;
  addOutputOptions: (options: string[]) => FFmpegCommand;
  complexFilter: (filters: string[], map?: string) => FFmpegCommand;
  on: (event: string, callback: (...args: any[]) => void) => FFmpegCommand;
  run: () => void;
  save: (output: string) => FFmpegCommand;
  [key: string]: any;
}
