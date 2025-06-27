import React, { useState, useMemo } from 'react';

interface TransitionModalProps {
  isOpen: boolean;
  currentTransition: string;
  currentDuration: number;
  onClose: () => void;
  onApply: (transition: string, duration: number) => void;
}

// Transition categories for better organization
const transitionCategories = {
  'Basic Fades': ['fade', 'fadeblack', 'fadewhite', 'dissolve'],
  'Slide Transitions': ['slideleft', 'slideright', 'slideup', 'slidedown'],
  'Wipe Effects': ['wipeleft', 'wiperight', 'wipeup', 'wipedown', 'wipetl', 'wipetr', 'wipebl', 'wipebr'],
  'Smooth Transitions': ['smoothleft', 'smoothright', 'smoothup', 'smoothdown'],
  'Circle & Shape': ['circlecrop', 'rectcrop', 'circleopen', 'circleclose'],
  'Open & Close': ['horzopen', 'horzclose', 'vertopen', 'vertclose'],
  'Diagonal Effects': ['diagbl', 'diagbr', 'diagtl', 'diagtr'],
  'Advanced Effects': ['radial', 'pixelize', 'distance', 'squeezev', 'squeezeh', 'zoomin'],
  'Cover & Reveal': ['coverleft', 'coverright', 'coverup', 'coverdown', 'revealleft', 'revealright', 'revealup', 'revealdown'],
  'Wind & Slice': ['hlwind', 'hrwind', 'vuwind', 'vdwind', 'hlslice', 'hrslice', 'vuslice', 'vdslice'],
  'Special Effects': ['fadegrays', 'hblur']
};

const TransitionModal: React.FC<TransitionModalProps> = ({
  isOpen,
  currentTransition,
  currentDuration,
  onClose,
  onApply
}) => {
  const [selectedTransition, setSelectedTransition] = useState(currentTransition);
  const [duration, setDuration] = useState(currentDuration);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Basic Fades']));

  const durationOptions = [0.1, 0.3, 0.5, 1.0, 2.0];

  // Filter transitions based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return transitionCategories;
    
    const filtered: { [key: string]: string[] } = {};
    Object.entries(transitionCategories).forEach(([category, transitions]) => {
      const matchingTransitions = transitions.filter(t => 
        t.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matchingTransitions.length > 0) {
        filtered[category] = matchingTransitions;
      }
    });
    return filtered;
  }, [searchTerm]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleApply = () => {
    onApply(selectedTransition, duration);
    onClose();
  };

  const formatTransitionName = (transition: string) => {
    return transition.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1b',
        border: '1px solid #343536',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #343536',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            margin: 0,
            color: '#ff4500',
            fontFamily: '"Space Mono", monospace',
            fontSize: '16px'
          }}>
            Configure Transition
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '16px 20px 0 20px' }}>
          <input
            type="text"
            placeholder="Search transitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#374151',
              border: '1px solid #4a5568',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px',
              fontFamily: '"Space Mono", monospace'
            }}
          />
        </div>

        {/* Transitions */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px'
        }}>
          {Object.entries(filteredCategories).map(([category, transitions]) => (
            <div key={category} style={{ marginBottom: '16px' }}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: '#d1d5db',
                  fontSize: '12px',
                  fontFamily: '"Space Mono", monospace',
                  padding: '8px 0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{expandedCategories.has(category) ? '▼' : '▶'}</span>
                <span>{category} ({transitions.length})</span>
              </button>

              {/* Transitions Grid */}
              {expandedCategories.has(category) && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '8px',
                  marginTop: '8px',
                  marginBottom: '8px'
                }}>
                  {transitions.map(transition => (
                    <button
                      key={transition}
                      onClick={() => setSelectedTransition(transition)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: selectedTransition === transition ? '#ff4500' : '#374151',
                        border: `1px solid ${selectedTransition === transition ? '#ff4500' : '#4a5568'}`,
                        borderRadius: '4px',
                        color: selectedTransition === transition ? 'white' : '#d1d5db',
                        fontSize: '10px',
                        fontFamily: '"Space Mono", monospace',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center'
                      }}
                    >
                      {formatTransitionName(transition)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {Object.keys(filteredCategories).length === 0 && (
            <div style={{
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px',
              fontFamily: '"Space Mono", monospace',
              padding: '40px 20px'
            }}>
              No transitions found matching "{searchTerm}"
            </div>
          )}
        </div>

        {/* Duration Control */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #343536',
          borderBottom: '1px solid #343536'
        }}>
          <label style={{
            fontSize: '12px',
            color: '#9ca3af',
            fontFamily: '"Space Mono", monospace',
            display: 'block',
            marginBottom: '8px'
          }}>
            DURATION: {duration}s
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '10px', color: '#6b7280', fontFamily: '"Space Mono", monospace' }}>
              0.1s
            </span>
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={durationOptions.indexOf(duration)}
              onChange={(e) => setDuration(durationOptions[parseInt(e.target.value)])}
              style={{
                flex: 1,
                height: '6px',
                background: `linear-gradient(to right, #ff4500 0%, #ff4500 ${(durationOptions.indexOf(duration) / 4) * 100}%, #4a5568 ${(durationOptions.indexOf(duration) / 4) * 100}%, #4a5568 100%)`,
                borderRadius: '3px',
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none'
              }}
            />
            <span style={{ fontSize: '10px', color: '#6b7280', fontFamily: '"Space Mono", monospace' }}>
              2.0s
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <button
            onClick={() => {
              setSelectedTransition('none');
              setDuration(0.3);
            }}
            style={{
              padding: '10px 16px',
              backgroundColor: '#ef4444',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '12px',
              fontFamily: '"Space Mono", monospace',
              cursor: 'pointer'
            }}
          >
            REMOVE TRANSITION
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 16px',
                backgroundColor: '#374151',
                border: '1px solid #4a5568',
                borderRadius: '4px',
                color: '#d1d5db',
                fontSize: '12px',
                fontFamily: '"Space Mono", monospace',
                cursor: 'pointer'
              }}
            >
              CANCEL
            </button>
            <button
              onClick={handleApply}
              style={{
                padding: '10px 16px',
                backgroundColor: '#ff4500',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                fontFamily: '"Space Mono", monospace',
                cursor: 'pointer'
              }}
            >
              APPLY TRANSITION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransitionModal;
