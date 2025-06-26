import { useState } from 'react';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:3001';

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

  // Export GIF
  const exportGIF = async (params: {
    images: Array<{ filename: string }>;
    transitions?: Array<{ type: string; duration: number }>;
    duration?: number;
    quality?: string;
    sessionId: string;
  }): Promise<ExportResponse> => {
    setIsExporting(true);
    setExportProgress(null);
    connectSocket();

    try {
      const response = await fetch(`${API_BASE_URL}/export/gif`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'GIF export failed');
      }

      const result: ExportResponse = await response.json();
      return result;
    } catch (error) {
      setIsExporting(false);
      throw error;
    }
  };

  // Export Video
  const exportVideo = async (params: {
    images: Array<{ filename: string }>;
    transitions?: Array<{ type: string; duration: number }>;
    duration?: number;
    quality?: string;
    format?: string;
    sessionId: string;
  }): Promise<ExportResponse> => {
    setIsExporting(true);
    setExportProgress(null);
    connectSocket();

    try {
      const response = await fetch(`${API_BASE_URL}/export/video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Video export failed');
      }

      const result: ExportResponse = await response.json();
      return result;
    } catch (error) {
      setIsExporting(false);
      throw error;
    }
  };

  // Download file
  const downloadFile = (filename: string) => {
    const url = `${API_BASE_URL}/download/${filename}`;
    window.open(url, '_blank');
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
    downloadFile,
    cleanupSession,
    connectSocket,
    disconnectSocket,
  };
}; 