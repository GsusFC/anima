/**
 * Tipos canónicos para export en AnimaGen
 * 
 * Este archivo define los tipos relacionados con el proceso de export
 * y el estado de export de manera consistente.
 */

/**
 * Estado de export unificado
 *
 * Este tipo asegura que todas las propiedades requeridas estén presentes
 * y sean consistentes en toda la aplicación.
 */
export interface ExportState {
  /** Indica si el export está en progreso */
  isExporting: boolean;

  /** Indica si el export ha sido completado */
  isCompleted: boolean;

  /** Progreso del export (0-100) */
  progress: number;

  /** Mensaje de estado actual */
  status: string;

  /** Error si ocurrió durante el export */
  error: string | null;

  /** URL del archivo exportado (cuando está completo) */
  exportUrl?: string;

  /** Resultado del último export */
  lastResult?: string | null;

  /** Paso actual del proceso */
  currentStep?: string;

  /** URL de descarga */
  downloadUrl?: string;

  /** Nombre del archivo */
  filename?: string;

  /** Timestamp de inicio del export */
  startTime?: number;

  /** Timestamp de finalización del export */
  endTime?: number;
}

/**
 * Configuración de export
 */
export interface ExportConfig {
  /** Formato de salida */
  format: 'mp4' | 'webm' | 'gif';
  
  /** Calidad de video (1-100) */
  quality: number;
  
  /** Resolución de salida */
  resolution: {
    width: number;
    height: number;
  };
  
  /** FPS del video */
  fps: number;
  
  /** Incluir audio */
  includeAudio: boolean;
  
  /** Configuración de audio */
  audioConfig?: {
    volume: number;
    fadeIn: boolean;
    fadeOut: boolean;
  };
}

/**
 * Resultado de export
 */
export interface ExportResult {
  /** Indica si el export fue exitoso */
  success: boolean;
  
  /** URL del archivo exportado */
  url?: string;
  
  /** Tamaño del archivo en bytes */
  fileSize?: number;
  
  /** Duración del proceso de export en ms */
  duration?: number;
  
  /** Error si ocurrió */
  error?: string;
  
  /** Metadatos adicionales */
  metadata?: {
    format: string;
    resolution: string;
    fps: number;
    duration: number;
  };
}

/**
 * Helper para crear un ExportState inicial
 *
 * Garantiza que todas las propiedades requeridas estén presentes
 * con valores por defecto apropiados.
 */
export const createInitialExportState = (): ExportState => ({
  isExporting: false,
  isCompleted: false,
  progress: 0,
  status: 'Listo para exportar',
  error: null,
  lastResult: null
});

/**
 * Helper para crear un ExportState de progreso
 */
export const createProgressExportState = (
  progress: number,
  status: string,
  currentStep?: string
): ExportState => ({
  isExporting: true,
  isCompleted: false,
  progress: Math.max(0, Math.min(100, progress)),
  status,
  error: null,
  lastResult: null,
  currentStep,
  startTime: Date.now()
});

/**
 * Helper para crear un ExportState completado
 */
export const createCompletedExportState = (
  exportUrl: string,
  startTime?: number
): ExportState => ({
  isExporting: false,
  isCompleted: true,
  progress: 100,
  status: 'Export completado',
  error: null,
  exportUrl,
  lastResult: exportUrl,
  downloadUrl: exportUrl,
  startTime,
  endTime: Date.now()
});

/**
 * Helper para crear un ExportState de error
 */
export const createErrorExportState = (
  error: string,
  startTime?: number
): ExportState => ({
  isExporting: false,
  isCompleted: false,
  progress: 0,
  status: 'Error en export',
  error,
  lastResult: null,
  startTime,
  endTime: Date.now()
});

/**
 * Configuración de export por defecto
 */
export const defaultExportConfig: ExportConfig = {
  format: 'mp4',
  quality: 80,
  resolution: {
    width: 1920,
    height: 1080
  },
  fps: 30,
  includeAudio: false
};
