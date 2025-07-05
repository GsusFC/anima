import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  description: string;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

interface UseKeyboardShortcutsReturn {
  shortcuts: KeyboardShortcut[];
}

export const useKeyboardShortcuts = ({ 
  shortcuts, 
  enabled = true 
}: UseKeyboardShortcutsProps): UseKeyboardShortcutsReturn => {
  const shortcutsRef = useRef<KeyboardShortcut[]>(shortcuts);
  
  // Update shortcuts ref when they change
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
      const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey;
      const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;
      const altMatch = shortcut.altKey === undefined || shortcut.altKey === event.altKey;
      
      return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch;
    });

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      matchingShortcut.callback();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return { shortcuts };
};

// Common keyboard shortcuts for the plugin
export const createCommonShortcuts = (callbacks: {
  onExport?: () => void;
  onPreview?: () => void;
  onClearTimeline?: () => void;
  onAddImages?: () => void;
  onShowHelp?: () => void;
  onClosePlugin?: () => void;
}): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = [];

  if (callbacks.onExport) {
    shortcuts.push({
      key: 'e',
      ctrlKey: true,
      callback: callbacks.onExport,
      description: 'Export slideshow'
    });
  }

  if (callbacks.onPreview) {
    shortcuts.push({
      key: 'p',
      ctrlKey: true,
      callback: callbacks.onPreview,
      description: 'Generate preview'
    });
  }

  if (callbacks.onClearTimeline) {
    shortcuts.push({
      key: 'r',
      ctrlKey: true,
      callback: callbacks.onClearTimeline,
      description: 'Clear timeline'
    });
  }

  if (callbacks.onAddImages) {
    shortcuts.push({
      key: 'i',
      ctrlKey: true,
      callback: callbacks.onAddImages,
      description: 'Add selected images'
    });
  }

  if (callbacks.onShowHelp) {
    shortcuts.push({
      key: '?',
      shiftKey: true,
      callback: callbacks.onShowHelp,
      description: 'Show keyboard shortcuts'
    });
  }

  if (callbacks.onClosePlugin) {
    shortcuts.push({
      key: 'Escape',
      callback: callbacks.onClosePlugin,
      description: 'Close plugin'
    });
  }

  return shortcuts;
};
