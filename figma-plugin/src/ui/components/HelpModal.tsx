import React from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
}

interface HelpModalProps {
  isVisible: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.metaKey) parts.push('Cmd');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');
  
  parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key);
  
  return parts.join(' + ');
};

export const HelpModal: React.FC<HelpModalProps> = ({ isVisible, onClose, shortcuts }) => {
  if (!isVisible) return null;

  return React.createElement('div', {
    style: {
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
    },
    onClick: onClose
  }, React.createElement('div', {
    style: {
      backgroundColor: '#1a1a1b',
      border: '1px solid #343536',
      borderRadius: '8px',
      padding: '24px',
      minWidth: '400px',
      maxWidth: '500px',
      color: 'white',
      fontFamily: '"Space Mono", monospace'
    },
    onClick: (e: React.MouseEvent) => e.stopPropagation()
  }, [
    React.createElement('div', {
      key: 'header',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }
    }, [
      React.createElement('h2', {
        key: 'title',
        style: {
          margin: 0,
          fontSize: '16px',
          fontWeight: 'bold'
        }
      }, '⌨️ Keyboard Shortcuts'),
      React.createElement('button', {
        key: 'close',
        onClick: onClose,
        style: {
          background: 'none',
          border: 'none',
          color: '#9ca3af',
          fontSize: '20px',
          cursor: 'pointer',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px'
        }
      }, '×')
    ]),
    
    React.createElement('div', {
      key: 'shortcuts',
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }
    }, shortcuts.map((shortcut, index) => 
      React.createElement('div', {
        key: index,
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0',
          borderBottom: index < shortcuts.length - 1 ? '1px solid #343536' : 'none'
        }
      }, [
        React.createElement('span', {
          key: 'description',
          style: {
            fontSize: '13px',
            color: '#e5e7eb'
          }
        }, shortcut.description),
        React.createElement('span', {
          key: 'shortcut',
          style: {
            fontSize: '12px',
            color: '#ec4899',
            fontWeight: 'bold',
            backgroundColor: '#2a2a2b',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #343536'
          }
        }, formatShortcut(shortcut))
      ])
    )),
    
    React.createElement('div', {
      key: 'footer',
      style: {
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#0f0f10',
        borderRadius: '4px',
        fontSize: '11px',
        color: '#9ca3af',
        textAlign: 'center'
      }
    }, 'Press Shift + ? to show/hide this help')
  ]));
};
