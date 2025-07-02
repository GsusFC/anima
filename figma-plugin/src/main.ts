/// <reference types="@figma/plugin-typings" />

// @ts-nocheck
// Figma plugin main process

// Present UI defined in manifest (build/ui.html)
figma.showUI(__html__, { width: 480, height: 700, title: "Slideshow Exporter" });

// Helper to convert selected nodes to PNG bytes
async function exportSelectionToPNG() {
  const selection = figma.currentPage.selection;
  const buffers = [];

  for (const node of selection) {
    if ('exportAsync' in node) {
      try {
        const bytes = await node.exportAsync({ 
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

interface UIRequestImagesMessage {
  type: 'request-images';
}
interface UIClosePluginMessage {
  type: 'close-plugin';
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'request-images') {
    try {
      const pngBuffers = await exportSelectionToPNG();
      const data = pngBuffers.map((bytes) => Array.from(bytes));
      figma.ui.postMessage({ type: 'images', data });
    } catch (error) {
      figma.ui.postMessage({ type: 'error', message: 'Failed to export images' });
    }
  } else if (msg.type === 'close-plugin') {
    figma.closePlugin();
  }
}; 