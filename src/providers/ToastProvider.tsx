import Toast from '@/components/layoutComponents/Toast';
import { ToastContext } from '@/contexts/ToastContext';
import type { ToastData, ToastVariant } from '@/types/components/toastTypes';
import React, { useCallback, useState } from 'react';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback(
    (variant: ToastVariant, title: string, details?: string, duration: number = 4000) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, variant, title, details, duration }]);
    },
    []
  );

  const showSuccess = useCallback(
    (title: string, details?: string) => {
      showToast('success', title, details);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, details?: string) => {
      showToast('warning', title, details);
    },
    [showToast]
  );

  const showError = useCallback(
    (title: string, details?: string) => {
      showToast('error', title, details);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, details?: string) => {
      showToast('info', title, details);
    },
    [showToast]
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showWarning, showError, showInfo }}>
      {children}
      <div className="fixed z-50 bottom-4 right-4 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              variant={toast.variant}
              title={toast.title}
              details={toast.details}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
