'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getBorderAndBg = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          border: '1px solid hsl(var(--color-success) / 0.4)',
          bg: 'hsl(var(--bg-secondary))',
          color: 'hsl(var(--color-success))',
          icon: '✓',
        };
      case 'error':
        return {
          border: '1px solid hsl(var(--color-danger) / 0.4)',
          bg: 'hsl(var(--bg-secondary))',
          color: 'hsl(var(--color-danger))',
          icon: '✕',
        };
      case 'warning':
        return {
          border: '1px solid hsl(var(--color-warning) / 0.4)',
          bg: 'hsl(var(--bg-secondary))',
          color: 'hsl(var(--color-warning))',
          icon: '⚠',
        };
      default:
        return {
          border: '1px solid hsl(var(--color-brand-accent) / 0.4)',
          bg: 'hsl(var(--bg-secondary))',
          color: 'hsl(var(--color-brand-accent))',
          icon: 'ℹ',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxWidth: '420px',
          width: 'calc(100vw - 3rem)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const style = getBorderAndBg(toast.type);
          return (
            <div
              key={toast.id}
              role="alert"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: style.bg,
                border: style.border,
                boxShadow: 'var(--shadow-xl)',
                backdropFilter: 'blur(12px)',
                animation: 'slideUp 200ms ease-out',
                color: 'hsl(var(--text-primary))',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'hsl(var(--bg-surface))',
                  color: style.color,
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  flexShrink: 0,
                }}
              >
                {style.icon}
              </span>
              <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
                style={{
                  color: 'hsl(var(--text-muted))',
                  padding: '0.25rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
