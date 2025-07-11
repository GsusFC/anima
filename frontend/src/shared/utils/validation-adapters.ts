/**
 * Adaptadores de validación para compatibilidad con componentes legacy
 * 
 * Este archivo proporciona conversión bidireccional entre los tipos canónicos
 * y los formatos legacy existentes en la aplicación.
 * 
 * Arquitectura: Adaptadores Bidireccionales
 * - Mantiene compatibilidad con componentes existentes
 * - Permite migración gradual a tipos canónicos
 * - Garantiza type safety en todas las conversiones
 */

import {
  ValidationResult,
  ValidationMessage,
  createEmptyValidationResult,
  createValidationMessage,
  ValidationCodes
} from '../types/validation.types';
import { ExportState } from '../types/export.types';

/**
 * Formato legacy usado en componentes de export
 * (ExportButton, ExportValidationDisplay, etc.)
 */
export interface LegacyValidationResult {
  canExport: boolean;
  messages: Array<{ 
    type: 'error' | 'warning'; 
    message: string 
  }>;
}

/**
 * Formato compacto usado en ValidationSummaryCompact
 */
export interface ValidationSummaryCompact {
  canExport: boolean;
  messages: Array<{ 
    type: 'error' | 'warning'; 
    message: string 
  }>;
}

/**
 * Formato usado en ExportValidationDisplay (sin propiedades de estado)
 */
export interface ExportValidationDisplay {
  canExport: boolean;
  messages: Array<{ 
    type: 'error' | 'warning'; 
    message: string 
  }>;
}

/**
 * Convierte ValidationResult canónico a formato legacy
 * 
 * @param validation - Resultado de validación canónico
 * @returns Formato legacy compatible con componentes existentes
 */
export const toLegacyValidation = (validation: ValidationResult): LegacyValidationResult => {
  return {
    canExport: validation.canExport,
    messages: validation.messages
      .filter(msg => msg.type === 'error' || msg.type === 'warning')
      .map(msg => ({
        type: msg.type as 'error' | 'warning',
        message: msg.message
      }))
  };
};

/**
 * Convierte formato legacy a ValidationResult canónico
 * 
 * @param legacy - Resultado en formato legacy
 * @param field - Campo por defecto para los mensajes (opcional)
 * @returns ValidationResult canónico completo
 */
export const fromLegacyValidation = (
  legacy: LegacyValidationResult, 
  field: string = 'general'
): ValidationResult => {
  const messages: ValidationMessage[] = legacy.messages.map((msg) =>
    createValidationMessage(
      msg.type,
      field,
      msg.type === 'error' ? ValidationCodes.INVALID_DURATION : ValidationCodes.SHORT_DURATION,
      msg.message
    )
  );

  const hasErrors = messages.some(msg => msg.type === 'error');
  const hasWarnings = messages.some(msg => msg.type === 'warning');

  return {
    isValid: !hasErrors,
    canExport: legacy.canExport,
    messages,
    hasErrors,
    hasWarnings
  };
};

/**
 * Convierte a formato ValidationSummaryCompact
 * (Alias de toLegacyValidation para claridad semántica)
 */
export const toValidationSummaryCompact = (validation: ValidationResult): ValidationSummaryCompact => {
  return toLegacyValidation(validation);
};

/**
 * Convierte a formato ExportValidationDisplay
 * (Alias de toLegacyValidation para claridad semántica)
 */
export const toExportValidationDisplay = (validation: ValidationResult): ExportValidationDisplay => {
  return toLegacyValidation(validation);
};

/**
 * Helper para verificar si un objeto tiene el formato legacy
 */
export const isLegacyValidationResult = (obj: any): obj is LegacyValidationResult => {
  return obj && 
         typeof obj.canExport === 'boolean' &&
         Array.isArray(obj.messages) &&
         obj.messages.every((msg: any) => 
           msg && 
           typeof msg.message === 'string' &&
           (msg.type === 'error' || msg.type === 'warning')
         );
};

/**
 * Helper para verificar si un objeto tiene el formato canónico
 */
export const isCanonicalValidationResult = (obj: any): obj is ValidationResult => {
  return obj &&
         typeof obj.isValid === 'boolean' &&
         typeof obj.canExport === 'boolean' &&
         typeof obj.hasErrors === 'boolean' &&
         typeof obj.hasWarnings === 'boolean' &&
         Array.isArray(obj.messages) &&
         obj.messages.every((msg: any) =>
           msg &&
           typeof msg.type === 'string' &&
           typeof msg.field === 'string' &&
           typeof msg.message === 'string' &&
           typeof msg.code === 'string'
         );
};

/**
 * Convierte automáticamente entre formatos según el tipo detectado
 * 
 * @param validation - Validación en cualquier formato
 * @returns ValidationResult canónico
 */
export const normalizeValidation = (validation: any): ValidationResult => {
  if (isCanonicalValidationResult(validation)) {
    return validation;
  }
  
  if (isLegacyValidationResult(validation)) {
    return fromLegacyValidation(validation);
  }
  
  // Fallback: crear resultado vacío si el formato no es reconocido
  console.warn('Formato de validación no reconocido, usando resultado vacío:', validation);
  return createEmptyValidationResult();
};

/**
 * Combina múltiples resultados de validación en uno solo
 * 
 * @param validations - Array de resultados de validación
 * @returns ValidationResult combinado
 */
export const combineValidationResults = (validations: ValidationResult[]): ValidationResult => {
  if (validations.length === 0) {
    return createEmptyValidationResult();
  }

  const allMessages = validations.flatMap(v => v.messages);
  const hasErrors = allMessages.some(msg => msg.type === 'error');
  const hasWarnings = allMessages.some(msg => msg.type === 'warning');

  return {
    isValid: !hasErrors,
    canExport: validations.every(v => v.canExport),
    messages: allMessages,
    hasErrors,
    hasWarnings
  };
};

/**
 * Adaptadores para ExportState
 * Convierte entre el formato legacy de slideshow y el tipo canónico
 */

/**
 * Formato legacy de ExportState usado en slideshow
 */
export interface LegacySlideshowExportState {
  isExporting: boolean;
  progress: number;
  lastResult: string | null;
  error: string | null;
  currentStep?: string;
  isCompleted: boolean;
  downloadUrl?: string;
  filename?: string;
}

/**
 * Convierte ExportState canónico a formato legacy de slideshow
 */
export const toLegacySlideshowExportState = (exportState: ExportState): LegacySlideshowExportState => {
  return {
    isExporting: exportState.isExporting,
    progress: exportState.progress,
    lastResult: exportState.lastResult || null,
    error: exportState.error,
    currentStep: exportState.currentStep,
    isCompleted: exportState.isCompleted,
    downloadUrl: exportState.downloadUrl,
    filename: exportState.filename
  };
};

/**
 * Convierte formato legacy de slideshow a ExportState canónico
 */
export const fromLegacySlideshowExportState = (legacy: LegacySlideshowExportState): ExportState => {
  return {
    isExporting: legacy.isExporting,
    isCompleted: legacy.isCompleted,
    progress: legacy.progress,
    status: legacy.isExporting
      ? (legacy.currentStep || 'Exportando...')
      : legacy.isCompleted
      ? 'Export completado'
      : 'Listo para exportar',
    error: legacy.error,
    lastResult: legacy.lastResult,
    currentStep: legacy.currentStep,
    downloadUrl: legacy.downloadUrl,
    filename: legacy.filename,
    exportUrl: legacy.downloadUrl
  };
};
