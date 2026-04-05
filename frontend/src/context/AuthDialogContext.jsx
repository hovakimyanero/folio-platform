import { createContext, useContext, useState, useCallback } from 'react';

const AuthDialogContext = createContext(null);

export function AuthDialogProvider({ children }) {
  const [open, setOpen] = useState(false);

  const openAuthDialog = useCallback(() => setOpen(true), []);
  const closeAuthDialog = useCallback(() => setOpen(false), []);

  return (
    <AuthDialogContext.Provider value={{ open, setOpen, openAuthDialog, closeAuthDialog }}>
      {children}
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog() {
  const ctx = useContext(AuthDialogContext);
  if (!ctx) throw new Error('useAuthDialog must be inside AuthDialogProvider');
  return ctx;
}
