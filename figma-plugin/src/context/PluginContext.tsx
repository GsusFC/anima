import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { apiService } from '../services/api';
import { pluginStorage } from '../utils/storage';

export interface GifConfig {
  fps: number;
  colors: number;
  loop: boolean;
  dithering: {
    enabled: boolean;
    algorithm: 'floyd-steinberg' | 'sierra' | 'atkinson' | 'burkes' | 'stucki' | 'none';
    intensity: number; // 0-100 percentage
    serpentine: boolean; // zigzag pattern vs linear
  };
}

export interface Mp4Config {
  fps: number;
  quality: 'web' | 'standard' | 'high' | 'ultra';
  resolution: {
    preset: 'auto' | 'custom';
    width?: number;
    height?: number;
  };
}

export interface WebmConfig {
  fps: number;
  quality: 'web' | 'standard' | 'high' | 'ultra';
  resolution: {
    preset: 'auto' | 'custom';
    width?: number;
    height?: number;
  };
}

interface PluginConfig {
  apiBaseURL: string;
  debugMode: boolean;
  maxImageSize: number;
  defaultDuration: number;
  defaultTransition: string;
  gif: GifConfig;
  mp4: Mp4Config;
  webm: WebmConfig;
}

interface PluginContextValue {
  config: PluginConfig;
  updateConfig: (updates: Partial<PluginConfig>) => void;
  resetConfig: () => void;
}

const defaultConfig: PluginConfig = {
  apiBaseURL: 'http://localhost:3001',
  debugMode: false,
  maxImageSize: 10 * 1024 * 1024, // 10MB
  defaultDuration: 1000, // 1 second
  defaultTransition: 'fade',
  gif: {
    fps: 15,
    colors: 256,
    loop: true,
    dithering: {
      enabled: true,
      algorithm: 'floyd-steinberg',
      intensity: 75,
      serpentine: true
    }
  },
  video: {
    fps: 30,
    quality: 'high',
    resolution: {
      preset: 'auto'
    }
  }
};

const PluginContext = createContext<PluginContextValue | undefined>(undefined);

export const usePluginContext = (): PluginContextValue => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error('usePluginContext must be used within a PluginProvider');
  }
  return context;
};

interface PluginProviderProps {
  children: ReactNode;
  initialConfig?: Partial<PluginConfig>;
}

export const PluginProvider: React.FC<PluginProviderProps> = ({ 
  children, 
  initialConfig = {} 
}) => {
  // Load config from plugin storage on mount
  const loadStoredConfig = (): PluginConfig => {
    const stored = pluginStorage.getItem('ANIMAGEN_CONFIG');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...defaultConfig, ...parsed, ...initialConfig };
      } catch (error) {
        console.warn('Failed to parse stored config:', error);
      }
    }
    
    // Legacy support - migrate old API URL setting
    const legacyAPI = pluginStorage.getItem('ANIMAGEN_API');
    if (legacyAPI) {
      return { 
        ...defaultConfig, 
        ...initialConfig,
        apiBaseURL: legacyAPI 
      };
    }
    
    return { ...defaultConfig, ...initialConfig };
  };

  const [config, setConfig] = useState<PluginConfig>(loadStoredConfig);

  // Save config to plugin storage and update API service
  const saveConfig = useCallback((newConfig: PluginConfig) => {
    pluginStorage.setItem('ANIMAGEN_CONFIG', JSON.stringify(newConfig));
    apiService.updateBaseURL(newConfig.apiBaseURL);
    
    // Maintain legacy storage key for backward compatibility
    pluginStorage.setItem('ANIMAGEN_API', newConfig.apiBaseURL);
  }, []);

  const updateConfig = useCallback((updates: Partial<PluginConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    saveConfig(newConfig);
  }, [config, saveConfig]);

  const resetConfig = useCallback(() => {
    const newConfig = { ...defaultConfig };
    setConfig(newConfig);
    saveConfig(newConfig);
  }, [saveConfig]);

  // Update API service on config changes
  React.useEffect(() => {
    apiService.updateBaseURL(config.apiBaseURL);
  }, [config.apiBaseURL]);

  const value: PluginContextValue = {
    config,
    updateConfig,
    resetConfig
  };

  return (
    <PluginContext.Provider value={value}>
      {children}
    </PluginContext.Provider>
  );
};

// Hook for easy API URL management
export const useAPIConfig = () => {
  const { config, updateConfig } = usePluginContext();
  
  const setAPIURL = useCallback((url: string) => {
    updateConfig({ apiBaseURL: url });
  }, [updateConfig]);

  const promptForAPIURL = useCallback(() => {
    const url = prompt('API base URL', config.apiBaseURL);
    if (url && url !== config.apiBaseURL) {
      setAPIURL(url);
      return true;
    }
    return false;
  }, [config.apiBaseURL, setAPIURL]);

  return {
    apiURL: config.apiBaseURL,
    setAPIURL,
    promptForAPIURL
  };
};
