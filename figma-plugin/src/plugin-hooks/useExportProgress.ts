// @ts-nocheck
// useExportProgress: listen to Socket.IO export-progress events
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiService } from '../services/api';

export interface ExportProgressState {
  percent: number;
  status: string;
  message?: string;
}

export interface UseExportProgressReturn extends ExportProgressState {
  connected: boolean;
}

export const useExportProgress = (sessionId?: string): UseExportProgressReturn => {
  const [progress, setProgress] = useState<ExportProgressState>({ percent: 0, status: 'pending' });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      console.log('🔌 useExportProgress: No sessionId provided');
      return;
    }

    const wsURL = apiService.getBaseURL();
    console.log(`🔌 useExportProgress: Connecting WebSocket for session ${sessionId}`);
    console.log(`🌐 WebSocket URL: ${wsURL}`);

    // Connect to Socket.IO backend
    const socket: Socket = io(wsURL, {
      transports: ['websocket'], // faster and avoids polling in plugin context
      path: '/socket.io', // default path
      reconnectionAttempts: 3
    });

    const handleConnect = () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
    };
    
    const handleDisconnect = () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Listen for export:progress events filtered by sessionId
    socket.on('export:progress', (data: any) => {
      console.log('📊 Received export:progress event:', data);
      
      // Backend sends: { type, status, progress, message, jobId, ...extra }
      // For now, we'll accept all events and filter later if needed
      // TODO: Match jobId with sessionId properly
      
      const newProgress = {
        percent: typeof data.progress === 'number' ? data.progress : progress.percent,
        status: data.status || progress.status,
        message: data.message
      };
      
      console.log('📈 Updating progress:', newProgress);
      setProgress(newProgress);
    });

    // Clean up on unmount
    return () => {
      console.log('🔌 Cleaning up WebSocket connection');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('export:progress');
      socket.disconnect();
    };
  }, [sessionId]);

  return { ...progress, connected };
}; 