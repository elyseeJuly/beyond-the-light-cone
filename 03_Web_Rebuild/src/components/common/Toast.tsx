import React, { useState, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  text: string;
  category?: string;
  onClick?: () => void;
}

export const Toast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (detail && detail.text) {
        const newToast: ToastMessage = {
          id: Math.random().toString(36).substring(2, 9),
          text: detail.text,
          category: detail.category || '【系统消息】',
          onClick: detail.onClick,
        };
        setToasts((prev) => [...prev, newToast]);
      }
    };

    window.addEventListener('game:toast:message', handleToastEvent);
    return () => window.removeEventListener('game:toast:message', handleToastEvent);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000] flex flex-col gap-2 max-w-sm w-[90%] pointer-events-auto">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(onRemove, 3500); // Auto close after 3.5s
    return () => clearTimeout(timer);
  }, [onRemove]);

  const handleClick = () => {
    if (toast.onClick) {
      toast.onClick();
    }
    onRemove();
  };

  return (
    <div 
      onClick={handleClick}
      className="animate-toast-slide-in flex flex-col justify-center px-4 py-3 bg-[#070B14]/95 backdrop-blur border border-[var(--color-primary)]/40 rounded shadow-[0_4px_20px_rgba(0,184,255,0.25)] cursor-pointer text-xs select-none transition-all hover:border-[var(--color-primary)]/80 hover:bg-[#0c1424]/95"
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-[var(--color-primary)] font-title uppercase tracking-wider">{toast.category}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-white/40 hover:text-white text-[10px]"
        >
          ✕
        </button>
      </div>
      <p className="text-white/80 mt-1 font-sans leading-relaxed">{toast.text}</p>
    </div>
  );
};

export default Toast;
