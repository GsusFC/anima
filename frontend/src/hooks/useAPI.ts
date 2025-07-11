import { useState } from 'react';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : window.location.origin;

export interface UploadResponse {
  success: boolean;
  sessionId: string;
  files: Array<{
    id: string;
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
  }>;
  message: string;
}

export interface ExportResponse {
  success: boolean;
  filename: string;
  downloadUrl: string;
  message: string;
  compositionId?: string; // Added for composition tracking
}

export interface CompositionData {
  id: string;
  sessionId: string;
  images: Array<{ filename: string; originalFilename: string; path: string }>;
  transitions: Array<{ type: string; duration: number }>;
  frameDurations: number[];
  quality: string;
  type: string;
  createdAt: string;
  exports: Array<{
    format: string;
    filename: string;
    settings: any;
    timestamp: string;
  }>;
}

export interface ProgressEvent {
  type: string;
  status: 'started' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  filename?: string;
  error?: string;
}

export const useAPI = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ProgressEvent | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Connect to socket for progress updates
  const connectSocket = () => {
    if (socket) return socket;
    
    const newSocket = io(API_BASE_URL);
    
    newSocket.on('export:progress', (data: ProgressEvent) => {
      setExportProgress(data);
      if (data.status === 'completed' || data.status === 'error') {
        setIsExporting(false);
      }
    });

    setSocket(newSocket);
    return newSocket;
  };

  // Disconnect socket
  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // Upload files
  const uploadFiles = async (files: File[], sessionId?: string): Promise<UploadResponse> => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const url = sessionId 
        ? `${API_BASE_URL}/upload?sessionId=${sessionId}`
        : `${API_BASE_URL}/upload?sessionId=${Date.now()}`;

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result: UploadResponse = await response.json();
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Export GIF using unified endpoint
  const exportGIF = async (params: {
    images: Array<{ filename: string }>;
    transitions?: Array<{ type: string; duration: number }>;
    duration?: number;
    quality?: string;
    sessionId: string;
  }): Promise<ExportResponse> => {
    console.log('🚀 Starting GIF export with params:', params);
    setIsExporting(true);
    setExportProgress(null);
    connectSocket();

    try {
      console.log('📤 Sending fetch request to /api/unified-export/gif');
      const response = await fetch(`${API_BASE_URL}/api/unified-export/gif`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      console.log('📥 Received response:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.log('❌ Response error:', error);
        throw new Error(error.details || 'GIF export failed');
      }

      const result: ExportResponse = await response.json();
      console.log('✅ Parsed response JSON:', result);
      setIsExporting(false);  // Reset exporting state on success
      return result;
    } catch (error) {
      console.log('💥 Export error in useAPI:', error);
      setIsExporting(false);
      throw error;
    }
  };

  // Export Video using unified endpoint
  const exportVideo = async (params: {
    images: Array<{ filename: string }>;
    transitions?: Array<{ type: string; duration: number }>;
    duration?: number;
    quality?: string;
    format?: string;
    sessionId: string;
    frameDurations?: number[];
    fps?: number;
  }): Promise<ExportResponse> => {
    console.log('🚀 Starting video export with params:', params);
    setIsExporting(true);
    setExportProgress(null);
    connectSocket();

    try {
      const format = params.format || 'mp4';
      console.log(`📤 Sending fetch request to /api/unified-export/${format}`);
      const response = await fetch(`${API_BASE_URL}/api/unified-export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      console.log('📥 Received response:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.log('❌ Response error:', error);
        throw new Error(error.details || 'Video export failed');
      }

      const result: ExportResponse = await response.json();
      console.log('✅ Parsed response JSON:', result);
      setIsExporting(false);  // Reset exporting state on success
      return result;
    } catch (error) {
      console.log('💥 Export error in useAPI:', error);
      setIsExporting(false);
      throw error;
    }
  };

  // Download file
  const downloadFile = (filename: string) => {
    const url = `${API_BASE_URL}/download/${filename}`;
    window.open(url, '_blank');
  };

  // Re-export existing composition in different format
  const reExportComposition = async (compositionId: string, format: 'gif' | 'mp4' | 'webm', quality?: string): Promise<ExportResponse> => {
    console.log(`🔄 Re-exporting composition ${compositionId} as ${format.toUpperCase()}`);
    setIsExporting(true);
    setExportProgress(null);
    connectSocket();

    try {
      const response = await fetch(`${API_BASE_URL}/compositions/${compositionId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format, quality }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || `${format.toUpperCase()} re-export failed`);
      }

      const result: ExportResponse = await response.json();
      console.log(`✅ Re-export successful:`, result);
      setIsExporting(false);  // Reset exporting state on success
      return result;
    } catch (error) {
      console.error('💥 Re-export error:', error);
      setIsExporting(false);
      throw error;
    }
  };

  // Get composition details
  const getComposition = async (compositionId: string): Promise<CompositionData> => {
    try {
      const response = await fetch(`${API_BASE_URL}/compositions/${compositionId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to get composition');
      }

      const result = await response.json();
      return result.composition;
    } catch (error) {
      console.error('Failed to get composition:', error);
      throw error;
    }
  };

  // Cleanup session
  const cleanupSession = async (sessionId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/cleanup/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.warn(`Cleanup failed for session ${sessionId}`);
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  };

  return {
    // State
    isUploading,
    isExporting,
    exportProgress,
    
    // Actions
    uploadFiles,
    exportGIF,
    exportVideo,
    reExportComposition,
    getComposition,
    downloadFile,
    cleanupSession,
    connectSocket,
    disconnectSocket,
  };
}; 
