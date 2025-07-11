import { useMemo } from 'react';
import {
  ValidationResult,
  ValidationMessage,
  createValidationMessage,
  ValidationCodes
} from '../shared/types/validation.types';

// Re-exportar tipos para compatibilidad con componentes existentes
export type { ValidationResult, ValidationMessage };

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
      messages.push(createValidationMessage(
        'error',
        'fps',
        ValidationCodes.INVALID_DURATION,
        'FPS para GIF debe ser 50 o menor para mejor compatibilidad'
      ));
    } else if (settings.fps > 30) {
      messages.push(createValidationMessage(
        'warning',
        'fps',
        ValidationCodes.PERFORMANCE_TIP,
        'FPS mayor a 30 puede resultar en archivos GIF muy grandes'
      ));
    } else if (settings.fps < 10) {
      messages.push(createValidationMessage(
        'warning',
        'fps',
        ValidationCodes.PERFORMANCE_TIP,
        'FPS menor a 10 puede resultar en animación entrecortada'
      ));
    }
  }
  
  // Validación de resolución para GIF
  if (settings.resolution) {
    const { width, height } = settings.resolution;
    const totalPixels = width * height;

    if (width > 1920 || height > 1080) {
      messages.push(createValidationMessage(
        'warning',
        'resolution',
        ValidationCodes.PERFORMANCE_TIP,
        'Resolución alta puede resultar en archivos GIF muy grandes'
      ));
    }

    if (totalPixels > 2073600) { // 1920x1080
      messages.push(createValidationMessage(
        'warning',
        'resolution',
        ValidationCodes.PERFORMANCE_TIP,
        'Resolución muy alta puede causar problemas de rendimiento'
      ));
    }
  }

  // Validación de colores para GIF
  if (settings.gif?.colors) {
    if (settings.gif.colors < 16) {
      messages.push(createValidationMessage(
        'warning',
        'colors',
        ValidationCodes.PERFORMANCE_TIP,
        'Menos de 16 colores puede resultar en calidad muy baja'
      ));
    } else if (settings.gif.colors > 256) {
      messages.push(createValidationMessage(
        'error',
        'colors',
        ValidationCodes.INVALID_AUDIO_CONFIG,
        'GIF no puede tener más de 256 colores'
      ));
    }
  }
}

function validateMp4Settings(settings: ExportSettings, messages: ValidationMessage[]) {
  // Validación de FPS para MP4
  if (settings.fps) {
    if (settings.fps > 60) {
      messages.push(createValidationMessage(
        'error',
        'fps',
        ValidationCodes.INVALID_DURATION,
        'FPS para MP4 debe ser 60 o menor'
      ));
    } else if (settings.fps < 1) {
      messages.push(createValidationMessage(
        'error',
        'fps',
        ValidationCodes.INVALID_DURATION,
        'FPS debe ser al menos 1'
      ));
    }
  }

  // Validación de resolución para MP4
  if (settings.resolution) {
    const { width, height } = settings.resolution;

    if (width < 128 || height < 128) {
      messages.push(createValidationMessage(
        'error',
        'resolution',
        ValidationCodes.INVALID_DURATION,
        'Resolución debe ser al menos 128x128'
      ));
    }

    if (width > 4096 || height > 4096) {
      messages.push(createValidationMessage(
        'error',
        'resolution',
        ValidationCodes.INVALID_DURATION,
        'Resolución no puede exceder 4096x4096'
      ));
    }
  }
}

function validateWebmSettings(settings: ExportSettings, messages: ValidationMessage[]) {
  // Validación similar a MP4 para WebM
  if (settings.fps) {
    if (settings.fps > 60) {
      messages.push(createValidationMessage(
        'error',
        'fps',
        ValidationCodes.INVALID_DURATION,
        'FPS para WebM debe ser 60 o menor'
      ));
    } else if (settings.fps < 1) {
      messages.push(createValidationMessage(
        'error',
        'fps',
        ValidationCodes.INVALID_DURATION,
        'FPS debe ser al menos 1'
      ));
    }
  }

  if (settings.resolution) {
    const { width, height } = settings.resolution;

    if (width < 128 || height < 128) {
      messages.push(createValidationMessage(
        'error',
        'resolution',
        ValidationCodes.INVALID_DURATION,
        'Resolución debe ser al menos 128x128'
      ));
    }

    if (width > 4096 || height > 4096) {
      messages.push(createValidationMessage(
        'error',
        'resolution',
        ValidationCodes.INVALID_DURATION,
        'Resolución no puede exceder 4096x4096'
      ));
    }
  }
}

function validateMovSettings(settings: ExportSettings, messages: ValidationMessage[]) {
  // Validación similar a MP4 para MOV
  if (settings.fps) {
    if (settings.fps > 120) {
      messages.push(createValidationMessage(
        'error',
        'fps',
        ValidationCodes.INVALID_DURATION,
        'FPS para MOV debe ser 120 o menor'
      ));
    } else if (settings.fps < 1) {
      messages.push(createValidationMessage(
        'error',
        'fps',
        ValidationCodes.INVALID_DURATION,
        'FPS debe ser al menos 1'
      ));
    }
  }

  if (settings.resolution) {
    const { width, height } = settings.resolution;

    if (width < 128 || height < 128) {
      messages.push(createValidationMessage(
        'error',
        'resolution',
        ValidationCodes.INVALID_DURATION,
        'Resolución debe ser al menos 128x128'
      ));
    }

    if (width > 7680 || height > 4320) {
      messages.push(createValidationMessage(
        'warning',
        'resolution',
        ValidationCodes.PERFORMANCE_TIP,
        'Resolución muy alta (8K) puede causar problemas de rendimiento'
      ));
    }
  }
}

function validateGeneralSettings(settings: ExportSettings, messages: ValidationMessage[]) {
  // Validaciones que aplican a todos los formatos

  // Validación de calidad
  if (settings.quality) {
    const validQualities = ['web', 'standard', 'high', 'premium', 'ultra'];
    if (validQualities.indexOf(settings.quality) === -1) {
      messages.push(createValidationMessage(
        'error',
        'quality',
        ValidationCodes.INVALID_AUDIO_CONFIG,
        'Calidad no válida'
      ));
    }
  }

  // Validación de resolución general
  if (settings.resolution) {
    const { width, height } = settings.resolution;

    if (width <= 0 || height <= 0) {
      messages.push(createValidationMessage(
        'error',
        'resolution',
        ValidationCodes.INVALID_DURATION,
        'Resolución debe ser mayor a 0'
      ));
    }

    // Advertencia para resoluciones muy pequeñas
    if (width < 240 || height < 240) {
      messages.push(createValidationMessage(
        'warning',
        'resolution',
        ValidationCodes.PERFORMANCE_TIP,
        'Resolución muy baja puede resultar en calidad pobre'
      ));
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
