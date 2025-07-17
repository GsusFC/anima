/**
 * Base Media Editor Hook
 * 
 * Unified hook for media editing functionality across slideshow and video-editor.
 * Eliminates logic duplication and provides consistent behavior.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  BaseProject,
  BaseExportState,
  BasePreviewState,
  ValidationResult
} from '../types/unified.types';

// Base media editor configuration
export interface BaseMediaEditorConfig<
  TProject extends BaseProject<any, any>,
  TExportState extends BaseExportState,
  TPreviewState extends BasePreviewState
> {
  // Initial state
  initialProject: TProject;
  initialExportState: TExportState;
  initialPreviewState: TPreviewState;
  
  // API endpoints
  uploadEndpoint?: string;
  exportEndpoint?: string;
  previewEndpoint?: string;
  
  // Validation
  validateProject?: (project: TProject) => ValidationResult;
  validateExportSettings?: (settings: TProject['exportSettings']) => ValidationResult;
  
  // Callbacks
  onProjectChange?: (project: TProject) => void;
  onExportComplete?: (result: any) => void;
  onPreviewGenerated?: (url: string) => void;
  onError?: (error: Error) => void;
}

// Base media editor return type
export interface BaseMediaEditorReturn<
  TProject extends BaseProject<any, any>,
  TExportState extends BaseExportState,
  TPreviewState extends BasePreviewState
> {
  // State
  project: TProject;
  exportState: TExportState;
  previewState: TPreviewState;
  isUploading: boolean;
  isLoading: boolean;
  
  // Computed properties
  hasContent: boolean;
  canExport: boolean;
  canPreview: boolean;
  
  // Project actions
  updateProject: (updates: Partial<TProject>) => void;
  resetProject: () => void;
  
  // Export settings actions
  updateExportSettings: (updates: Partial<TProject['exportSettings']>) => void;
  resetExportSettings: () => void;
  
  // Export actions
  updateExportState: (updates: Partial<TExportState>) => void;
  startExport: () => Promise<void>;
  cancelExport: () => void;
  
  // Preview actions
  updatePreviewState: (updates: Partial<TPreviewState>) => void;
  generatePreview: () => Promise<void>;
  clearPreview: () => void;
  
  // Timeline actions
  updateTimelineItem: (itemId: string, updates: any) => void;
  removeFromTimeline: (itemId: string) => void;
  reorderTimeline: (newTimeline: any[]) => void;
  clearTimeline: () => void;
  
  // Upload actions
  setUploading: (uploading: boolean) => void;
  
  // Validation
  validateProject: () => ValidationResult;
  validateExportSettings: () => ValidationResult;
}

/**
 * Base Media Editor Hook
 * 
 * Provides unified state management and actions for media editing applications.
 * Can be extended for specific use cases (slideshow, video-editor).
 */
export function useBaseMediaEditor<
  TProject extends BaseProject<any, any>,
  TExportState extends BaseExportState,
  TPreviewState extends BasePreviewState
