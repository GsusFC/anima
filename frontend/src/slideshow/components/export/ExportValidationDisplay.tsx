import React from 'react';
import { ValidationMessages, ValidationSummary } from '../../../components/ValidationMessages';

export interface ValidationResult {
  canExport: boolean;
  messages: Array<{ type: 'error' | 'warning'; message: string }>;
}

export interface ExportValidationDisplayProps {
  validation: ValidationResult;
}

const ExportValidationDisplay: React.FC<ExportValidationDisplayProps> = ({
  validation
}) => {
  // Only show validation messages if there are errors or warnings
  if (validation.messages.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <ValidationSummary validation={validation} />
      <ValidationMessages messages={validation.messages} />
    </div>
  );
};

export default ExportValidationDisplay;
