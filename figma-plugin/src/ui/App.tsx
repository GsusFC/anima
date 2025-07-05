import React from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PluginProvider } from '../context/PluginContext';
import FigmaSlideshow from './FigmaSlideshow';

const App: React.FC = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // In production, you might want to send this to an error reporting service
        console.error('Plugin Error:', error, errorInfo);
      }}
    >
      <PluginProvider>
        <FigmaSlideshow />
      </PluginProvider>
    </ErrorBoundary>
  );
};

export default App;
