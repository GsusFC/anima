import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Make sure we have a container
const container = document.getElementById('react-page');
if (!container) {
  throw new Error('Could not find react-page container');
}

// Create React root and render the app
const root = createRoot(container);
root.render(<App />);