>(
  config: BaseMediaEditorConfig<TProject, TExportState, TPreviewState>
): BaseMediaEditorReturn<TProject, TExportState, TPreviewState> {
  
  const {
    initialProject,
    initialExportState,
    initialPreviewState,
    uploadEndpoint: _uploadEndpoint = '/api/upload',
    exportEndpoint = '/api/export',
    previewEndpoint = '/api/preview',
    validateProject: customValidateProject,
    validateExportSettings: customValidateExportSettings,
    onProjectChange,
    onExportComplete,
    onPreviewGenerated,
    onError
  } = config;

  // Core state
  const [project, setProject] = useState<TProject>(initialProject);
  const [exportState, setExportState] = useState<TExportState>(initialExportState);
  const [previewState, setPreviewState] = useState<TPreviewState>(initialPreviewState);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, _setIsLoading] = useState(false);

  // Refs for cleanup
  const exportAbortController = useRef<AbortController | null>(null);
  const previewAbortController = useRef<AbortController | null>(null);

  // Computed properties
  const hasContent = project.timeline.length > 0;
  const canExport = hasContent && !exportState.isExporting && !exportState.error;
  const canPreview = hasContent && !previewState.isGenerating;

  // Project actions
  const updateProject = useCallback((updates: Partial<TProject>) => {
    setProject(prev => {
      const updated = { ...prev, ...updates, updatedAt: new Date() };
      onProjectChange?.(updated);
      return updated;
    });
  }, [onProjectChange]);

  const resetProject = useCallback(() => {
    setProject(initialProject);
  }, [initialProject]);

  // Export settings actions
  const updateExportSettings = useCallback((updates: Partial<TProject['exportSettings']>) => {
    updateProject({
      exportSettings: { ...project.exportSettings, ...updates }
    } as Partial<TProject>);
  }, [project.exportSettings, updateProject]);

  const resetExportSettings = useCallback(() => {
    updateProject({
      exportSettings: initialProject.exportSettings
    } as Partial<TProject>);
  }, [initialProject.exportSettings, updateProject]);

  // Export state actions
  const updateExportState = useCallback((updates: Partial<TExportState>) => {
    setExportState(prev => ({ ...prev, ...updates }));
  }, []);

  const startExport = useCallback(async () => {
    if (!canExport) return;

    // Cancel any existing export
    if (exportAbortController.current) {
      exportAbortController.current.abort();
    }

    exportAbortController.current = new AbortController();

    try {
      updateExportState({
        isExporting: true,
        progress: 0,
        error: null,
        isCompleted: false
      } as Partial<TExportState>);

      // Simulate export process (replace with actual API call)
      const response = await fetch(exportEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          settings: project.exportSettings
        }),
        signal: exportAbortController.current.signal
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const result = await response.json();

      updateExportState({
        isExporting: false,
        progress: 100,
        isCompleted: true,
        downloadUrl: result.downloadUrl
      } as Partial<TExportState>);

      onExportComplete?.(result);

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        updateExportState({
          isExporting: false,
          error: error.message,
          progress: 0
        } as Partial<TExportState>);
        onError?.(error);
      }
    }
  }, [canExport, exportEndpoint, project, updateExportState, onExportComplete, onError]);

  const cancelExport = useCallback(() => {
    if (exportAbortController.current) {
      exportAbortController.current.abort();
    }
    updateExportState({
      isExporting: false,
      progress: 0,
      error: null
    } as Partial<TExportState>);
  }, [updateExportState]);

  // Preview state actions
  const updatePreviewState = useCallback((updates: Partial<TPreviewState>) => {
    setPreviewState(prev => ({ ...prev, ...updates }));
  }, []);

  const generatePreview = useCallback(async () => {
    if (!canPreview) return;

    // Cancel any existing preview generation
    if (previewAbortController.current) {
      previewAbortController.current.abort();
    }

    previewAbortController.current = new AbortController();

    try {
      updatePreviewState({
        isGenerating: true,
        error: null
      } as Partial<TPreviewState>);

      // Simulate preview generation (replace with actual API call)
      const response = await fetch(previewEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          settings: { ...project.exportSettings, quality: 'web' }
        }),
        signal: previewAbortController.current.signal
      });

      if (!response.ok) {
        throw new Error(`Preview generation failed: ${response.statusText}`);
      }

      const result = await response.json();

      updatePreviewState({
        isGenerating: false,
        url: result.previewUrl,
        lastGenerated: new Date()
      } as Partial<TPreviewState>);

      onPreviewGenerated?.(result.previewUrl);

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        updatePreviewState({
          isGenerating: false,
          error: error.message
        } as Partial<TPreviewState>);
        onError?.(error);
      }
    }
  }, [canPreview, previewEndpoint, project, updatePreviewState, onPreviewGenerated, onError]);

  const clearPreview = useCallback(() => {
    updatePreviewState({
      url: null,
      error: null,
      lastGenerated: undefined
    } as Partial<TPreviewState>);
  }, [updatePreviewState]);

  // Timeline actions
  const updateTimelineItem = useCallback((itemId: string, updates: any) => {
    const newTimeline = project.timeline.map(item =>
      item.id === itemId ? { ...item, ...updates, updatedAt: new Date() } : item
    );
    updateProject({ timeline: newTimeline } as Partial<TProject>);
  }, [project.timeline, updateProject]);

  const removeFromTimeline = useCallback((itemId: string) => {
    const newTimeline = project.timeline.filter(item => item.id !== itemId);
    updateProject({ timeline: newTimeline } as Partial<TProject>);
  }, [project.timeline, updateProject]);

  const reorderTimeline = useCallback((newTimeline: any[]) => {
    updateProject({ timeline: newTimeline } as Partial<TProject>);
  }, [updateProject]);

  const clearTimeline = useCallback(() => {
    updateProject({ timeline: [] as any } as Partial<TProject>);
  }, [updateProject]);

  // Upload actions
  const setUploading = useCallback((uploading: boolean) => {
    setIsUploading(uploading);
  }, []);

  // Validation
  const validateProject = useCallback((): ValidationResult => {
    if (customValidateProject) {
      return customValidateProject(project);
    }
    
    // Default validation
    return {
      isValid: hasContent,
      canExport: hasContent,
      hasErrors: !hasContent,
      hasWarnings: false,
      messages: hasContent ? [] : [{
        type: 'error',
        message: 'Project must have at least one item in timeline',
        field: 'timeline'
      }]
    };
  }, [customValidateProject, project, hasContent]);

  const validateExportSettings = useCallback((): ValidationResult => {
    if (customValidateExportSettings) {
      return customValidateExportSettings(project.exportSettings);
    }
    
    // Default validation
    return {
      isValid: true,
      canExport: true,
      hasErrors: false,
      hasWarnings: false,
      messages: []
    };
  }, [customValidateExportSettings, project.exportSettings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (exportAbortController.current) {
        exportAbortController.current.abort();
      }
      if (previewAbortController.current) {
        previewAbortController.current.abort();
      }
    };
  }, []);

  return {
    // State
    project,
    exportState,
    previewState,
    isUploading,
    isLoading,
    
    // Computed properties
    hasContent,
    canExport,
    canPreview,
    
    // Project actions
    updateProject,
    resetProject,
    
    // Export settings actions
    updateExportSettings,
    resetExportSettings,
    
    // Export actions
    updateExportState,
    startExport,
    cancelExport,
    
    // Preview actions
    updatePreviewState,
    generatePreview,
    clearPreview,
    
    // Timeline actions
    updateTimelineItem,
    removeFromTimeline,
    reorderTimeline,
    clearTimeline,
    
    // Upload actions
    setUploading,
    
    // Validation
    validateProject,
    validateExportSettings
  };
}
