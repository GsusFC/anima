import React, { useState } from 'react';

export interface ValidationResult {
  canExport: boolean;
  messages: Array<{ type: 'error' | 'warning'; message: string }>;
}

export interface ValidationSummaryCompactProps {
  validation: ValidationResult;
}

const ValidationSummaryCompact: React.FC<ValidationSummaryCompactProps> = ({
  validation
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Don't show anything if validation passes and no warnings
  if (validation.canExport && validation.messages.length === 0) {
    return null;
  }

  const errorCount = validation.messages.filter(m => m.type === 'error').length;
  const warningCount = validation.messages.filter(m => m.type === 'warning').length;

  const getStatusIcon = () => {
    if (errorCount > 0) return '❌';
    if (warningCount > 0) return '⚠️';
    return '✅';
  };

  const getStatusText = () => {
    if (errorCount > 0) return `${errorCount} error${errorCount > 1 ? 's' : ''}`;
    if (warningCount > 0) return `${warningCount} warning${warningCount > 1 ? 's' : ''}`;
    return 'Ready to export';
  };

  const getStatusColor = () => {
    if (errorCount > 0) return 'text-red-400';
    if (warningCount > 0) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="mb-3">
      {/* Compact Status Bar */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`w-full flex items-center justify-between p-2 bg-dark-800/50 border rounded text-xs font-mono transition-all ${
          errorCount > 0 
            ? 'border-red-500/50 hover:border-red-500' 
            : warningCount > 0 
            ? 'border-yellow-500/50 hover:border-yellow-500'
            : 'border-dark-650 hover:border-dark-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <span>{getStatusIcon()}</span>
          <span className={getStatusColor()}>{getStatusText()}</span>
        </div>
        {validation.messages.length > 0 && (
          <span className={`text-dark-500 transition-transform ${showDetails ? 'rotate-180' : ''}`}>
            ▼
          </span>
        )}
      </button>

      {/* Detailed Messages */}
      {showDetails && validation.messages.length > 0 && (
        <div className="mt-2 p-2 bg-dark-800/30 border border-dark-650/50 rounded space-y-1">
          {validation.messages.slice(0, 3).map((message, index) => (
            <div
              key={index}
              className={`text-xs flex items-start gap-2 ${
                message.type === 'error' ? 'text-red-400' : 'text-yellow-400'
              }`}
            >
              <span className="flex-shrink-0 mt-0.5">
                {message.type === 'error' ? '•' : '⚠'}
              </span>
              <span>{message.message}</span>
            </div>
          ))}
          {validation.messages.length > 3 && (
            <div className="text-xs text-dark-500 text-center pt-1">
              +{validation.messages.length - 3} more...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidationSummaryCompact;
