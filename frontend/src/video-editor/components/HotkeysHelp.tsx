import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

interface HotkeyItem {
  key: string;
  action: string;
}

interface HotkeysSection {
  playback: HotkeyItem[];
  segments: HotkeyItem[];
  zoom: HotkeyItem[];
  help: HotkeyItem[];
}

interface HotkeysHelpProps {
  hotkeys: HotkeysSection;
  isOpen: boolean;
  onToggle: () => void;
}

export const HotkeysHelp: React.FC<HotkeysHelpProps> = ({ hotkeys, isOpen, onToggle }) => {
  // Close modal with Escape key when open
  useHotkeys('Escape', () => {
    if (isOpen) {
      onToggle();
    }
  }, { enabled: isOpen });

  return (
    <>
      {/* Help Button */}
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 bg-gray-700 hover:bg-gray-600 text-gray-200 p-2 rounded border border-gray-600 transition-colors"
        title="Keyboard Shortcuts (?)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Help Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-mono font-bold text-pink-500">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={onToggle}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {/* Playback */}
              <div>
                <h3 className="text-sm font-mono font-bold text-gray-300 mb-2">
                  Playback
                </h3>
                <div className="space-y-1">
                  {hotkeys.playback.map((hotkey, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <kbd className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs font-mono text-gray-200">
                        {hotkey.key}
                      </kbd>
                      <span className="text-xs text-gray-400">{hotkey.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Segments */}
              <div>
                <h3 className="text-sm font-mono font-bold text-gray-300 mb-2">
                  Segments
                </h3>
                <div className="space-y-1">
                  {hotkeys.segments.map((hotkey, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <kbd className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs font-mono text-gray-200">
                        {hotkey.key}
                      </kbd>
                      <span className="text-xs text-gray-400">{hotkey.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zoom */}
              <div>
                <h3 className="text-sm font-mono font-bold text-gray-300 mb-2">
                  Zoom
                </h3>
                <div className="space-y-1">
                  {hotkeys.zoom.map((hotkey, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <kbd className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs font-mono text-gray-200">
                        {hotkey.key}
                      </kbd>
                      <span className="text-xs text-gray-400">{hotkey.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Help */}
              <div>
                <h3 className="text-sm font-mono font-bold text-gray-300 mb-2">
                  Help
                </h3>
                <div className="space-y-1">
                  {hotkeys.help.map((hotkey, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <kbd className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs font-mono text-gray-200">
                        {hotkey.key}
                      </kbd>
                      <span className="text-xs text-gray-400">{hotkey.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 font-mono">
                Press <kbd className="px-1 bg-gray-700 border border-gray-600 rounded">Esc</kbd> to close
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
