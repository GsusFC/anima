import React, { useState, useEffect } from 'react';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastProps {
  message: ToastMessage;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ message, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(message.id);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [message.id, onRemove]);

  const getToastStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      padding: '12px 16px',
      borderRadius: '6px',
      color: 'white',
      fontSize: '14px',
      fontFamily: '"Space Mono", monospace',
      zIndex: 9999,
      maxWidth: '400px',
      wordWrap: 'break-word' as const,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      cursor: 'pointer'
    };

    const typeStyles = {
      success: { backgroundColor: '#22c55e' },
      error: { backgroundColor: '#ef4444' },
      warning: { backgroundColor: '#f59e0b' },
      info: { backgroundColor: '#3b82f6' }
    };

    return { ...baseStyles, ...typeStyles[message.type] };
  };

  return (
    <div 
      style={getToastStyles()}
      onClick={() => onRemove(message.id)}
    >
      {message.message}
    </div>
  );
};

// Toast container and hook
const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Expose addToast globally
  useEffect(() => {
    (window as any).showToast = addToast;
  }, []);

  return (
    <>
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ top: `${20 + index * 60}px`, position: 'fixed', right: '20px', zIndex: 9999 }}>
          <Toast message={toast} onRemove={removeToast} />
        </div>
      ))}
    </>
  );
};

export default ToastContainer;

// Helper function for easy usage
export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  if ((window as any).showToast) {
    (window as any).showToast(message, type);
  } else {
    // Fallback to alert if toast system not initialized
    alert(message);
  }
};
