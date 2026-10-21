export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastData {
  id: number;
  variant: ToastVariant;
  title: string;
  details?: string;
  duration?: number;
}

export interface ToastProps {
  variant: ToastVariant;
  title: string;
  details?: string;
  onClose?: () => void;
  duration?: number;
}
