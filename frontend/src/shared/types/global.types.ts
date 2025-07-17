/**
 * Global Type Definitions for AnimaGen
 * 
 * Provides type-safe interfaces for global window objects and utilities
 * to eliminate 'as any' usage throughout the application.
 */

import { ToastMessage } from '../components/Toast/Toast';

/**
 * Type-safe window interface extensions
 */
export interface WindowWithToast extends Window {
  showToast?: (message: string, type: ToastMessage['type']) => void;
}

export interface WindowWithTimelineData extends Window {
  __timelineData?: any[];
  __sessionId?: string;
}

export interface WindowWithAnimaGen extends WindowWithToast, WindowWithTimelineData {
  // Future global extensions can be added here
}

/**
 * Type guards for window object extensions
 */
export const hasToastSystem = (window: Window): window is WindowWithToast => {
  return 'showToast' in window && typeof (window as WindowWithToast).showToast === 'function';
};

export const hasTimelineData = (window: Window): window is WindowWithTimelineData => {
  return '__timelineData' in window;
};

/**
 * Safe accessors for global window properties
 */
export const getGlobalToast = (): ((message: string, type: ToastMessage['type']) => void) | null => {
  const windowWithToast = window as WindowWithToast;
  return windowWithToast.showToast || null;
};

export const getTimelineData = (): any[] => {
  const windowWithData = window as WindowWithTimelineData;
  return windowWithData.__timelineData || [];
};

export const getSessionId = (): string | null => {
  const windowWithData = window as WindowWithTimelineData;
  return windowWithData.__sessionId || null;
};

/**
 * Type-safe setters for global window properties
 */
export const setGlobalToast = (toastFn: (message: string, type: ToastMessage['type']) => void): void => {
  const windowWithToast = window as WindowWithToast;
  windowWithToast.showToast = toastFn;
};

export const clearGlobalToast = (): void => {
  const windowWithToast = window as WindowWithToast;
  delete windowWithToast.showToast;
};

export const setTimelineData = (data: any[]): void => {
  const windowWithData = window as WindowWithTimelineData;
  windowWithData.__timelineData = data;
};

export const setSessionId = (sessionId: string): void => {
  const windowWithData = window as WindowWithTimelineData;
  windowWithData.__sessionId = sessionId;
};
