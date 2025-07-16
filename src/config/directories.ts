import fs from 'fs';
import path from 'path';
import { PATHS } from './server';

/**
 * Interface for directory configuration
 */
export interface DirectoryConfig {
  name: string;
  path: string;
  description: string;
}

/**
 * List of required application directories
 */
export const REQUIRED_DIRECTORIES: DirectoryConfig[] = [
  {
    name: 'output',
    path: PATHS.outputDir,
    description: 'Stores exported videos and images'
  },
  {
    name: 'temp',
    path: PATHS.tempDir,
    description: 'Temporary storage for uploads and processing'
  },
  {
    name: 'compositions',
    path: PATHS.compositionsDir,
    description: 'Stores composition metadata and references'
  },
  {
    name: 'logs',
    path: PATHS.logsDir,
    description: 'Stores application logs'
  }
];

/**
 * Creates a directory if it doesn't exist
 * 
 * @param dirPath - Path to the directory
 * @param recursive - Whether to create parent directories if they don't exist
 * @returns True if directory was created or already exists, false otherwise
 */
export function ensureDirectoryExists(dirPath: string, recursive = true): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive });
      console.log(`✅ Created directory: ${dirPath}`);
      return true;
    }
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to create directory ${dirPath}:`, error.message);
    return false;
  }
}

/**
 * Checks if a directory exists
 * 
 * @param dirPath - Path to the directory
 * @returns True if directory exists, false otherwise
 */
export function directoryExists(dirPath: string): boolean {
  return fs.existsSync(dirPath);
}

/**
 * Creates a session directory for file uploads
 * 
 * @param sessionId - Session ID
 * @returns Path to the session directory
 */
export function createSessionDirectory(sessionId: string): string {
  const sessionDir = path.join(PATHS.tempDir, sessionId);
  ensureDirectoryExists(sessionDir);
  return sessionDir;
}

/**
 * Creates a composition directory for storing composition data
 * 
 * @param compositionId - Composition ID
 * @returns Path to the composition directory
 */
export function createCompositionDirectory(compositionId: string): string {
  const compositionDir = path.join(PATHS.compositionsDir, compositionId);
  ensureDirectoryExists(compositionDir);
  return compositionDir;
}

/**
 * Initializes all required application directories
 * 
 * @returns True if all directories were created successfully, false otherwise
 */
export function initializeDirectories(): boolean {
  console.log('🔧 Setting up application directories...');
  
  try {
    // Create each required directory
    for (const dir of REQUIRED_DIRECTORIES) {
      if (ensureDirectoryExists(dir.path)) {
        console.log(`✅ ${dir.name} directory ready: ${dir.path}`);
      } else {
        throw new Error(`Failed to create ${dir.name} directory`);
      }
    }
    
    console.log('✅ All directories ready');
    return true;
  } catch (error: any) {
    console.error('❌ Failed to initialize directories:', error.message);
    return false;
  }
}

/**
 * Gets the path for a file in the output directory
 * 
 * @param filename - Filename
 * @returns Full path to the file
 */
export function getOutputPath(filename: string): string {
  return path.join(PATHS.outputDir, filename);
}

/**
 * Gets the path for a file in the temp directory
 * 
 * @param sessionId - Session ID
 * @param filename - Filename
 * @returns Full path to the file
 */
export function getTempPath(sessionId: string, filename: string): string {
  return path.join(PATHS.tempDir, sessionId, filename);
}

/**
 * Gets the path for a composition file
 * 
 * @param compositionId - Composition ID
 * @returns Full path to the composition file
 */
export function getCompositionPath(compositionId: string): string {
  return path.join(PATHS.compositionsDir, `${compositionId}.json`);
}

export default {
  ensureDirectoryExists,
  directoryExists,
  createSessionDirectory,
  createCompositionDirectory,
  initializeDirectories,
  getOutputPath,
  getTempPath,
  getCompositionPath,
  REQUIRED_DIRECTORIES
};
