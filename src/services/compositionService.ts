import fs from 'fs';
import path from 'path';
import { Composition, ImageFile } from '../types';
import { 
  getCompositionPath, 
  createCompositionDirectory, 
  getTempPath 
} from '../config/directories';

/**
 * Generates a unique composition ID
 * 
 * @returns A unique composition ID string
 */
export function generateCompositionId(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Saves a composition to disk
 * 
 * @param composition - The composition to save
 * @returns The saved composition with updated paths and metadata
 */
export function saveComposition(composition: Composition): Composition {
  // Generate paths
  const compositionPath = getCompositionPath(composition.id);
  const compositionDataDir = createCompositionDirectory(composition.id);
  
  // Copy images from temp to composition directory
  const copiedImages = composition.images.map((img, index) => {
    const originalPath = getTempPath(composition.sessionId, img.filename);
    const newFilename = `image_${index}_${img.filename}`;
    const newPath = path.join(compositionDataDir, newFilename);
    
    if (fs.existsSync(originalPath)) {
      fs.copyFileSync(originalPath, newPath);
      return { ...img, filename: newFilename, originalFilename: img.filename };
    }
    return img;
  });
  
  // Save composition metadata
  const compositionData: Composition = {
    ...composition,
    images: copiedImages,
    createdAt: composition.createdAt || new Date().toISOString(),
    exports: composition.exports || [] // Initialize exports array if not present
  };
  
  // Write to file
  fs.writeFileSync(compositionPath, JSON.stringify(compositionData, null, 2));
  
  console.log(`✅ Composition saved: ${composition.id}`);
  return compositionData;
}

/**
 * Loads a composition from disk
 * 
 * @param compositionId - The ID of the composition to load
 * @returns The loaded composition
 * @throws Error if composition not found
 */
export function loadComposition(compositionId: string): Composition {
  const compositionPath = getCompositionPath(compositionId);
  
  if (!fs.existsSync(compositionPath)) {
    throw new Error(`Composition not found: ${compositionId}`);
  }
  
  const compositionData = JSON.parse(fs.readFileSync(compositionPath, 'utf8')) as Composition;
  
  // Update image paths to point to composition directory
  compositionData.images = compositionData.images.map(img => ({
    ...img,
    path: path.join(path.dirname(compositionPath), compositionId, img.filename)
  }));
  
  console.log(`📂 Composition loaded: ${compositionId}`);
  return compositionData;
}

/**
 * Adds an export record to a composition
 * 
 * @param compositionId - The ID of the composition to update
 * @param exportData - The export data to add
 * @throws Error if composition not found
 */
export function addExportToComposition(compositionId: string, exportData: any): void {
  const compositionPath = getCompositionPath(compositionId);
  
  if (!fs.existsSync(compositionPath)) {
    throw new Error(`Composition not found: ${compositionId}`);
  }
  
  const compositionData = JSON.parse(fs.readFileSync(compositionPath, 'utf8')) as Composition;
  if (!compositionData.exports) {
    compositionData.exports = [];
  }
  
  compositionData.exports.push({
    ...exportData,
    timestamp: new Date().toISOString()
  });
  
  fs.writeFileSync(compositionPath, JSON.stringify(compositionData, null, 2));
  console.log(`📝 Export added to composition: ${compositionId}`);
}

/**
 * Checks if a composition exists
 * 
 * @param compositionId - The ID of the composition to check
 * @returns True if the composition exists, false otherwise
 */
export function compositionExists(compositionId: string): boolean {
  return fs.existsSync(getCompositionPath(compositionId));
}

/**
 * Lists all compositions
 * 
 * @returns Array of composition IDs
 */
export function listCompositions(): string[] {
  const compositionsDir = path.dirname(getCompositionPath('dummy'));
  
  if (!fs.existsSync(compositionsDir)) {
    return [];
  }
  
  return fs.readdirSync(compositionsDir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.basename(file, '.json'));
}

/**
 * Creates a new composition from images
 * 
 * @param sessionId - The session ID
 * @param images - Array of image files
 * @param options - Additional options for the composition
 * @returns The created composition
 */
export function createComposition(
  sessionId: string, 
  images: ImageFile[], 
  options: {
    transitions?: Array<{ type: string; duration: number }>;
    frameDurations?: number[];
    quality?: string;
    type?: string;
    metadata?: Record<string, any>;
  } = {}
): Composition {
  // Generate a unique ID for the composition
  const compositionId = generateCompositionId();
  
  // Set default frame durations if not provided
  const frameDurations = options.frameDurations || new Array(images.length).fill(3000); // 3 seconds per frame
  
  // Set default transitions if not provided
  const transitions = options.transitions || images.map((_, index) => ({
    type: 'fade',
    duration: 1000,
    fromFrameId: index > 0 ? `frame_${index - 1}` : null,
    toFrameId: `frame_${index}`
  }));
  
  // Create the composition object
  const composition: Composition = {
    id: compositionId,
    sessionId,
    images,
    transitions,
    frameDurations,
    quality: options.quality || 'high',
    type: options.type || 'slideshow',
    metadata: {
      createdAt: new Date().toISOString(),
      framesCount: images.length,
      ...options.metadata
    }
  };
  
  // Save the composition to disk
  return saveComposition(composition);
}

/**
 * Deletes a composition and its associated files
 * 
 * @param compositionId - The ID of the composition to delete
 * @returns True if the composition was deleted, false otherwise
 */
export function deleteComposition(compositionId: string): boolean {
  const compositionPath = getCompositionPath(compositionId);
  const compositionDir = path.dirname(compositionPath);
  
  if (!fs.existsSync(compositionPath)) {
    return false;
  }
  
  try {
    // Delete the composition file
    fs.unlinkSync(compositionPath);
    
    // Delete the composition directory if it exists
    if (fs.existsSync(path.join(compositionDir, compositionId))) {
      const files = fs.readdirSync(path.join(compositionDir, compositionId));
      
      // Delete all files in the composition directory
      for (const file of files) {
        fs.unlinkSync(path.join(compositionDir, compositionId, file));
      }
      
      // Delete the composition directory
      fs.rmdirSync(path.join(compositionDir, compositionId));
    }
    
    console.log(`🗑️ Composition deleted: ${compositionId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete composition ${compositionId}:`, error);
    return false;
  }
}

// Default export for convenience
export default {
  generateCompositionId,
  saveComposition,
  loadComposition,
  addExportToComposition,
  compositionExists,
  listCompositions,
  createComposition,
  deleteComposition
};
