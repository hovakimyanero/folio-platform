import { createContext, useContext, useState, useCallback } from 'react';

const AuthDialogContext = createContext(null);

export function AuthDialogProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [initialMode, setInitialMode] = useState('login');

  const openAuthDialog = useCallback((mode = 'login') => {
    setInitialMode(mode);
    setOpen(true);
  }, []);
  const closeAuthDialog = useCallback(() => setOpen(false), []);

  return (
    <AuthDialogContext.Provider value={{ open, setOpen, initialMode, openAuthDialog, closeAuthDialog }}>
      {children}
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog() {
  const ctx = useContext(AuthDialogContext);
  if (!ctx) throw new Error('useAuthDialog must be inside AuthDialogProvider');
  return ctx;
}
