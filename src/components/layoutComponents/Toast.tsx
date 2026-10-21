import type { ToastProps } from '@/types/components/toastTypes';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

const Toast: React.FC<ToastProps> = ({
  variant = 'success',
  title,
  details,
  onClose,
  duration = 4000,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  const variantConfig = {
    success: {
      bg: 'bg-emerald-600',
      text: 'text-white',
      icon: <CheckCircle2 className="w-5 h-5 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-500',
      text: 'text-zinc-950',
      icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
    },
    error: {
      bg: 'bg-destructive',
      text: 'text-primary-foreground',
      icon: <XCircle className="w-5 h-5 shrink-0" />,
    },
    info: {
      bg: 'bg-sky-600',
      text: 'text-white',
      icon: <Info className="w-5 h-5 shrink-0" />,
    },
  };

  const { bg, text, icon } = variantConfig[variant];

  return (
    <div
      className={`transition-all duration-300 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
      }`}
    >
      <div
        className={`${bg} ${text} rounded-xl shadow-xl p-3.5 flex items-start gap-3 border border-border/20 backdrop-blur-md`}
      >
        <div className="mt-0.5">{icon}</div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm tracking-tight">{title}</h4>
          {details && <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{details}</p>}
        </div>

        <button
          onClick={handleClose}
          className="shrink-0 p-1 rounded-md opacity-80 hover:opacity-100 hover:bg-black/10 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
