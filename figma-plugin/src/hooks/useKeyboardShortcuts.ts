import { useEffect } from 'react';

interface KeyboardShortcuts {
  onRefresh?: () => void;
  onExport?: () => void;
  onPreview?: () => void;
  onClose?: () => void;
  onFormatCycle?: () => void;
}

interface UseKeyboardShortcutsOptions extends KeyboardShortcuts {
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onRefresh,
  onExport,
  onPreview,
  onClose,
  onFormatCycle,
  enabled = true
}: UseKeyboardShortcutsOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const { key, metaKey, ctrlKey, shiftKey, altKey } = event;
      const cmdOrCtrl = metaKey || ctrlKey;

      // Cmd/Ctrl + R: Refresh images
      if (cmdOrCtrl && key.toLowerCase() === 'r' && !shiftKey && !altKey) {
        event.preventDefault();
        onRefresh?.();
        return;
      }

      // Cmd/Ctrl + E: Export
      if (cmdOrCtrl && key.toLowerCase() === 'e' && !shiftKey && !altKey) {
        event.preventDefault();
        onExport?.();
        return;
      }

      // Cmd/Ctrl + P: Preview
      if (cmdOrCtrl && key.toLowerCase() === 'p' && !shiftKey && !altKey) {
        event.preventDefault();
        onPreview?.();
        return;
      }

      // Escape: Close plugin
      if (key === 'Escape' && !cmdOrCtrl && !shiftKey && !altKey) {
        event.preventDefault();
        onClose?.();
        return;
      }

      // Tab: Cycle through formats (MP4 -> GIF -> WebM -> MP4)
      if (key === 'Tab' && !cmdOrCtrl && !shiftKey && !altKey) {
        event.preventDefault();
        onFormatCycle?.();
        return;
      }

      // Space: Toggle preview (if available)
      if (key === ' ' && !cmdOrCtrl && !shiftKey && !altKey) {
        event.preventDefault();
        onPreview?.();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onRefresh, onExport, onPreview, onClose, onFormatCycle, enabled]);

  // Return the shortcuts for documentation/help
  return {
    shortcuts: [
      { key: 'Cmd/Ctrl + R', description: 'Refresh images from Figma' },
      { key: 'Cmd/Ctrl + E', description: 'Export slideshow' },
      { key: 'Cmd/Ctrl + P', description: 'Generate preview' },
      { key: 'Space', description: 'Generate preview' },
      { key: 'Tab', description: 'Cycle export format' },
      { key: 'Escape', description: 'Close plugin' }
    ]
  };
};
