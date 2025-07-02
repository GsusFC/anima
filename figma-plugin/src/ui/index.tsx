// @ts-nocheck
import React from 'react';
import { createRoot } from 'react-dom/client';
import FigmaSlideshow from './FigmaSlideshow';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<FigmaSlideshow />);
} else {
  // Fallback simple message if root not found
  document.body.innerHTML = '<div style="color:white;background:#0a0a0b;padding:16px;font-family:monospace">Root element not found</div>';
} 