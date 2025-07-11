import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface ExportEvent {
  timestamp: number;
  type: string;
  status: string;
  progress: number;
  message: string;
  filename?: string;
  error?: string;
}

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : window.location.origin;

const DebugPanel: React.FC = () => {
  const [events, setEvents] = useState<ExportEvent[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to backend websocket
    const socket = io(API_BASE_URL);
    socketRef.current = socket;

    const handleExportProgress = (data: any) => {
      setEvents(prev => [{ timestamp: Date.now(), ...data }, ...prev].slice(0, 100));
    };

    socket.on('export:progress', handleExportProgress);
    socket.on('trim-progress', handleExportProgress);

    return () => {
      socket.off('export:progress', handleExportProgress);
      socket.off('trim-progress', handleExportProgress);
      socket.disconnect();
    };
  }, []);

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString();

  return (
    <div
      className="custom-scrollbar"
      style={{
        height: '100%',
        width: '100%',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: '#1a1a1b',
        color: 'white',
        fontFamily: '"Space Mono", monospace',
      }}
    >
      <h2 style={{ margin: 0, fontSize: '18px', color: '#ec4899' }}>
        🐞 Debug Panel
      </h2>
      <p style={{ fontSize: '12px', color: '#9ca3af' }}>
        Esta es una vista de depuración provisional. Aquí se mostrarán logs, métricas y
        estado interno de la aplicación.
      </p>
      {/* Export events table */}
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid #333', padding: '8px', borderRadius: '4px' }}>
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: '#ec4899', textAlign: 'left' }}>
              <th style={{ padding: '4px' }}>Time</th>
              <th style={{ padding: '4px' }}>Type</th>
              <th style={{ padding: '4px' }}>Status</th>
              <th style={{ padding: '4px' }}>Progress</th>
              <th style={{ padding: '4px' }}>Message</th>
            </tr>
          </thead>
          <tbody>
            {events.map((evt, idx) => (
              <tr key={idx} style={{ borderTop: '1px solid #222' }}>
                <td style={{ padding: '4px', color: '#9ca3af' }}>{formatTime(evt.timestamp)}</td>
                <td style={{ padding: '4px' }}>{evt.type}</td>
                <td style={{ padding: '4px' }}>{evt.status}</td>
                <td style={{ padding: '4px' }}>{Math.round(evt.progress)}%</td>
                <td style={{ padding: '4px' }}>{evt.message}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '8px', color: '#555' }}>
                  No events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DebugPanel; 