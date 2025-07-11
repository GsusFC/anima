import React, { useState, useEffect } from 'react';

interface ExportProgressModalProps {
  isVisible: boolean;
  format: string;
  progress: number;
  error: string | null;
  isCompleted?: boolean;
  downloadUrl?: string;
  currentStep?: string;
  onCancel?: () => void;
  onDownload?: () => void;
}

const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isVisible,
  format,
  progress,
  error,
  isCompleted = false,
  downloadUrl,
  currentStep: propCurrentStep,
  onCancel,
  onDownload
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState('Preparing...');

  useEffect(() => {
    if (!isVisible) {
      setTimeElapsed(0);
      setEstimatedTimeLeft(null);
      setCurrentStep('Preparing...');
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeElapsed(elapsed);

      // Calculate estimated time left based on progress
      if (progress > 0 && progress < 100) {
        const estimatedTotal = (elapsed / progress) * 100;
        const remaining = Math.max(0, estimatedTotal - elapsed);
        setEstimatedTimeLeft(Math.floor(remaining));
      }

      // Use provided current step or generate based on progress
      if (propCurrentStep) {
        setCurrentStep(propCurrentStep);
      } else {
        // Fallback to progress-based steps for new two-phase export
        if (progress === 0) {
          setCurrentStep('Initializing export...');
        } else if (progress < 40) {
          setCurrentStep('Generating high-quality preview (1080p)...');
        } else if (progress < 70) {
          setCurrentStep('Converting to final format...');
        } else if (progress < 95) {
          setCurrentStep('Optimizing output...');
        } else if (progress < 100) {
          setCurrentStep('Finalizing...');
        } else {
          setCurrentStep('Complete!');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, progress]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    if (error) return '#dc2626';
    if (progress >= 100) return '#22c55e';
    return '#ec4899';
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#000000',
        borderRadius: '12px',
        padding: '32px',
        width: '400px',
        maxWidth: '90vw',
        border: '1px solid #333333',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#f3f4f6',
            marginBottom: '8px',
            fontFamily: '"Space Mono", monospace'
          }}>
            Exporting {format.toUpperCase()}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#9ca3af',
            fontFamily: '"Space Mono", monospace'
          }}>
            {error ? 'Export Failed' : currentStep}
          </div>
        </div>

        {/* Progress Circle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            position: 'relative',
            width: '120px',
            height: '120px'
          }}>
            {/* Background Circle */}
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="#333333"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke={getProgressColor()}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                style={{
                  transition: 'stroke-dashoffset 0.5s ease',
                  strokeLinecap: 'round'
                }}
              />
            </svg>
            
            {/* Percentage Text */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#f3f4f6',
              fontFamily: '"Space Mono", monospace'
            }}>
              {Math.round(progress)}%
            </div>
          </div>
        </div>

        {/* Progress Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '12px',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px'
          }}>
            <div style={{
              fontSize: '10px',
              color: '#9ca3af',
              marginBottom: '4px',
              fontFamily: '"Space Mono", monospace'
            }}>
              TIME ELAPSED
            </div>
            <div style={{
              fontSize: '16px',
              color: '#f3f4f6',
              fontWeight: 'bold',
              fontFamily: '"Space Mono", monospace'
            }}>
              {formatTime(timeElapsed)}
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '12px',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px'
          }}>
            <div style={{
              fontSize: '10px',
              color: '#9ca3af',
              marginBottom: '4px',
              fontFamily: '"Space Mono", monospace'
            }}>
              EST. REMAINING
            </div>
            <div style={{
              fontSize: '16px',
              color: '#f3f4f6',
              fontWeight: 'bold',
              fontFamily: '"Space Mono", monospace'
            }}>
              {estimatedTimeLeft !== null ? formatTime(estimatedTimeLeft) : '--:--'}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#7f1d1d',
            border: '1px solid #dc2626',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#fca5a5',
              fontFamily: '"Space Mono", monospace',
              marginBottom: '4px',
              fontWeight: 'bold'
            }}>
              Export Error:
            </div>
            <div style={{
              fontSize: '11px',
              color: '#f87171',
              fontFamily: '"Space Mono", monospace'
            }}>
              {error}
            </div>
          </div>
        )}

        {/* Cancel Button */}
        {progress < 100 && !error && !isCompleted && onCancel && (
          <button
            onClick={onCancel}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #555555',
              borderRadius: '8px',
              color: '#d1d5db',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: '"Space Mono", monospace',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#404040';
              e.currentTarget.style.color = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2a2a';
              e.currentTarget.style.color = '#d1d5db';
            }}
          >
            CANCEL EXPORT
          </button>
        )}

        {/* Completion Buttons */}
        {(isCompleted || error) && (
          <div style={{
            display: 'flex',
            gap: '12px',
            flexDirection: isCompleted && downloadUrl ? 'column' : 'row'
          }}>
            {/* Download Button */}
            {isCompleted && downloadUrl && onDownload && (
              <button
                onClick={onDownload}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#22c55e',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontFamily: '"Space Mono", monospace',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#16a34a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#22c55e';
                }}
              >
                🔽 DOWNLOAD FILE
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: isCompleted ? '#6b7280' : '#dc2626',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Space Mono", monospace',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isCompleted ? '#4b5563' : '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isCompleted ? '#6b7280' : '#dc2626';
              }}
            >
              {isCompleted ? '✅ CLOSE' : '❌ CLOSE'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportProgressModal;
