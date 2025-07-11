import React, { useState, useCallback } from 'react';
import DebugPanel from './DebugPanel/DebugPanel';

interface PageWithDebugProps {
  children: React.ReactNode;
}

const PageWithDebug: React.FC<PageWithDebugProps> = ({ children }) => {
  const [debugVisible, setDebugVisible] = useState<boolean>(true);

  const toggleDebug = useCallback(() => {
    setDebugVisible((prev) => !prev);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#0a0a0b',
      }}
    >
      {/* Main application area */}
      <div
        style={{
          flex: debugVisible ? '1 1 50%' : '1 1 100%',
          overflow: 'hidden',
        }}
      >
        {/* Toggle button floating in top-left corner */}
        <button
          onClick={toggleDebug}
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1000,
            padding: '6px 10px',
            backgroundColor: 'rgba(236, 72, 153, 0.15)',
            color: '#ec4899',
            border: '1px solid #ec4899',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: '"Space Mono", monospace',
          }}
        >
          {debugVisible ? 'Ocultar Debug' : 'Mostrar Debug'}
        </button>
        {children}
      </div>

      {/* Debug panel */}
      {debugVisible && (
        <div
          style={{
            flex: '0 0 50%',
            borderLeft: '1px solid #333',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <DebugPanel />
        </div>
      )}
    </div>
  );
};

export default PageWithDebug; 