// Hook for plugin-UI communication
import { useEffect, useCallback, useRef } from 'react';
import { PluginMessage } from '@shared/types';

interface UsePluginMessageReturn {
  sendMessage: (message: PluginMessage) => void;
  isConnected: boolean;
}

export const usePluginMessage = (
  onMessage?: (message: PluginMessage) => void
): UsePluginMessageReturn => {
  const isConnectedRef = useRef(false);

  const sendMessage = useCallback((message: PluginMessage) => {
    // Figma-specific message sending
    parent.postMessage({ pluginMessage: message }, '*');
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate message source for security
      if (event.data.pluginMessage) {
        isConnectedRef.current = true;
        if (onMessage) {
          onMessage(event.data.pluginMessage);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Send initial connection message
    sendMessage({ type: 'ui-ready' });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onMessage, sendMessage]);

  return {
    sendMessage,
    isConnected: isConnectedRef.current
  };
};
