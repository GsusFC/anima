import { useMemo } from 'react';

export interface ValidationMessage {
  type: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  canExport: boolean;
  messages: ValidationMessage[];
  hasErrors: boolean;
  hasWarnings: boolean;
}

export interface ExportSettings {
  format: 'gif' | 'mp4' | 'webm' | 'mov';
  fps?: number;
  quality?: 'web' | 'standard' | 'high' | 'premium' | 'ultra';
  resolution?: {
    width: number;
    height: number;
    preset?: string;
  };
  gif?: {
    colors?: number;
    dither?: boolean | string;
    loop?: string;
  };
}

/**
 * Hook para validación en tiempo real de configuraciones de exportación
 * Proporciona validación específica por formato con mensajes detallados
 */
export const useExportValidation = (settings: ExportSettings): ValidationResult => {
  return useMemo(() => {
    const messages: ValidationMessage[] = [];
    
    // Validaciones específicas por formato
    switch (settings.format) {
      case 'gif':
        validateGifSettings(settings, messages);
        break;
      case 'mp4':
        validateMp4Settings(settings, messages);
        break;
      case 'webm':
        validateWebmSettings(settings, messages);
        break;
      case 'mov':
        validateMovSettings(settings, messages);
        break;
    }
    
    // Validaciones generales
    validateGeneralSettings(settings, messages);
    
    const hasErrors = messages.some(m => m.type === 'error');
    const hasWarnings = messages.some(m => m.type === 'warning');
    
    return {
      isValid: !hasErrors,
      canExport: !hasErrors,
      messages,
      hasErrors,
      hasWarnings
    };
  }, [settings]);
};

function validateGifSettings(settings: ExportSettings, messages: ValidationMessage[]) {
  // Validación de FPS para GIF
  if (settings.fps) {
    if (settings.fps > 50) {
      messages.push({
        type: 'error',
        field: 'fps',
        message: 'FPS para GIF debe ser 50 o menor para mejor compatibilidad',
        code: 'GIF_FPS_TOO_HIGH'
      });
    } else if (settings.fps > 30) {
      messages.push({
        type: 'warning',
        field: 'fps',
        message: 'FPS mayor a 30 puede resultar en archivos GIF muy grandes',
        code: 'GIF_FPS_HIGH'
      });
    } else if (settings.fps < 10) {
      messages.push({
        type: 'warning',
        field: 'fps',
        message: 'FPS menor a 10 puede resultar en animación entrecortada',
        code: 'GIF_FPS_LOW'
      });
    }
  }
  
  // Validación de resolución para GIF
  if (settings.resolution) {
    const { width, height } = settings.resolution;
    const totalPixels = width * height;
    
    if (width > 1920 || height > 1080) {
      messages.push({
        type: 'warning',
        field: 'resolution',
        message: 'Resolución alta puede resultar en archivos GIF muy grandes',
        code: 'GIF_RESOLUTION_HIGH'
      });
    }
    
    if (totalPixels > 2073600) { // 1920x1080
      messages.push({
        type: 'warning',
        field: 'resolution',
        message: 'Resolución muy alta puede causar problemas de rendimiento',
        code: 'GIF_RESOLUTION_PERFORMANCE'
      });
    }
  }
  
  // Validación de colores para GIF
  if (settings.gif?.colors) {
    if (settings.gif.colors < 16) {
      messages.push({
        type: 'warning',
        field: 'colors',
        message: 'Menos de 16 colores puede resultar en calidad muy baja',
        code: 'GIF_COLORS_LOW'
      });
    } else if (settings.gif.colors > 256) {
      messages.push({
        type: 'error',
        field: 'colors',
        message: 'GIF no puede tener más de 256 colores',
        code: 'GIF_COLORS_INVALID'
      });
    }
  }
}

function validateMp4Settings(settings: ExportSettings, messages: ValidationMessage[]) {
  // Validación de FPS para MP4
  if (settings.fps) {
    if (settings.fps > 60) {
      messages.push({
        type: 'error',
        field: 'fps',
        message: 'FPS para MP4 debe ser 60 o menor',
        code: 'MP4_FPS_TOO_HIGH'
      });
    } else if (settings.fps < 1) {
      messages.push({
        type: 'error',
        field: 'fps',
        message: 'FPS debe ser al menos 1',
        code: 'MP4_FPS_TOO_LOW'
      });
    }
  }
  
  // Validación de resolución para MP4
  if (settings.resolution) {
    const { width, height } = settings.resolution;
    
    if (width < 128 || height < 128) {
      messages.push({
        type: 'error',
        field: 'resolution',
        message: 'Resolución debe ser al menos 128x128',
        code: 'MP4_RESOLUTION_TOO_LOW'
      });
    }
    
    if (width > 4096 || height > 4096) {
      messages.push({
        type: 'error',
        field: 'resolution',
        message: 'Resolución no puede exceder 4096x4096',
        code: 'MP4_RESOLUTION_TOO_HIGH'
      });
    }
  }
}

