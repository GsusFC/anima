/**
 * Storage utility for Figma plugins
 * Provides localStorage-like interface that works in Figma's sandboxed environment
 */

// In-memory storage fallback for Figma plugins
let memoryStorage: Record<string, string> = {};

export const pluginStorage = {
  getItem: (key: string): string | null => {
    try {
      // Try sessionStorage first if available
      if (typeof sessionStorage !== 'undefined') {
        return sessionStorage.getItem(key);
      }
    } catch (error) {
      // Fallback to memory storage
    }
    
    return memoryStorage[key] || null;
  },

  setItem: (key: string, value: string): void => {
    try {
      // Try sessionStorage first if available
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(key, value);
        return;
      }
    } catch (error) {
      // Fallback to memory storage
    }
    
    memoryStorage[key] = value;
  },

  removeItem: (key: string): void => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(key);
      }
    } catch (error) {
      // Continue to memory cleanup
    }
    
    delete memoryStorage[key];
  },

  clear: (): void => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (error) {
      // Continue to memory cleanup
    }
    
    memoryStorage = {};
  }
};

export default pluginStorage;
