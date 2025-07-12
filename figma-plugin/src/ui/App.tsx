// Main App component
import React, { useEffect, useState } from 'react';
import { PluginProvider } from './context/PluginContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthSetup } from './components/features/Authentication/AuthSetup';
import { MainInterface } from './components/features/MainInterface/MainInterface';
import { LoadingScreen } from './components/common/LoadingScreen';
import { usePluginMessage } from './hooks/usePluginMessage';
import { AuthState } from '@shared/types';
import './styles/globals.css';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({ 
    authenticated: false, 
    loading: true 
  });
  const [isInitialized, setIsInitialized] = useState(false);

  const { sendMessage } = usePluginMessage((message) => {
    handlePluginMessage(message);
  });

  const handlePluginMessage = (message: any) => {
    const { type, data } = message;

    switch (type) {
      case 'plugin-ready':
        console.log('🚀 Plugin ready:', data);
        setIsInitialized(true);
        break;

      case 'auth-state-changed':
        console.log('🔐 Auth state changed:', data);
        setAuthState(data);
        break;

      case 'frames-detected':
        console.log('🖼️ Frames detected:', data);
        // Handle frame detection
        break;

      case 'export-progress':
        console.log('📊 Export progress:', data);
        // Handle export progress
        break;

      case 'export-complete':
        console.log('✅ Export complete:', data);
        // Handle export completion
        break;

      case 'export-error':
        console.error('❌ Export error:', data);
        // Handle export error
        break;

      case 'error':
        console.error('❌ Plugin error:', data);
        // Handle general errors
        break;

      default:
        console.warn('Unknown message type:', type);
    }
  };

  useEffect(() => {
    // Send initial UI ready message
    sendMessage({ type: 'ui-ready' });
  }, [sendMessage]);

  if (!isInitialized) {
    return <LoadingScreen message="Initializing AnimaGen Exporter..." />;
  }

  return (
    <ErrorBoundary>
      <PluginProvider>
        <div className="app" data-testid="plugin-container">
          {authState.loading ? (
            <LoadingScreen message="Checking authentication..." />
          ) : authState.authenticated ? (
            <MainInterface authState={authState} />
          ) : (
            <AuthSetup authState={authState} />
          )}
        </div>
      </PluginProvider>
    </ErrorBoundary>
  );
};

export default App;
