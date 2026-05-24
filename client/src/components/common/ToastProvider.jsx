import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const containerClass = "fixed bottom-[100px] left-[50%] -translate-x-[50%] z-[9999] flex flex-col gap-[8px] pointer-events-none";
  const toastClass = "bg-[#282e28] text-ink py-[12px] px-[24px] rounded-[8px] text-[0.88rem] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.5)] animate-toast-in pointer-events-auto whitespace-nowrap";

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={containerClass} aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={toastClass}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
