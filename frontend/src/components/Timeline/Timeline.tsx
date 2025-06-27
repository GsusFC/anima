import React, { useState } from 'react';
import TransitionModal from './TransitionModal';

interface TimelineFrame {
  id: string;
  file: File;
  uploadedFile?: any; // Backend file info
  duration: number; // duración en segundos
  transition: string;
  transitionDuration: number; // duración de la transición en segundos
}

const Timeline: React.FC = () => {
  const [timelineFrames, setTimelineFrames] = useState<TimelineFrame[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState<{[key: string]: string}>({});
  const [hoveredFrameId, setHoveredFrameId] = useState<string | null>(null);
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [editingTransitionId, setEditingTransitionId] = useState<string | null>(null);

  // Listen for file addition events from ImageUpload
  React.useEffect(() => {
    const handleAddFile = (event: any) => {
      const { file, uploadedFile, sessionId } = event.detail;
      if (file) {
        createPreview(file);
        const newFrame: TimelineFrame = {
          id: `frame_${Date.now()}_${Math.random()}`,
          file,
          uploadedFile,
          duration: 1.0,
          transition: 'none',
          transitionDuration: 0.3
        };
        setTimelineFrames(prev => [...prev, newFrame]);
        
        // Store sessionId globally
        if (sessionId) {
          (window as any).__sessionId = sessionId;
        }
      }
    };

    window.addEventListener('addFileToTimeline', handleAddFile);
    return () => window.removeEventListener('addFileToTimeline', handleAddFile);
  }, []);

  const createPreview = (file: File) => {
    const key = file.name + file.size;
    if (!previews[key]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviews(prev => ({
            ...prev,
            [key]: e.target?.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    // Check if it's a file dragged from ImageUpload
    const fileName = e.dataTransfer.getData('application/x-file-name');
    if (fileName && (window as any).__draggedFile) {
      const draggedFile = (window as any).__draggedFile;
      createPreview(draggedFile);
      const newFrame: TimelineFrame = {
        id: `frame_${Date.now()}_${Math.random()}`,
        file: draggedFile,
        duration: 1.0,
        transition: 'none',
        transitionDuration: 0.3
      };
      setTimelineFrames(prev => [...prev, newFrame]);
      // Clean up
      delete (window as any).__draggedFile;
    }
    // Handle files dropped from outside (file system)
    else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      newFiles.forEach(createPreview);
      const newFrames = newFiles.map(file => ({
        id: `frame_${Date.now()}_${Math.random()}`,
        file,
        duration: 1.0,
        transition: 'none',
        transitionDuration: 0.3
      }));
      setTimelineFrames(prev => [...prev, ...newFrames]);
    }
  };

  const removeFrame = (id: string) => {
    const frameToRemove = timelineFrames.find(frame => frame.id === id);
    if (frameToRemove) {
      const key = frameToRemove.file.name + frameToRemove.file.size;
      setPreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[key];
        return newPreviews;
      });
    }
    setTimelineFrames(prev => prev.filter(frame => frame.id !== id));
  };

  const updateFrameDuration = (id: string, duration: number) => {
    setTimelineFrames(prev => 
      prev.map(frame => 
        frame.id === id ? { ...frame, duration } : frame
      )
    );
  };

  const updateFrameTransition = (id: string, transition: string) => {
    setTimelineFrames(prev => 
      prev.map(frame => 
        frame.id === id ? { ...frame, transition } : frame
      )
    );
  };

  const updateTransitionDuration = (id: string, transitionDuration: number) => {
    setTimelineFrames(prev => 
      prev.map(frame => 
        frame.id === id ? { ...frame, transitionDuration } : frame
      )
    );
  };

  const openTransitionModal = (frameId: string) => {
    setEditingTransitionId(frameId);
    setTransitionModalOpen(true);
  };

  const closeTransitionModal = () => {
    setTransitionModalOpen(false);
    setEditingTransitionId(null);
  };

  const applyTransition = (transition: string, duration: number) => {
    if (editingTransitionId) {
      updateFrameTransition(editingTransitionId, transition);
      updateTransitionDuration(editingTransitionId, duration);
    }
  };

  const getCurrentTransition = () => {
    if (!editingTransitionId) return { transition: 'none', duration: 0.3 };
    const frame = timelineFrames.find(f => f.id === editingTransitionId);
    return {
      transition: frame?.transition || 'none',
      duration: frame?.transitionDuration || 0.3
    };
  };

  const duplicateFrame = (id: string) => {
    const frameToClone = timelineFrames.find(frame => frame.id === id);
    if (frameToClone) {
      const newFrame: TimelineFrame = {
        ...frameToClone,
        id: `frame_${Date.now()}_${Math.random()}`
      };
      const frameIndex = timelineFrames.findIndex(frame => frame.id === id);
      setTimelineFrames(prev => [
        ...prev.slice(0, frameIndex + 1),
        newFrame,
        ...prev.slice(frameIndex + 1)
      ]);
    }
  };

  const totalDuration = timelineFrames.reduce((total, frame) => 
    total + frame.duration + (frame.transition !== 'none' ? frame.transitionDuration : 0), 0
  );

  // Update header duration counter and share timeline data
  React.useEffect(() => {
    const durationElement = document.getElementById('timeline-duration');
    if (durationElement) {
      durationElement.textContent = `${totalDuration.toFixed(1)}s`;
    }
    
    // Share timeline data with ExportControls
    (window as any).__timelineData = timelineFrames.map(frame => ({
      file: frame.file,
      uploadedFile: frame.uploadedFile,
      duration: frame.duration * 1000, // Convert to milliseconds for backend
      transition: {
        type: frame.transition,
        duration: frame.transitionDuration * 1000
      }
    }));
  }, [totalDuration, timelineFrames]);



  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px'
    }}>
      {/* Timeline Track */}
      <div 
        style={{
          flex: 1,
          backgroundColor: dragActive ? '#1a1a1b' : '#0f0f0f',
          border: `2px dashed ${dragActive ? '#ff4500' : '#343536'}`,
          borderRadius: '3px',
          padding: '12px',
          display: 'flex',
          alignItems: timelineFrames.length === 0 ? 'center' : 'flex-start',
          justifyContent: timelineFrames.length === 0 ? 'center' : 'flex-start',
          minHeight: '140px',
          transition: 'all 0.2s ease',
          gap: '16px',
          overflowX: 'auto',
          overflowY: 'visible'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {timelineFrames.length === 0 ? (
          /* Empty state */
          <div style={{
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <svg style={{ width: '48px', height: '48px', margin: '0 auto 12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v14l11-7z" />
            </svg>
            <p style={{ margin: 0, fontSize: '14px', fontFamily: '"Space Mono", monospace' }}>
              {dragActive ? 'Drop images here' : 'Drag images here to create sequence'}
            </p>
          </div>
        ) : (
          /* Timeline frames */
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {timelineFrames.map((frame, index) => (
              <div key={frame.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                {/* Frame Container */}
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={() => setHoveredFrameId(frame.id)}
                  onMouseLeave={() => setHoveredFrameId(null)}
                >
                  {/* Frame preview */}
                  <div style={{
                    position: 'relative',
                    width: '160px',
                    height: '100px',
                    backgroundColor: '#374151',
                    borderRadius: '3px',
                    border: '2px solid #4b5563',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    overflow: 'hidden'
                  }}>
                    {/* Frame number indicator */}
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: '#ff4500',
                      fontSize: '10px',
                      fontFamily: '"Space Mono", monospace',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      zIndex: 5
                    }}>
                      #{index + 1}
                    </div>

                    {/* Image preview */}
                    {previews[frame.file.name + frame.file.size] ? (
                      <img
                        src={previews[frame.file.name + frame.file.size]}
                        alt={frame.file.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <svg style={{ width: '40px', height: '40px', color: '#9ca3af' }} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    )}
                    
                    {/* Hover Actions Bar */}
                    {hoveredFrameId === frame.id && (
                      <div style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        height: '32px',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        borderRadius: '0 0 3px 3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        zIndex: 10
                      }}>
                        <button
                          onClick={() => removeFrame(frame.id)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '10px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontFamily: '"Space Mono", monospace'
                          }}
                        >
                          REMOVE
                        </button>
                        <button
                          onClick={() => duplicateFrame(frame.id)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '10px',
                            backgroundColor: '#374151',
                            color: 'white',
                            border: 'none',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            fontFamily: '"Space Mono", monospace'
                          }}
                        >
                          COPY
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Frame Controls */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    width: '160px'
                  }}>
                    {/* Duration */}
                    <div>
                      <label style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        fontFamily: '"Space Mono", monospace',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        DURATION: {frame.duration}s
                      </label>
                      
                      {/* Duration Slider */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <input
                          type="range"
                          min="0"
                          max="4"
                          step="1"
                          value={[0.5, 1.0, 2.0, 3.0, 5.0].indexOf(frame.duration)}
                          onChange={(e) => {
                            const durations = [0.5, 1.0, 2.0, 3.0, 5.0];
                            updateFrameDuration(frame.id, durations[parseInt(e.target.value)]);
                          }}
                          style={{
                            flex: 1,
                            height: '6px',
                            background: `linear-gradient(to right, #ff4500 0%, #ff4500 ${([0.5, 1.0, 2.0, 3.0, 5.0].indexOf(frame.duration) / 4) * 100}%, #343536 ${([0.5, 1.0, 2.0, 3.0, 5.0].indexOf(frame.duration) / 4) * 100}%, #343536 100%)`,
                            borderRadius: '3px',
                            outline: 'none',
                            appearance: 'none',
                            cursor: 'pointer',
                            WebkitAppearance: 'none'
                          }}
                        />
                      </div>
                      
                      {/* Duration Labels */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '9px',
                        color: '#6b7280',
                        fontFamily: '"Space Mono", monospace'
                      }}>
                        <span>0.5s</span>
                        <span>1s</span>
                        <span>2s</span>
                        <span>3s</span>
                        <span>5s</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transition (if not the last frame) */}
                {index < timelineFrames.length - 1 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginTop: '20px',
                    position: 'relative'
                  }}>
                    {/* No Transition - Add Button */}
                    {frame.transition === 'none' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '100px'
                      }}>
                        <button
                          onClick={() => openTransitionModal(frame.id)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#374151',
                            border: '1px solid #4a5568',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontFamily: '"Space Mono", monospace',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 69, 0, 0.15)';
                            e.currentTarget.style.borderColor = '#ff4500';
                            e.currentTarget.style.color = '#ff4500';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#374151';
                            e.currentTarget.style.borderColor = '#4a5568';
                            e.currentTarget.style.color = '#9ca3af';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}

                    {/* Configured Transition */}
                    {frame.transition !== 'none' && (
                      <div 
                        onClick={() => openTransitionModal(frame.id)}
                        style={{
                          width: '120px',
                          height: '32px',
                          backgroundColor: '#2d3748',
                          border: '1px solid #4a5568',
                          borderRadius: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#ff4500';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#4a5568';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <svg style={{ width: '12px', height: '12px', color: '#ff4500' }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/>
                          </svg>
                          <span style={{
                            fontSize: '9px',
                            color: '#d1d5db',
                            fontFamily: '"Space Mono", monospace'
                          }}>
                            {frame.transition.toUpperCase()} {frame.transitionDuration}s
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateFrameTransition(frame.id, 'none');
                          }}
                          style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transition Configuration Modal */}
      <TransitionModal
        isOpen={transitionModalOpen}
        currentTransition={getCurrentTransition().transition}
        currentDuration={getCurrentTransition().duration}
        onClose={closeTransitionModal}
        onApply={applyTransition}
      />
    </div>
  );
};

export default Timeline; 