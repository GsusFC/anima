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

  const transitionCategories = [
    {
      name: 'BÁSICAS',
      transitions: [
        { type: 'cut' as TransitionType, name: 'Cut', description: 'Cambio instantáneo sin transición', duration: '0ms' },
        { type: 'fade' as TransitionType, name: 'Fade', description: 'Transición suave de opacidad', duration: '400-800ms' },
        { type: 'dissolve' as TransitionType, name: 'Dissolve', description: 'Disolución granular entre imágenes', duration: '500-1000ms' },
        { type: 'fadeblack' as TransitionType, name: 'Fade to Black', description: 'Fundido a negro intermedio', duration: '600-1200ms' },
        { type: 'fadewhite' as TransitionType, name: 'Fade to White', description: 'Fundido a blanco intermedio', duration: '600-1200ms' }
      ]
    },
    {
      name: 'DESLIZAMIENTOS',
      transitions: [
        { type: 'slideleft' as TransitionType, name: 'Slide Left', description: 'Nueva imagen entra desde la izquierda', duration: '300-600ms' },
        { type: 'slideright' as TransitionType, name: 'Slide Right', description: 'Nueva imagen entra desde la derecha', duration: '300-600ms' },
        { type: 'slideup' as TransitionType, name: 'Slide Up', description: 'Nueva imagen entra desde abajo', duration: '300-600ms' },
        { type: 'slidedown' as TransitionType, name: 'Slide Down', description: 'Nueva imagen entra desde arriba', duration: '300-600ms' }
      ]
    },
    {
      name: 'BARRIDOS',
      transitions: [
        { type: 'wipeleft' as TransitionType, name: 'Wipe Left', description: 'Barrido horizontal de izquierda a derecha', duration: '400-800ms' },
        { type: 'wiperight' as TransitionType, name: 'Wipe Right', description: 'Barrido horizontal de derecha a izquierda', duration: '400-800ms' },
        { type: 'wipeup' as TransitionType, name: 'Wipe Up', description: 'Barrido vertical de abajo hacia arriba', duration: '400-800ms' },
        { type: 'wipedown' as TransitionType, name: 'Wipe Down', description: 'Barrido vertical de arriba hacia abajo', duration: '400-800ms' },
        { type: 'wipetl' as TransitionType, name: 'Wipe Top-Left', description: 'Barrido diagonal desde esquina superior izquierda', duration: '500-900ms' },
        { type: 'wipetr' as TransitionType, name: 'Wipe Top-Right', description: 'Barrido diagonal desde esquina superior derecha', duration: '500-900ms' }
      ]
    },
    {
      name: 'EFECTOS ESPECIALES',
      transitions: [
        { type: 'zoomin' as TransitionType, name: 'Zoom In', description: 'Nueva imagen aparece escalando desde el centro', duration: '400-800ms' },
        { type: 'circleopen' as TransitionType, name: 'Circle Open', description: 'Apertura circular desde el centro', duration: '500-1000ms' },
        { type: 'circleclose' as TransitionType, name: 'Circle Close', description: 'Cierre circular hacia el centro', duration: '500-1000ms' },
        { type: 'radial' as TransitionType, name: 'Radial', description: 'Transición radial en forma de reloj', duration: '600-1200ms' },
        { type: 'pixelize' as TransitionType, name: 'Pixelize', description: 'Efecto de pixelación progresiva', duration: '700-1400ms' },
        { type: 'hblur' as TransitionType, name: 'Horizontal Blur', description: 'Desenfoque horizontal dinámico', duration: '500-1000ms' }
      ]
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
          {/* Transition Selection */}
          <div style={{
            maxHeight: '350px',
            overflowY: 'auto',
            marginBottom: '16px',
            paddingRight: '8px'
          }}>
            {transitionCategories.map((category) => (
              <div key={category.name} style={{ marginBottom: '20px' }}>
                {/* Category Header */}
                <div style={{
                  borderBottom: '1px solid #374151',
                  paddingBottom: '6px',
                  marginBottom: '12px'
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#f3f4f6',
                    margin: 0,
                    fontFamily: '"Space Mono", monospace',
                    letterSpacing: '0.5px'
                  }}>
                    {category.name}
                  </h3>
                </div>

                {/* Transitions Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px'
                }}>
                  {category.transitions.map((transition) => (
                    <button
                      key={transition.type}
                      onClick={() => setSelectedType(transition.type)}
                      style={{
                        padding: '12px',
                        backgroundColor: selectedType === transition.type ? '#3b82f6' : '#111827',
                        border: selectedType === transition.type ? '2px solid #60a5fa' : '1px solid #374151',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        fontFamily: '"Space Mono", monospace'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedType !== transition.type) {
                          e.currentTarget.style.backgroundColor = '#1f2937';
                          e.currentTarget.style.borderColor = '#4b5563';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedType !== transition.type) {
                          e.currentTarget.style.backgroundColor = '#111827';
                          e.currentTarget.style.borderColor = '#374151';
                        }
                      }}
                    >
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: 'bold',
                        color: selectedType === transition.type ? 'white' : '#f3f4f6',
                        marginBottom: '4px'
                      }}>
                        {transition.name}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: selectedType === transition.type ? '#bfdbfe' : '#9ca3af',
                        lineHeight: '1.3',
                        marginBottom: '4px'
                      }}>
                        {transition.description}
                      </div>
                      <div style={{
                        fontSize: '9px',
                        color: selectedType === transition.type ? '#93c5fd' : '#6b7280',
                        fontStyle: 'italic'
                      }}>
                        {transition.duration}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
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