function validateWebmSettings(settings: ExportSettings, messages: ValidationMessage[]) {
  // Validación similar a MP4 para WebM
  if (settings.fps) {
    if (settings.fps > 60) {
      messages.push({
        type: 'error',
        field: 'fps',
        message: 'FPS para WebM debe ser 60 o menor',
        code: 'WEBM_FPS_TOO_HIGH'
      });
    } else if (settings.fps < 1) {
      messages.push({
        type: 'error',
        field: 'fps',
        message: 'FPS debe ser al menos 1',
        code: 'WEBM_FPS_TOO_LOW'
      });
    }
  }
  
  if (settings.resolution) {
    const { width, height } = settings.resolution;
    
    if (width < 128 || height < 128) {
      messages.push({
        type: 'error',
        field: 'resolution',
        message: 'Resolución debe ser al menos 128x128',
        code: 'WEBM_RESOLUTION_TOO_LOW'
      });
    }
    
    if (width > 4096 || height > 4096) {
      messages.push({
        type: 'error',
        field: 'resolution',
        message: 'Resolución no puede exceder 4096x4096',
        code: 'WEBM_RESOLUTION_TOO_HIGH'
      });
    }
  }
}

function validateMovSettings(settings: ExportSettings, messages: ValidationMessage[]) {
  // Validación similar a MP4 para MOV
  if (settings.fps) {
    if (settings.fps > 120) {
      messages.push({
        type: 'error',
        field: 'fps',
        message: 'FPS para MOV debe ser 120 o menor',
        code: 'MOV_FPS_TOO_HIGH'
      });
    } else if (settings.fps < 1) {
      messages.push({
        type: 'error',
        field: 'fps',
        message: 'FPS debe ser al menos 1',
        code: 'MOV_FPS_TOO_LOW'
      });
    }
  }
  
  if (settings.resolution) {
    const { width, height } = settings.resolution;
    
    if (width < 128 || height < 128) {
      messages.push({
        type: 'error',
        field: 'resolution',
        message: 'Resolución debe ser al menos 128x128',
        code: 'MOV_RESOLUTION_TOO_LOW'
      });
    }
    
    if (width > 7680 || height > 4320) {
      messages.push({
        type: 'warning',
        field: 'resolution',
        message: 'Resolución muy alta (8K) puede causar problemas de rendimiento',
        code: 'MOV_RESOLUTION_8K'
      });
    }
  }
}

function validateGeneralSettings(settings: ExportSettings, messages: ValidationMessage[]) {
  // Validaciones que aplican a todos los formatos
  
  // Validación de calidad
  if (settings.quality) {
    const validQualities = ['web', 'standard', 'high', 'premium', 'ultra'];
    if (!validQualities.includes(settings.quality)) {
      messages.push({
        type: 'error',
        field: 'quality',
        message: 'Calidad no válida',
        code: 'INVALID_QUALITY'
      });
    }
  }
  
  // Validación de resolución general
  if (settings.resolution) {
    const { width, height } = settings.resolution;
    
    if (width <= 0 || height <= 0) {
      messages.push({
        type: 'error',
        field: 'resolution',
        message: 'Resolución debe ser mayor a 0',
        code: 'INVALID_RESOLUTION'
      });
    }
    
    // Advertencia para resoluciones muy pequeñas
    if (width < 240 || height < 240) {
      messages.push({
        type: 'warning',
        field: 'resolution',
        message: 'Resolución muy baja puede resultar en calidad pobre',
        code: 'RESOLUTION_LOW_QUALITY'
      });
    }
  }
}

// Función helper para obtener mensajes por campo específico
export const getValidationMessagesForField = (
  validation: ValidationResult, 
  field: string
): ValidationMessage[] => {
  return validation.messages.filter(message => message.field === field);
};

// Función helper para verificar si un campo específico tiene errores
export const hasFieldError = (validation: ValidationResult, field: string): boolean => {
  return validation.messages.some(message => 
    message.field === field && message.type === 'error'
  );
};

// Función helper para verificar si un campo específico tiene advertencias
export const hasFieldWarning = (validation: ValidationResult, field: string): boolean => {
  return validation.messages.some(message => 
    message.field === field && message.type === 'warning'
  );
};
