// Validation type adapters for converting between different ValidationResult interfaces

import { ValidationResult as FullValidationResult } from '../../hooks/useExportValidation';

export interface SimpleValidationResult {
  isValid: boolean;
  canExport: boolean;
  messages: Array<{ type: 'error' | 'warning'; message: string }>;
  hasErrors: boolean;
  hasWarnings: boolean;
}

/**
 * Converts a full ValidationResult to a simple ValidationResult
 * Filters out 'info' messages and simplifies the structure
 */
export const toSimpleValidation = (validation: FullValidationResult): SimpleValidationResult => {
  return {
    isValid: validation.isValid,
    canExport: validation.canExport,
    hasErrors: validation.hasErrors,
    hasWarnings: validation.hasWarnings,
    messages: validation.messages
      .filter(m => m.type !== 'info')
      .map(m => ({
        type: m.type as 'error' | 'warning',
        message: m.message
      }))
  };
};

/**
 * Converts a simple ValidationResult to a full ValidationResult
 * Adds missing fields with default values
 */
export const toFullValidation = (validation: SimpleValidationResult): FullValidationResult => {
  return {
    isValid: validation.isValid,
    canExport: validation.canExport,
    hasErrors: validation.hasErrors,
    hasWarnings: validation.hasWarnings,
    messages: validation.messages.map(m => ({
      type: m.type as 'error' | 'warning',
      field: 'general',
      message: m.message,
      code: m.type.toUpperCase()
    }))
  };
};

/**
 * Type guard to check if a validation result is a full validation result
 */
export const isFullValidationResult = (validation: any): validation is FullValidationResult => {
  return validation.messages && 
         validation.messages.length > 0 && 
         'field' in validation.messages[0] && 
         'code' in validation.messages[0];
};

/**
 * Adapts any validation result to the expected type
 */
export const adaptValidation = (
  validation: FullValidationResult | SimpleValidationResult,
  targetType: 'full' | 'simple'
): FullValidationResult | SimpleValidationResult => {
  if (targetType === 'full') {
    return isFullValidationResult(validation) ? validation : toFullValidation(validation as SimpleValidationResult);
  } else {
    return isFullValidationResult(validation) ? toSimpleValidation(validation) : validation;
  }
};
