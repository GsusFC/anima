import React from 'react';
import { ValidationMessage, ValidationResult } from '../../hooks/useExportValidation';

interface ValidationMessagesProps {
  validation: ValidationResult;
  className?: string;
  showOnlyErrors?: boolean;
  showOnlyWarnings?: boolean;
  maxMessages?: number;
  compact?: boolean;
}

const ValidationMessages: React.FC<ValidationMessagesProps> = ({
  validation,
  className = '',
  showOnlyErrors = false,
  showOnlyWarnings = false,
  maxMessages,
  compact = false
}) => {
  // Filtrar mensajes según las props
  let filteredMessages = validation.messages;
  
  if (showOnlyErrors) {
    filteredMessages = filteredMessages.filter(m => m.type === 'error');
  } else if (showOnlyWarnings) {
    filteredMessages = filteredMessages.filter(m => m.type === 'warning');
  }
  
  // Limitar número de mensajes si se especifica
  if (maxMessages && maxMessages > 0) {
    filteredMessages = filteredMessages.slice(0, maxMessages);
  }
  
  // No mostrar nada si no hay mensajes
  if (filteredMessages.length === 0) {
    return null;
  }
  
  return (
    <div className={`validation-messages ${className}`}>
      {filteredMessages.map((message, index) => (
        <ValidationMessageItem 
          key={`${message.code}-${index}`}
          message={message}
          compact={compact}
        />
      ))}
    </div>
  );
};

interface ValidationMessageItemProps {
  message: ValidationMessage;
  compact?: boolean;
}

const ValidationMessageItem: React.FC<ValidationMessageItemProps> = ({ 
  message, 
  compact = false 
}) => {
  const getMessageStyles = () => {
    const baseStyles = compact 
      ? 'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono'
      : 'flex items-start gap-2 px-3 py-2 rounded-md text-sm font-mono';
    
    switch (message.type) {
      case 'error':
        return `${baseStyles} bg-red-900/20 border border-red-700/30 text-red-300`;
      case 'warning':
        return `${baseStyles} bg-yellow-900/20 border border-yellow-700/30 text-yellow-300`;
      case 'info':
        return `${baseStyles} bg-blue-900/20 border border-blue-700/30 text-blue-300`;
      default:
        return `${baseStyles} bg-gray-900/20 border border-gray-700/30 text-gray-300`;
    }
  };
  
  const getIcon = () => {
    const iconSize = compact ? 'w-3 h-3' : 'w-4 h-4';
    const iconStyles = `${iconSize} flex-shrink-0 ${compact ? 'mt-0' : 'mt-0.5'}`;
    
    switch (message.type) {
      case 'error':
        return (
          <svg className={`${iconStyles} text-red-400`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`${iconStyles} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className={`${iconStyles} text-blue-400`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  const getFieldLabel = (field: string) => {
    const fieldLabels: Record<string, string> = {
      fps: 'FPS',
      resolution: 'Resolución',
      quality: 'Calidad',
      colors: 'Colores',
      format: 'Formato'
    };
    
    return fieldLabels[field] || field;
  };
  
  return (
    <div className={getMessageStyles()}>
      {getIcon()}
      <div className="flex-1 min-w-0">
        {!compact && (
          <div className="text-xs opacity-75 mb-0.5">
            {getFieldLabel(message.field)}
          </div>
        )}
        <div className={compact ? 'truncate' : ''}>
          {message.message}
        </div>
      </div>
    </div>
  );
};

// Componente especializado para mostrar solo errores críticos
export const ValidationErrors: React.FC<Omit<ValidationMessagesProps, 'showOnlyErrors'>> = (props) => (
  <ValidationMessages {...props} showOnlyErrors={true} />
);

// Componente especializado para mostrar solo advertencias
export const ValidationWarnings: React.FC<Omit<ValidationMessagesProps, 'showOnlyWarnings'>> = (props) => (
  <ValidationMessages {...props} showOnlyWarnings={true} />
);

// Componente compacto para mostrar en línea
export const InlineValidationMessage: React.FC<{
  validation: ValidationResult;
  field: string;
  className?: string;
}> = ({ validation, field, className = '' }) => {
  const fieldMessages = validation.messages.filter(m => m.field === field);
  
  if (fieldMessages.length === 0) {
    return null;
  }
  
  // Mostrar solo el primer mensaje (más crítico)
  const message = fieldMessages[0];
  
  return (
    <div className={`inline-validation-message ${className}`}>
      <ValidationMessageItem message={message} compact={true} />
    </div>
  );
};

// Componente para mostrar resumen de validación
export const ValidationSummary: React.FC<{
  validation: ValidationResult;
  className?: string;
}> = ({ validation, className = '' }) => {
  if (validation.messages.length === 0) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-md bg-green-900/20 border border-green-700/30 text-green-300 text-sm font-mono ${className}`}>
        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <span>Configuración válida</span>
      </div>
    );
  }
  
  const errorCount = validation.messages.filter(m => m.type === 'error').length;
  const warningCount = validation.messages.filter(m => m.type === 'warning').length;
  
  return (
    <div className={`validation-summary ${className}`}>
      {errorCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-900/20 border border-red-700/30 text-red-300 text-sm font-mono">
          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>
            {errorCount} error{errorCount !== 1 ? 'es' : ''} - Exportación bloqueada
          </span>
        </div>
      )}
      
      {warningCount > 0 && errorCount === 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-yellow-900/20 border border-yellow-700/30 text-yellow-300 text-sm font-mono">
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>
            {warningCount} advertencia{warningCount !== 1 ? 's' : ''} - Exportación disponible
          </span>
        </div>
      )}
    </div>
  );
};

export default ValidationMessages;
