import React, { useState, useCallback, useRef } from 'react';
import { UploadConfig, MediaEventHandlers, MediaTheme } from '../../types/media.types';
import { defaultMediaTheme } from '../../theme/mediaTheme';
import styles from '../../styles/dropzone.module.css';

interface DropZoneProps {
  config: UploadConfig;
  handlers: Pick<MediaEventHandlers, 'onUpload'>;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  theme?: MediaTheme;
  mode?: 'slideshow' | 'video-editor';
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
  // theme = defaultMediaTheme, // Temporarily disabled
  mode = 'slideshow',
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [, setDragCounter] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Generate CSS classes based on mode and state
  const getDropZoneClasses = () => {
    const classes = [styles.dropzone];

    // Mode-specific styling
    if (mode === 'slideshow') {
      classes.push(styles.dropzoneSlideshow);
    } else {
      classes.push(styles.dropzoneVideoEditor);
    }

    // State classes
    if (isDragActive) {
      classes.push(styles.dragActive);
    }
    if (loading) {
      classes.push(styles.dropzoneLoading);
    }
    if (disabled) {
      classes.push(styles.dropzoneDisabled);
    }
    if (error) {
      classes.push(styles.dropzoneError);
    }

    // Custom className
    if (className) {
      classes.push(className);
    }

    return classes.join(' ');
  };

  const containerStyle: React.CSSProperties = {
    ...style,
  };

  // Removed unused styles - now using CSS modules



  return (
    <div
      className={getDropZoneClasses()}
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
        <div className={styles.dropzoneSpinner}>
          <div className={styles.dropzoneSpinnerIcon} />
          <span>Uploading...</span>
        </div>
      ) : children ? (
        children
      ) : (
        <>
          {/* Upload Icon */}
          <svg
            className={styles.dropzoneIcon}
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

          {/* Upload Text */}
          <div>
            <p className={styles.dropzoneText}>
              {config.text?.primary || 'Drop files here or click to browse'}
            </p>
            <p className={styles.dropzoneSubtext}>
              {config.text?.secondary || 'Supported file types'}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default DropZone;
