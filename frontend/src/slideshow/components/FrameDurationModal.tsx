import React, { useState } from 'react';

interface FrameDurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (duration: number) => void;
  currentDuration: number;
  frameNumber: number;
  imageName: string;
}

const FrameDurationModal: React.FC<FrameDurationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentDuration,
  frameNumber,
  imageName
}) => {
  const [duration, setDuration] = useState(currentDuration);
  const [inputValue, setInputValue] = useState((currentDuration / 1000).toString());

  const handleSave = () => {
    onSave(duration);
    onClose();
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setDuration(Math.round(numValue * 1000));
    }
  };

  const presets = [
    { label: 'Quick Flash', value: 200, description: '0.2s - Very fast' },
    { label: 'Fast', value: 500, description: '0.5s - Quick read' },
    { label: 'Normal', value: 1000, description: '1s - Standard' },
    { label: 'Slow', value: 2000, description: '2s - Easy read' },
    { label: 'Long', value: 3000, description: '3s - Detailed view' },
    { label: 'Very Long', value: 5000, description: '5s - Full focus' }
  ];

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
        width: '380px',
        maxHeight: '85vh',
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
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              color: '#ffffff',
              fontWeight: 'bold',
              fontFamily: '"Space Mono", monospace'
            }}>
              ⏱️ Frame Duration (Frame {frameNumber})
            </h3>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '11px',
              color: '#9ca3af',
              fontFamily: '"Space Mono", monospace'
            }}>
              {imageName}
            </p>
          </div>
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
          {/* Duration Display & Input */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#0f0f0f',
              border: '1px solid #343536',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '18px',
                color: '#ff4500',
                fontWeight: 'bold',
                fontFamily: '"Space Mono", monospace'
              }}>
                {(duration / 1000).toFixed(1)}s
              </div>
            </div>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              min="0.1"
              max="30"
              step="0.1"
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px',
                fontFamily: '"Space Mono", monospace',
                textAlign: 'center'
              }}
            />
          </div>

          {/* Quick Presets - Compact Grid */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '4px'
            }}>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setDuration(preset.value);
                    setInputValue((preset.value / 1000).toString());
                  }}
                  style={{
                    padding: '6px 4px',
                    backgroundColor: duration === preset.value ? '#ec4899' : '#374151',
                    border: 'none',
                    borderRadius: '3px',
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: '"Space Mono", monospace',
                    textAlign: 'center'
                  }}
                >
                  <div>{preset.label}</div>
                  <div style={{
                    fontSize: '8px',
                    color: '#9ca3af',
                    fontWeight: 'normal'
                  }}>
                    {(preset.value / 1000).toFixed(1)}s
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Slider Control */}
          <div style={{ marginBottom: '8px' }}>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={duration}
              onChange={(e) => {
                const newDuration = parseInt(e.target.value);
                setDuration(newDuration);
                setInputValue((newDuration / 1000).toString());
              }}
              style={{ width: '100%' }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '9px',
              color: '#6b7280'
            }}>
              <span>0.1s</span>
              <span>5s</span>
              <span>10s</span>
            </div>
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
              backgroundColor: '#ec4899',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: '"Space Mono", monospace'
            }}
          >
            Apply Duration
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrameDurationModal;
