import React, { useState } from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';
import TransitionModal from './TransitionModal';

const Timeline: React.FC = () => {
  const { 
    project, 
    hasTimeline, 
    updateTimelineItem, 
    removeFromTimeline,
    reorderTimeline 
  } = useSlideshowContext();

  // Drag & Drop state
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Add CSS keyframes for animations and slider styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
      }
      @keyframes slideIn {
        from { transform: translateX(-10px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      /* Custom slider styles */
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ec4899;
        cursor: pointer;
        border: 2px solid #1a1a1b;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      
      input[type="range"]::-webkit-slider-thumb:hover {
        background: #60a5fa;
        transform: scale(1.1);
      }
      
      input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ec4899;
        cursor: pointer;
        border: 2px solid #1a1a1b;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      
      input[type="range"]::-moz-range-track {
        height: 4px;
        background: #343536;
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Modal states
  const [transitionModal, setTransitionModal] = useState<{
    isOpen: boolean;
    itemId: string;
    frameNumber: number;
  }>({ isOpen: false, itemId: '', frameNumber: 0 });

  // Remove duration modal - we'll use inline sliders instead

  const formatDuration = (ms: number) => {
    const seconds = ms / 1000;
    if (seconds < 1) {
      return `${Math.round(ms)}ms`;
    }
    return `${seconds.toFixed(1)}s`;
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const dragIndex = project.timeline.findIndex(item => item.id === draggedItem);
    if (dragIndex === -1 || dragIndex === dropIndex) return;

    // Reorder timeline
    const newTimeline = [...project.timeline];
    const [draggedTimelineItem] = newTimeline.splice(dragIndex, 1);
    newTimeline.splice(dropIndex, 0, draggedTimelineItem);

    // Update context with reordered timeline
    reorderTimeline(newTimeline);
    
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  if (!hasTimeline) {
    return (
      <div style={{
        height: '100%',
        backgroundColor: '#0a0a0b',
        padding: '12px', // Reduced padding
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#6b7280',
          fontFamily: '"Space Mono", monospace'
        }}>
          <svg style={{ width: '48px', height: '48px', margin: '0 auto 12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>Timeline Empty</div>
          <div style={{ fontSize: '11px' }}>Add images to see timeline</div>
        </div>
      </div>
    );
  }

  // const totalDuration = project.timeline.reduce((sum, item) => sum + item.duration, 0);

  return (
    <div style={{
      height: '100%',
      backgroundColor: '#0a0a0b',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column'
    }}>


      {/* Visual Timeline Track */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Professional Timeline Track */}
        <div style={{
          height: '250px', // Maximum height utilization
          backgroundColor: '#1a1a1b',
          border: '1px solid #343536',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '12px',
          overflow: 'auto'
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            height: '100%',
            minWidth: 'fit-content',
            alignItems: 'flex-start'
          }}>
            {project.timeline.map((item, index) => {
              const image = project.images.find(img => img.id === item.imageId);
              if (!image) return null;

              return (
                <React.Fragment key={item.id}>
                  {/* Professional Image Frame */}
                  <div 
                  style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0,
                  opacity: draggedItem === item.id ? 0.5 : 1,
                  transform: dragOverIndex === index ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                  }}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                    onMouseEnter={(e) => {
                        const removeBtn = e.currentTarget.querySelector('.remove-btn') as HTMLElement;
                        if (removeBtn) removeBtn.style.opacity = '0.8';
                      }}
                      onMouseLeave={(e) => {
                        const removeBtn = e.currentTarget.querySelector('.remove-btn') as HTMLElement;
                        if (removeBtn) removeBtn.style.opacity = '0';
                      }}
                    >
                    {/* Frame Container */}
                    <div
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                    style={{
                    width: '200px',
                    height: '150px',
                    backgroundColor: '#0f0f0f',
                    borderRadius: '8px',
                    border: dragOverIndex === index ? '2px solid #22c55e' : '2px solid #343536', // Subtle gray border instead of orange
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: draggedItem ? 'grabbing' : 'grab',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
                    }}
                    title={`Frame duration: ${formatDuration(item.duration)}`}
                    >
                      <img
                        src={image.preview}
                        alt={image.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      
                      

                      {/* Remove Button */}
                      <button
                      className="remove-btn"
                      onClick={(e) => {
                      e.stopPropagation();
                      removeFromTimeline(item.id);
                      }}
                      style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '28px',
                      height: '28px',
                      backgroundColor: '#ef4444',
                      border: 'none',
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                      opacity: 0, // Hidden by default
                      transition: 'opacity 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                      title="Remove frame"
                      >
                      ×
                       </button>

                      {/* Duration Overlay */}
                      <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                      color: 'white',
                      fontSize: '14px',
                      textAlign: 'center',
                      padding: '12px 6px',
                      fontFamily: '"Space Mono", monospace',
                      fontWeight: 'bold'
                      }}>
                      {formatDuration(item.duration)}
                      </div>
                    </div>

                    {/* Duration Slider with Controls */}
                    <div style={{
                    marginTop: '12px',
                    width: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px'
                    }}>
                    {/* Slider Row with +/- buttons */}
                    <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'center'
                    }}>
                    {/* Minus Button */}
                    <button
                    onClick={() => {
                     const currentSeconds = item.duration / 1000;
                     const newSeconds = Math.max(0.5, currentSeconds - 0.1);
                    updateTimelineItem(item.id, { duration: Math.round(newSeconds * 1000) });
                    }}
                    style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#374151',
                    border: '1px solid #6b7280',
                    borderRadius: '4px',
                     color: '#9ca3af',
                     fontSize: '14px',
                       fontWeight: 'bold',
                         cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#4b5563';
                          e.currentTarget.style.color = '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#374151';
                          e.currentTarget.style.color = '#9ca3af';
                        }}
                        title="Decrease duration by 0.1s"
                      >
                        −
                      </button>

                      {/* Slider */}
                      <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.1"
                        value={item.duration / 1000} // Convert from ms to seconds for display
                        onChange={(e) => {
                          const durationInSeconds = parseFloat(e.target.value);
                          const newDuration = Math.round(durationInSeconds * 1000); // Convert back to ms
                          updateTimelineItem(item.id, { duration: newDuration });
                        }}
                        style={{
                          flex: 1,
                          height: '4px',
                          background: '#343536',
                          borderRadius: '2px',
                          outline: 'none',
                          cursor: 'pointer',
                          WebkitAppearance: 'none',
                          appearance: 'none'
                        }}
                        title={`Adjust duration: ${formatDuration(item.duration)}`}
                      />

                      {/* Plus Button */}
                      <button
                        onClick={() => {
                          const currentSeconds = item.duration / 1000;
                          const newSeconds = Math.min(10, currentSeconds + 0.1);
                          updateTimelineItem(item.id, { duration: Math.round(newSeconds * 1000) });
                        }}
                        style={{
                          width: '24px',
                          height: '24px',
                          backgroundColor: '#374151',
                          border: '1px solid #6b7280',
                          borderRadius: '4px',
                          color: '#9ca3af',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#4b5563';
                          e.currentTarget.style.color = '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#374151';
                          e.currentTarget.style.color = '#9ca3af';
                        }}
                        title="Increase duration by 0.1s"
                      >
                        +
                      </button>
                    </div>
                    </div>
                     
                   </div>

                  {/* Professional Transition */}
                  {index < project.timeline.length - 1 && (
                  <div style={{
                  width: '100px',
                  height: '220px', // Increased to accommodate taller transition container
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                  }}>
                      {/* Transition Visual */}
                      <div style={{
                      width: '75px',
                      height: '70px',
                      backgroundColor: item.transition ? '#1a1a1b' : '#0f0f0f', // Darker for Add state
                      border: item.transition ? '2px solid #ec4899' : '2px dashed #6b7280', // Solid vs dashed border
                      borderRadius: item.transition ? '4px' : '6px', // Less rounded for Add state
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      boxShadow: item.transition 
                        ? '0 3px 12px rgba(236, 72, 153, 0.4), inset 0 1px 3px rgba(255,255,255,0.1)'
                        : '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(107,114,128,0.1)', // Subtler shadow for Add
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'visible'
                      }}
                      onClick={() => setTransitionModal({
                        isOpen: true,
                        itemId: item.id,
                        frameNumber: index + 1
                      })}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        if (item.transition) {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.6)';
                          e.currentTarget.style.borderColor = '#f472b6';
                        } else {
                          e.currentTarget.style.boxShadow = '0 3px 10px rgba(107, 114, 128, 0.4)';
                          e.currentTarget.style.borderColor = '#9ca3af';
                          e.currentTarget.style.backgroundColor = '#1a1a1a';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        if (item.transition) {
                          e.currentTarget.style.boxShadow = '0 3px 12px rgba(236, 72, 153, 0.4), inset 0 1px 3px rgba(255,255,255,0.1)';
                          e.currentTarget.style.borderColor = '#ec4899';
                        } else {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(107,114,128,0.1)';
                          e.currentTarget.style.borderColor = '#6b7280';
                          e.currentTarget.style.backgroundColor = '#0f0f0f';
                        }
                      }}
                      title={!item.transition ? "Click to add transition" : "Click to edit transition"}
                    >
                      {/* Delete Transition Button (only show if transition exists) */}
                      {item.transition && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTimelineItem(item.id, { transition: undefined });
                          }}
                          style={{
                            position: 'absolute',
                            top: '-12px',
                            right: '-12px',
                            width: '24px',
                            height: '24px',
                            backgroundColor: '#ef4444',
                            border: '2px solid #1a1a1b',
                            borderRadius: '50%',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 3px 8px rgba(0,0,0,0.7)',
                            opacity: 0.9,
                            transition: 'all 0.2s ease',
                            zIndex: 20
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.transform = 'scale(1.15)';
                            e.currentTarget.style.backgroundColor = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.backgroundColor = '#ef4444';
                          }}
                          title="Delete transition"
                        >
                          ×
                        </button>
                      )}
                      {/* Transition Icon */}
                      <div style={{
                      fontSize: '18px',
                      marginBottom: '2px',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                      }}>
                      {!item.transition ? '➕' : // No transition - show add button
                      item.transition.type === 'fade' ? '🌫️' :
                      item.transition.type === 'slide' ? '🔄' :
                      item.transition.type === 'zoom' ? '🔍' :
                      item.transition.type === 'dissolve' ? '✨' :
                         item.transition.type === 'cut' ? '⚡' : '➕'}
                       </div>
                      
                      {/* Transition Name */}
                      <div style={{
                      fontSize: '8px',
                      color: !item.transition ? '#9ca3af' : '#ec4899',
                      fontWeight: 'bold',
                      fontFamily: '"Space Mono", monospace',
                      textTransform: 'uppercase'
                      }}>
                      {!item.transition ? 'Add' : item.transition.type}
                      </div>
                    </div>

                      {/* Transition Duration */}
                      <div style={{
                      fontSize: '9px',
                      color: '#6b7280',
                      fontFamily: '"Space Mono", monospace',
                      marginBottom: '4px'
                      }}>
                      {!item.transition ? '0.0s' : formatDuration(item.transition.duration)}
                      </div>

                      
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>


      </div>

      {/* Modals */}
      <TransitionModal
        isOpen={transitionModal.isOpen}
        onClose={() => setTransitionModal({ isOpen: false, itemId: '', frameNumber: 0 })}
        onSave={(transition) => {
          updateTimelineItem(transitionModal.itemId, { transition });
        }}
        currentTransition={project.timeline.find(item => item.id === transitionModal.itemId)?.transition}
        frameNumber={transitionModal.frameNumber}
      />
    </div>
  );
};

export default Timeline;
