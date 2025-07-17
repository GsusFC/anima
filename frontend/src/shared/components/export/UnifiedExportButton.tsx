import React from 'react';
import { ValidationResult } from '../../types/validation.types';

export interface UnifiedExportButtonProps {
  // Core functionality
  onExport: () => void;
  isExporting: boolean;
  canExport: boolean;
  
  // Display
  currentFormat: string;
  mode?: 'slideshow' | 'video-editor';
  
  // Validation
  validation?: ValidationResult;
  errorMessage?: string;
  
  // Progress (optional)
  progress?: number;
  
  // Styling
  className?: string;
  variant?: 'default' | 'floating';
}

/**
 * Unified Export Button Component
 * 
 * Handles export actions for both slideshow and video editor
 * with consistent behavior and mode-specific styling.
 */
const UnifiedExportButton: React.FC<UnifiedExportButtonProps> = ({
  onExport,
  isExporting,
  canExport,
  currentFormat,
  mode = 'slideshow',
  validation,
  errorMessage,
  progress,
  className = '',
  variant = 'default'
}) => {

  // Generate button text based on state
  const getButtonText = () => {
    if (isExporting) {
      if (progress !== undefined) {
        return `⏳ Exporting ${currentFormat.toUpperCase()}... ${progress}%`;
      }
      return `⏳ Exporting ${currentFormat.toUpperCase()}...`;
    }

    if (!canExport) {
      return variant === 'floating' ? '❌ Invalid' : '❌ Configuración Inválida';
    }

    return `🚀 Export ${currentFormat.toUpperCase()}`;
  };

  // Generate tooltip/title text
  const getButtonTitle = () => {
    if (errorMessage) {
      return errorMessage;
    }

    if (!canExport && validation) {
      const errorMessages = validation.messages
        .filter(m => m.type === 'error')
        .map(m => m.message)
        .join(', ');
      return `Configuración inválida: ${errorMessages}`;
    }

    return undefined;
  };

  const isDisabled = isExporting || !canExport;

  // Mode-specific colors
  const primaryColor = mode === 'slideshow' ? '#ec4899' : '#10b981';
  const primaryDark = mode === 'slideshow' ? '#db2777' : '#059669';
  const primaryGlow = mode === 'slideshow'
    ? '0 0 20px rgba(236, 72, 153, 0.3)'
    : '0 0 20px rgba(16, 185, 129, 0.3)';

  const buttonStyle: React.CSSProperties = {
    width: variant === 'floating' ? 'auto' : '100%',
    padding: variant === 'floating' ? '12px 16px' : '16px 32px',
    borderRadius: '8px',
    fontSize: variant === 'floating' ? '14px' : '18px',
    fontFamily: '"Space Mono", monospace',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: 'none',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 200ms ease',
    backgroundColor: isDisabled ? '#6a6a6d' : primaryColor,
    color: 'white',
    opacity: isDisabled ? 0.6 : 1,
    boxShadow: isDisabled ? 'none' : primaryGlow,
    marginTop: variant !== 'floating' ? 'auto' : undefined,
    position: variant === 'floating' ? 'absolute' : 'static',
    bottom: variant === 'floating' ? '16px' : undefined,
    right: variant === 'floating' ? '16px' : undefined,
    zIndex: variant === 'floating' ? 20 : undefined,
    minWidth: variant === 'floating' ? '120px' : undefined,
    maxWidth: variant === 'floating' ? '200px' : undefined,
  };

  return (
    <button
      onClick={onExport}
      disabled={isDisabled}
      className={className}
      title={getButtonTitle()}
      style={buttonStyle}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = primaryDark;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = primaryColor;
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {getButtonText()}
    </button>
  );
};

export default UnifiedExportButton;
