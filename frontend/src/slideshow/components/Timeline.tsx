import React, { useState } from 'react';
import { useSlideshowContext } from '../context/SlideshowContext';
import TransitionModal from './TransitionModal';
import { createTimelineItem } from './TimelineItemBuilder';

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

  // Transition modal state
  const [transitionModal, setTransitionModal] = useState({
    isOpen: false,
    itemId: '',
    frameNumber: 0
  });

  // Duration formatting utility
  const formatDuration = (duration: number): string => {
    return `${(duration / 1000).toFixed(1)}s`;
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
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
    const draggedItemId = e.dataTransfer.getData('text/plain');
    
    if (!draggedItemId) return;

    const draggedIndex = project.timeline.findIndex(item => item.id === draggedItemId);
    if (draggedIndex === -1 || draggedIndex === dropIndex) return;

    // Reorder timeline
    const newTimeline = [...project.timeline];
    const [draggedItem] = newTimeline.splice(draggedIndex, 1);
    newTimeline.splice(dropIndex, 0, draggedItem);

    // Update positions
    const updatedTimeline = newTimeline.map((item, index) => ({
      ...item,
      position: index
    }));

    reorderTimeline(updatedTimeline);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  // Add CSS keyframes for animations
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
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!hasTimeline) {
    return (
      <div style={{
        height: '100%',
        backgroundColor: '#0a0a0b',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px'
      }}>
        <div style={{
          flex: 1,
          backgroundColor: '#1a1a1b',
          borderRadius: '8px',
          border: '1px solid #343536',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <svg style={{ width: '48px', height: '48px', color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontFamily: '"Space Mono", monospace'
          }}>
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>No Timeline Created</div>
            <div style={{ fontSize: '11px' }}>Add images to create your timeline</div>
          </div>
        </div>
      </div>
    );
  }

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
          height: '250px',
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

              // Use Builder pattern for timeline item
              const timelineItem = createTimelineItem(item, index, image, draggedItem, dragOverIndex)
                .setDragHandlers({
                  onDragStart: handleDragStart,
                  onDragEnd: handleDragEnd,
                  onDragOver: handleDragOver,
                  onDragLeave: handleDragLeave,
                  onDrop: handleDrop
                })
                .setActionHandlers({
                  onRemove: removeFromTimeline,
                  onDurationChange: (itemId: string, duration: number) => 
                    updateTimelineItem(itemId, { duration }),
                  onTransitionClick: (itemId: string) => 
                    setTransitionModal({
                      isOpen: true,
                      itemId: itemId,
                      frameNumber: index + 1
                    })
                })
                .setUtilities({
                  formatDuration
                })
                .build();

              return (
                <React.Fragment key={item.id}>
                  {timelineItem}

                  {/* Transition Controls (if not the last item) */}
                  {index < project.timeline.length - 1 && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingTop: '20px',
                      flexShrink: 0
                    }}>
                      {/* Transition Control Button */}
                      <div style={{
                        position: 'relative',
                        width: '80px',
                        height: '80px',
                        backgroundColor: item.transition?.type ? '#0f0f0f' : '#0f0f0f',
                        border: item.transition?.type ? '2px solid #ec4899' : '2px solid #6b7280',
                        borderRadius: '50%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: item.transition?.type 
                          ? '0 3px 12px rgba(236, 72, 153, 0.4), inset 0 1px 3px rgba(255,255,255,0.1)'
                          : '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(107,114,128,0.1)',
                        transition: 'all 0.3s ease'
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
                            boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                            zIndex: 10,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.backgroundColor = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.backgroundColor = '#ef4444';
                          }}
                          title="Remove transition"
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
