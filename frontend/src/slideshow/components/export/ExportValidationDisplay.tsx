import React from 'react';
import { ValidationMessages, ValidationSummary } from '../../../components/ValidationMessages';
import { ValidationResult } from '../../../shared/types/validation.types';
import { toExportValidationDisplay } from '../../../shared/utils/validation-adapters';

export interface ExportValidationDisplayProps {
  validation: ValidationResult;
}

const ExportValidationDisplay: React.FC<ExportValidationDisplayProps> = ({
  validation
}) => {
  // Convertir a formato legacy para compatibilidad
  const legacyValidation = toExportValidationDisplay(validation);

  // Only show validation messages if there are errors or warnings
  if (legacyValidation.messages.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <ValidationSummary validation={validation} />
      <ValidationMessages validation={validation} />
    </div>
  );
};

export default ExportValidationDisplay;
