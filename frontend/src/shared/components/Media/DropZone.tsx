import React, { useState, useCallback, useRef } from 'react';
import { UploadConfig, MediaEventHandlers } from '../../types/media.types';
import { defaultMediaTheme } from '../../theme/mediaTheme';

interface DropZoneProps {
  config: UploadConfig;
  handlers: Pick<MediaEventHandlers, 'onUpload'>;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const DropZone: React.FC<DropZoneProps> = ({
  config,
  handlers,
  loading = false,
  error,
  disabled = false,
  children,
  className = '',
  style = {},
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [, setDragCounter] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = defaultMediaTheme;

  const { accept, multiple, maxSize, maxFiles } = config;
  const { onUpload } = handlers;

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;
    
    const isAccepted = accept.some(acceptedType => {
      if (acceptedType.startsWith('.')) {
        return fileExtension === acceptedType.toLowerCase();
      }
      if (acceptedType.includes('/*')) {
        return mimeType.startsWith(acceptedType.split('/')[0]);
      }
      return mimeType === acceptedType;
    });

    if (!isAccepted) {
      return `File type not supported. Accepted types: ${accept.join(', ')}`;
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }

    return null;
  }, [accept, maxSize]);

  const validateFiles = useCallback((files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    // Check total number of files
    if (maxFiles && files.length > maxFiles) {
      errors.push(`Too many files. Maximum: ${maxFiles}`);
      return { valid, errors };
    }

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        valid.push(file);
      }
    });

    return { valid, errors };
  }, [validateFile, maxFiles]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (disabled || loading) return;

    const fileArray = Array.from(files);
    const { valid, errors } = validateFiles(fileArray);

    if (errors.length > 0) {
      console.error('File validation errors:', errors);
      // You might want to show these errors to the user
      return;
    }

    if (valid.length > 0) {
      try {
        await onUpload?.(valid);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  }, [disabled, loading, validateFiles, onUpload]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => prev + 1);
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragActive(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragActive(false);
    setDragCounter(0);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    if (!disabled && !loading) {
      fileInputRef.current?.click();
    }
  }, [disabled, loading]);

  const containerStyle: React.CSSProperties = {
    border: `2px dashed ${
      error ? theme.colors.error :
      isDragActive ? theme.colors.primary :
      theme.colors.border
    }`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    textAlign: 'center',
    backgroundColor: isDragActive ? `${theme.colors.primary}10` : 'transparent',
    color: error ? theme.colors.error :
           isDragActive ? theme.colors.primary :
           theme.colors.textSecondary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: theme.transitions.normal,
    opacity: disabled ? 0.6 : 1,
    position: 'relative',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    fontFamily: '"Space Mono", monospace',
    ...style,
  };

  const iconStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    opacity: 0.6,
  };



  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    fontSize: '0.875rem',
  };



  return (
    <div
      className={`drop-zone ${className}`}
      style={containerStyle}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept.join(',')}
        multiple={multiple}
        onChange={handleFileInput}
        style={{ display: 'none' }}
        disabled={disabled || loading}
      />

      {loading ? (
        <div style={loadingStyle}>
          <div
            style={{
              width: '20px',
              height: '20px',
              border: `2px solid ${theme.colors.border}`,
              borderTop: `2px solid ${theme.colors.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      ) : children ? (
        children
      ) : (
        <>
          {/* Upload Icon */}
          <svg
            style={iconStyle}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </>
      )}

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DropZone;
