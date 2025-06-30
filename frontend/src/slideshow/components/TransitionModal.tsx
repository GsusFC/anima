import React, { useState } from 'react';
import { TransitionType, TransitionConfig } from '../types/slideshow.types';

interface TransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transition: TransitionConfig) => void;
  currentTransition?: TransitionConfig;
  frameNumber: number;
}

const TransitionModal: React.FC<TransitionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentTransition,
  frameNumber
}) => {
  const [selectedType, setSelectedType] = useState<TransitionType>(
    currentTransition?.type || 'fade'
  );
  const [duration, setDuration] = useState(
    currentTransition?.duration || 500
  );

  const transitionOptions = [
    { 
      type: 'fade' as TransitionType, 
      name: 'Fade', 
      description: 'Smooth opacity transition',
      icon: '🌅'
    },
    { 
      type: 'slide' as TransitionType, 
      name: 'Slide', 
      description: 'Slide from left to right',
      icon: '➡️'
    },
    { 
      type: 'zoom' as TransitionType, 
      name: 'Zoom', 
      description: 'Scale in/out effect',
      icon: '🔍'
    },
    { 
      type: 'dissolve' as TransitionType, 
      name: 'Dissolve', 
      description: 'Pixelated transition',
      icon: '✨'
    },
    { 
      type: 'cut' as TransitionType, 
      name: 'Cut', 
      description: 'Instant change',
      icon: '✂️'
    }
  ];

  const handleSave = () => {
    onSave({
      type: selectedType,
      duration: duration
    });
    onClose();
  };

  if (!isOpen) return null;

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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1a1a1b',
        border: '1px solid #343536',
        borderRadius: '8px',
        width: '420px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #343536',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            color: '#ffffff',
            fontWeight: 'bold',
            fontFamily: '"Space Mono", monospace'
          }}>
            🎬 Transition Settings (Frame {frameNumber})
          </h3>
          <button
            onClick={onClose}
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#9ca3af',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '12px 16px', flex: 1, overflow: 'auto' }}>
          {/* Transition Type Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: '#9ca3af',
              marginBottom: '8px',
              fontFamily: '"Space Mono", monospace'
            }}>
              Transition Type
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '6px'
            }}>
              {transitionOptions.map((option) => (
                <div
                  key={option.type}
                  onClick={() => setSelectedType(option.type)}
                  style={{
                    padding: '8px 4px',
                    backgroundColor: selectedType === option.type ? '#ff4500' : '#0f0f0f',
                    border: `1px solid ${selectedType === option.type ? '#ff4500' : '#343536'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    fontSize: '16px',
                    marginBottom: '2px'
                  }}>
                    {option.icon}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontFamily: '"Space Mono", monospace'
                  }}>
                    {option.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duration Control & Quick Presets */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{
                fontSize: '11px',
                color: '#9ca3af',
                fontFamily: '"Space Mono", monospace'
              }}>
                Duration: {(duration / 1000).toFixed(1)}s
              </label>
              <div style={{
                fontSize: '10px',
                color: '#ffffff',
                fontFamily: '"Space Mono", monospace',
                backgroundColor: '#0f0f0f',
                padding: '2px 6px',
                borderRadius: '3px'
              }}>
                {transitionOptions.find(t => t.type === selectedType)?.name}
              </div>
            </div>
            
            {/* Quick Presets - Horizontal */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              {[
                { label: 'Fast', value: 300 },
                { label: 'Normal', value: 500 },
                { label: 'Slow', value: 1000 },
                { label: 'Long', value: 2000 }
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setDuration(preset.value)}
                  style={{
                    flex: 1,
                    padding: '4px',
                    backgroundColor: duration === preset.value ? '#3b82f6' : '#374151',
                    border: 'none',
                    borderRadius: '3px',
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: '"Space Mono", monospace'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Slider */}
            <input
              type="range"
              min="100"
              max="3000"
              step="50"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #343536',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          flexShrink: 0
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#374151',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: '"Space Mono", monospace'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              backgroundColor: '#22c55e',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: '"Space Mono", monospace'
            }}
          >
            Apply Transition
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransitionModal;
