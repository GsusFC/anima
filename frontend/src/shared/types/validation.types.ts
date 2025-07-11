/**
 * Tipos canónicos para validación en AnimaGen
 * 
 * Este archivo define la fuente única de verdad para todos los tipos
 * relacionados con validación en la aplicación.
 * 
 * Arquitectura: Tipos Canónicos + Adaptadores
 * - Estos tipos son la referencia principal
 * - Los adaptadores convierten entre formatos legacy y canónicos
 * - Garantiza consistencia y type safety
 */

/**
 * Mensaje individual de validación
 */
export interface ValidationMessage {
  /** Tipo de mensaje: error bloquea export, warning permite export, info es informativo */
  type: 'error' | 'warning' | 'info';
  
  /** Campo o área específica donde ocurre el problema */
  field: string;
  
  /** Mensaje descriptivo para el usuario */
  message: string;
  
  /** Código único para identificar el tipo de validación */
  code: string;
}

/**
 * Resultado completo de validación - Tipo Canónico
 * 
 * Este es el formato estándar que deben usar todos los hooks y componentes nuevos.
 * Para componentes legacy, usar los adaptadores en validation-adapters.ts
 */
export interface ValidationResult {
  /** Indica si la validación pasó completamente (sin errores) */
  isValid: boolean;
  
  /** Indica si se puede proceder con el export (sin errores críticos) */
  canExport: boolean;
  
  /** Lista de todos los mensajes de validación */
  messages: ValidationMessage[];
  
  /** Indica si hay al menos un error */
  hasErrors: boolean;
  
  /** Indica si hay al menos una advertencia */
  hasWarnings: boolean;
}

/**
 * Configuración para validación
 */
export interface ValidationConfig {
  /** Validar configuración de duración */
  validateDuration?: boolean;
  
  /** Validar configuración de transiciones */
  validateTransitions?: boolean;
  
  /** Validar configuración de audio */
  validateAudio?: boolean;
  
  /** Validar que hay al menos una imagen */
  validateImages?: boolean;
  
  /** Modo estricto: warnings se tratan como errores */
  strictMode?: boolean;
}

/**
 * Contexto de validación para proporcionar información adicional
 */
export interface ValidationContext {
  /** Número total de imágenes */
  imageCount: number;
  
  /** Duración total configurada */
  totalDuration: number;
  
  /** Configuración de transiciones activa */
  hasTransitions: boolean;
  
  /** Configuración de audio activa */
  hasAudio: boolean;
}

/**
 * Códigos estándar de validación para consistencia
 */
export const ValidationCodes = {
  // Errores críticos
  NO_IMAGES: 'NO_IMAGES',
  INVALID_DURATION: 'INVALID_DURATION',
  INVALID_TRANSITION_DURATION: 'INVALID_TRANSITION_DURATION',
  INVALID_AUDIO_CONFIG: 'INVALID_AUDIO_CONFIG',
  
  // Advertencias
  SHORT_DURATION: 'SHORT_DURATION',
  LONG_DURATION: 'LONG_DURATION',
  NO_TRANSITIONS: 'NO_TRANSITIONS',
  NO_AUDIO: 'NO_AUDIO',
  
  // Información
  OPTIMAL_CONFIG: 'OPTIMAL_CONFIG',
  PERFORMANCE_TIP: 'PERFORMANCE_TIP'
} as const;

/**
 * Mensajes estándar para cada código de validación
 */
export const ValidationMessages = {
  [ValidationCodes.NO_IMAGES]: 'Debes agregar al menos una imagen para crear el slideshow',
  [ValidationCodes.INVALID_DURATION]: 'La duración debe ser mayor a 0 segundos',
  [ValidationCodes.INVALID_TRANSITION_DURATION]: 'La duración de transición debe ser válida',
  [ValidationCodes.INVALID_AUDIO_CONFIG]: 'La configuración de audio no es válida',
  [ValidationCodes.SHORT_DURATION]: 'Duración muy corta, considera aumentarla',
  [ValidationCodes.LONG_DURATION]: 'Duración muy larga, puede afectar el rendimiento',
  [ValidationCodes.NO_TRANSITIONS]: 'Sin transiciones configuradas',
  [ValidationCodes.NO_AUDIO]: 'Sin audio configurado',
  [ValidationCodes.OPTIMAL_CONFIG]: 'Configuración óptima',
  [ValidationCodes.PERFORMANCE_TIP]: 'Tip: configuración optimizada para mejor rendimiento'
} as const;

/**
 * Helper para crear un ValidationResult vacío/inicial
 */
export const createEmptyValidationResult = (): ValidationResult => ({
  isValid: true,
  canExport: true,
  messages: [],
  hasErrors: false,
  hasWarnings: false
});

/**
 * Helper para crear un ValidationMessage
 */
export const createValidationMessage = (
  type: ValidationMessage['type'],
  field: string,
  code: keyof typeof ValidationCodes,
  customMessage?: string
): ValidationMessage => ({
  type,
  field,
  code,
  message: customMessage || ValidationMessages[code]
});
