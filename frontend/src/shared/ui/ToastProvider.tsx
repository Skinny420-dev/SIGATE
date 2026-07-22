'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import styles from './ToastProvider.module.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message: string, description?: string) => {
    addToast({ type: 'success', message, description });
  }, [addToast]);

  const error = useCallback((message: string, description?: string) => {
    addToast({ type: 'error', message, description });
  }, [addToast]);

  const info = useCallback((message: string, description?: string) => {
    addToast({ type: 'info', message, description });
  }, [addToast]);

  const warning = useCallback((message: string, description?: string) => {
    addToast({ type: 'warning', message, description });
  }, [addToast]);

  const value = React.useMemo(() => ({ toast: addToast, success, error, info, warning }), [addToast, success, error, info, warning]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            <div className={styles.toastIcon}>
              {t.type === 'success' && <CheckCircle2 size={20} />}
              {t.type === 'error' && <AlertCircle size={20} />}
              {t.type === 'warning' && <AlertTriangle size={20} />}
              {t.type === 'info' && <Info size={20} />}
            </div>
            <div className={styles.toastContent}>
              <h4 className={styles.toastTitle}>{t.message}</h4>
              {t.description && <p className={styles.toastDescription}>{t.description}</p>}
            </div>
            <button className={styles.toastClose} onClick={() => removeToast(t.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
