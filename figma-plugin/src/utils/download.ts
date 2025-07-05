/**
 * Download utilities for handling file downloads in the browser
 */

export interface DownloadOptions {
  filename?: string;
  mimeType?: string;
}

/**
 * Download a blob as a file
 */
export const downloadBlob = (
  blob: Blob, 
  filename: string, 
  options?: DownloadOptions
): void => {
  const url = URL.createObjectURL(blob);
  downloadURL(url, filename);
  URL.revokeObjectURL(url);
};

/**
 * Download content from a URL
 */
export const downloadURL = (url: string, filename: string): void => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/**
 * Download text content as a file
 */
export const downloadText = (
  text: string, 
  filename: string, 
  mimeType: string = 'text/plain'
): void => {
  const blob = new Blob([text], { type: mimeType });
  downloadBlob(blob, filename);
};

/**
 * Download JSON data as a file
 */
export const downloadJSON = (
  data: any, 
  filename: string
): void => {
  const jsonString = JSON.stringify(data, null, 2);
  downloadText(jsonString, filename, 'application/json');
};

/**
 * Infer file extension from format
 */
export const getFileExtension = (format: string): string => {
  const extensions: Record<string, string> = {
    mp4: '.mp4',
    gif: '.gif',
    webm: '.webm',
    mov: '.mov',
    avi: '.avi'
  };
  
  return extensions[format.toLowerCase()] || '.mp4';
};

/**
 * Generate filename with timestamp
 */
export const generateFilename = (
  prefix: string = 'figma-slideshow',
  format: string = 'mp4',
  timestamp?: Date
): string => {
  const date = timestamp || new Date();
  const timeString = date.toISOString().slice(0, 19).replace(/[:-]/g, '');
  const extension = getFileExtension(format);
  
  return `${prefix}-${timeString}${extension}`;
};
