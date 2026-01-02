import { useEffect } from 'react';

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

  const variantStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${variantStyles[variant]}`}>
      {message}
    </div>
  );
}
