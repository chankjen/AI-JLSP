'use client';

import { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  const addToast = (props: ToastProps) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...props, id }]);

    if (props.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, props.duration || 3000);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}

export function Toast({ message, type }: ToastProps) {
  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div className={`border rounded-lg p-4 ${colors[type]}`}>
      <div className="flex items-center">
        <span className="text-xl mr-3">{icons[type]}</span>
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
}
