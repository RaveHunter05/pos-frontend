import { useEffect } from 'react';
import styles from './Toast.module.css';

type ToastProps = {
  message: string;
  variant?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
};

export function Toast({ message, variant = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timeout);
  }, [duration, onClose]);

  return <div className={`${styles.toast} ${styles[variant]}`}>{message}</div>;
}
