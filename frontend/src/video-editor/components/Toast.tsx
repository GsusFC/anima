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

  const getTypeStyles = () => {
    const typeStyles = {
      success: 'bg-accent-green',
      error: 'bg-accent-red',
      warning: 'bg-orange-500',
      info: 'bg-accent-blue'
    };
    return typeStyles[message.type];
  };

  return (
    <div 
      className={`fixed top-5 right-5 px-4 py-3 rounded-md text-white text-lg font-mono max-w-sm break-words shadow-lg cursor-pointer z-50 ${getTypeStyles()}`}
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
    window.showToast = addToast;
  }, []);

  return (
    <>
      {toasts.map((toast, index) => (
        <div key={toast.id} className="fixed right-5 z-50" style={{ top: `${20 + index * 60}px` }}>
          <Toast message={toast} onRemove={removeToast} />
        </div>
      ))}
    </>
  );
};

export default ToastContainer;

// Declare global window interface extension
declare global {
  interface Window {
    showToast?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  }
}

// Helper function for easy usage
export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  if (window.showToast) {
    window.showToast(message, type);
  } else {
    // Fallback to alert if toast system not initialized
    alert(message);
  }
};
