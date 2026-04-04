import { createContext, useContext, useState, useCallback } from 'react';
import * as Toast from '@radix-ui/react-toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'default') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast.Provider swipeDirection="down" duration={4000}>
        {children}
        {toasts.map(t => (
          <Toast.Root key={t.id} className="toast-root">
            <span
              className="toast-dot"
              style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: t.type === 'error' ? '#ff4444' : t.type === 'success' ? '#4FD1FF' : '#C0C0C0',
              }}
            />
            <Toast.Description>{t.message}</Toast.Description>
          </Toast.Root>
        ))}
        <Toast.Viewport />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
