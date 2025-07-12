// Frame selection component
import React, { useState, useEffect } from 'react';
import { DetectedFrame } from '@shared/types';
import { usePluginMessage } from '../../../hooks/usePluginMessage';
import { usePlugin } from '../../../context/PluginContext';
import styles from './FrameSelector.module.css';

interface FrameSelectorProps {
  frames: DetectedFrame[];
  selectedFrames: string[];
  onSelectionChange: (frameIds: string[]) => void;
}

export const FrameSelector: React.FC<FrameSelectorProps> = ({
  frames,
  selectedFrames,
  onSelectionChange
}) => {
  const [sortBy, setSortBy] = useState<'position' | 'name' | 'size'>('position');
  const [filterBy, setFilterBy] = useState<'all' | 'valid' | 'invalid'>('all');
  const { sendMessage } = usePluginMessage();

  const filteredFrames = frames.filter(frame => {
    switch (filterBy) {
      case 'valid':
        return frame.isValidForExport;
      case 'invalid':
        return !frame.isValidForExport;
      default:
        return true;
    }
  });

  const sortedFrames = [...filteredFrames].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'size':
        return (b.width * b.height) - (a.width * a.height);
      case 'position':
      default:
        return a.order - b.order;
    }
  });

  const handleFrameToggle = (frameId: string) => {
    const newSelection = selectedFrames.includes(frameId)
      ? selectedFrames.filter(id => id !== frameId)
      : [...selectedFrames, frameId];
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    const validFrames = sortedFrames
      .filter(frame => frame.isValidForExport)
      .map(frame => frame.id);
    
    onSelectionChange(validFrames);
  };

  const handleSelectNone = () => {
    onSelectionChange([]);
  };

  const handleRefresh = () => {
    sendMessage({ type: 'refresh-frames' });
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return '#27ae60';
      case 'medium': return '#f39c12';
      case 'high': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <div className={styles.frameSelector} data-testid="frame-selector">
      <div className={styles.header}>
        <div className={styles.title}>
          <h3>Select Frames ({frames.length})</h3>
          <button 
            className={styles.refreshButton}
            onClick={handleRefresh}
            title="Refresh frame detection"
          >
            🔄
          </button>
        </div>
        
        <div className={styles.controls}>
          <div className={styles.filterControls}>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className={styles.select}
            >
              <option value="position">Sort by Position</option>
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
            </select>
            
            <select 
              value={filterBy} 
              onChange={(e) => setFilterBy(e.target.value as any)}
              className={styles.select}
            >
              <option value="all">All Frames</option>
              <option value="valid">Valid Only</option>
              <option value="invalid">Invalid Only</option>
            </select>
          </div>
          
          <div className={styles.selectionControls}>
            <button 
              className={styles.selectButton}
              onClick={handleSelectAll}
              disabled={sortedFrames.filter(f => f.isValidForExport).length === 0}
            >
              Select All
            </button>
            <button 
              className={styles.selectButton}
              onClick={handleSelectNone}
              disabled={selectedFrames.length === 0}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className={styles.frameList} data-testid="frame-list">
        {sortedFrames.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📄</div>
            <h4>No frames found</h4>
            <p>Create some frames in Figma or adjust your filter settings.</p>
          </div>
        ) : (
          sortedFrames.map(frame => (
            <div 
              key={frame.id}
              className={`${styles.frameItem} ${
                selectedFrames.includes(frame.id) ? styles.selected : ''
              } ${
                !frame.isValidForExport ? styles.invalid : ''
              }`}
              onClick={() => frame.isValidForExport && handleFrameToggle(frame.id)}
              data-testid={`frame-item-${frame.id}`}
            >
              <div className={styles.frameCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedFrames.includes(frame.id)}
                  onChange={() => handleFrameToggle(frame.id)}
                  disabled={!frame.isValidForExport}
                />
              </div>
              
              <div className={styles.frameInfo}>
                <div className={styles.frameName}>
                  {frame.name}
                  {!frame.isValidForExport && (
                    <span className={styles.invalidBadge}>Invalid</span>
                  )}
                </div>
                
                <div className={styles.frameDetails}>
                  <span className={styles.dimensions}>
                    {frame.width} × {frame.height}
                  </span>
                  <span className={styles.size}>
                    {frame.estimatedSize}
                  </span>
                  <span 
                    className={styles.complexity}
                    style={{ color: getComplexityColor(frame.complexity) }}
                  >
                    {frame.complexity}
                  </span>
                </div>
              </div>
              
              <div className={styles.frameActions}>
                <span className={styles.order}>#{frame.order + 1}</span>
              </div>
            </div>
          ))
        )}
      </div>
      
      {selectedFrames.length > 0 && (
        <div className={styles.selectionSummary}>
          <span className={styles.selectionCount}>
            {selectedFrames.length} frame{selectedFrames.length !== 1 ? 's' : ''} selected
          </span>
          <span className={styles.estimatedSize}>
            Est. total: {calculateTotalSize(frames.filter(f => selectedFrames.includes(f.id)))}
          </span>
        </div>
      )}
    </div>
  );
};

function calculateTotalSize(frames: DetectedFrame[]): string {
  // Simple estimation - in real implementation, this would be more accurate
  const totalPixels = frames.reduce((sum, frame) => sum + (frame.width * frame.height), 0);
  const estimatedBytes = totalPixels * 3; // RGB estimation
  
  if (estimatedBytes < 1024 * 1024) {
    return `${Math.round(estimatedBytes / 1024)}KB`;
  } else {
    return `${Math.round(estimatedBytes / (1024 * 1024))}MB`;
  }
}
