/// <reference types="@figma/plugin-typings" />

import { FigmaMessage } from './types/slideshow.types';

// Figma plugin main process

// Present UI defined in manifest (build/ui.html)
declare const __html__: string;
figma.showUI(__html__, { width: 480, height: 700, title: "Slideshow Exporter" });

// Helper to convert selected nodes to PNG bytes
async function exportSelectionToPNG(): Promise<Uint8Array[]> {
  const selection = figma.currentPage.selection;
  const buffers: Uint8Array[] = [];

  for (const node of selection) {
    if ('exportAsync' in node) {
      try {
        const bytes = await (node as ExportMixin).exportAsync({ 
          format: 'PNG',
          constraint: { type: 'SCALE', value: 1 }
        });
        buffers.push(bytes);
      } catch (error) {
        console.error('Failed to export node:', error);
      }
    }
  }
  return buffers;
}

// Message types for plugin communication
interface UIRequestImagesMessage {
  type: 'request-images';
}

interface UIClosePluginMessage {
  type: 'close-plugin';
}

type UIMessage = UIRequestImagesMessage | UIClosePluginMessage;

figma.ui.onmessage = async (msg: UIMessage) => {
  if (msg.type === 'request-images') {
    try {
      const pngBuffers = await exportSelectionToPNG();
      const data = pngBuffers.map((bytes) => Array.from(bytes));
      figma.ui.postMessage({ type: 'images', data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export images';
      figma.ui.postMessage({ type: 'error', message: errorMessage });
    }
  } else if (msg.type === 'close-plugin') {
    figma.closePlugin();
  }
};

let selectionDebounce: number | null = null;

figma.on('selectionchange', () => {
  if (selectionDebounce) {
    clearTimeout(selectionDebounce);
  }

  // Debounce 300ms para evitar sobrecargas cuando el usuario hace clic rápido
  selectionDebounce = setTimeout(async () => {
    try {
      const pngBuffers = await exportSelectionToPNG();
      const data = pngBuffers.map((bytes) => Array.from(bytes));
      figma.ui.postMessage({ type: 'images', data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export images on selection change';
      figma.ui.postMessage({ type: 'error', message: errorMessage });
    }
  }, 300);
}); 