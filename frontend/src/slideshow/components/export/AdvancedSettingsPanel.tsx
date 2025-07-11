import React, { useState } from 'react';
import { ExportStrategy } from '../../strategies/ExportStrategy';

export interface AdvancedSettingsPanelProps {
  strategy: ExportStrategy;
  exportSettings: any;
  updateExportSettings: (updates: any) => void;
  fpsHandlers: {
    currentFps: number;
    onFpsChange: (fps: number) => void;
  };
}

const AdvancedSettingsPanel: React.FC<AdvancedSettingsPanelProps> = ({
  strategy,
  exportSettings,
  updateExportSettings,
  fpsHandlers
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-3">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 bg-dark-800 hover:bg-dark-750 border border-dark-650 rounded text-xs font-mono transition-all"
      >
        <span className="text-dark-400 uppercase tracking-wider">Advanced Settings</span>
        <span className={`text-dark-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-2 p-3 bg-dark-800/50 border border-dark-650/50 rounded space-y-3">
          
          {/* FPS Settings */}
          <div>
            <h5 className="text-dark-400 font-mono text-xs mb-2 uppercase tracking-wider">Frame Rate</h5>
            <div className="flex flex-wrap gap-1.5">
              {[60, 30, 24, 15].map(fps => (
                <button
                  key={fps}
                  onClick={() => fpsHandlers.onFpsChange(fps)}
                  className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                    (fpsHandlers.currentFps || 30) === fps
                      ? 'bg-accent-pink text-white border border-accent-pink-dark'
                      : 'bg-dark-700 text-dark-400 border border-dark-600 hover:bg-dark-650 hover:text-dark-300'
                  }`}
                >
                  {fps}fps
                </button>
              ))}
            </div>
          </div>

          {/* Format-Specific Controls */}
          <div>
            <h5 className="text-dark-400 font-mono text-xs mb-2 uppercase tracking-wider">
              {exportSettings.format.toUpperCase()} Settings
            </h5>
            <div className="text-xs">
              {strategy.renderControls(exportSettings, updateExportSettings)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSettingsPanel;
