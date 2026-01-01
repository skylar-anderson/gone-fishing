'use client';

import { useEffect } from 'react';
import { useGameStore, Toast as ToastType } from '@/store/gameStore';
import { useButtonSound } from '@/lib/hooks/useButtonSound';

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useGameStore((state) => state.removeToast);
  const withSound = useButtonSound();

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  const bgColor = {
    error: 'bg-red-600',
    success: 'bg-green-600',
    info: 'bg-blue-600',
  }[toast.type];

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in`}
    >
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        onClick={withSound(() => removeToast(toast.id))}
        className="text-white/80 hover:text-white ml-auto"
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useGameStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
