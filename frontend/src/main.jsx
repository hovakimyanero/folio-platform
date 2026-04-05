import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthDialogProvider } from './context/AuthDialogContext';
import { ToastProvider } from './context/ToastContext';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthDialogProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthDialogProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
