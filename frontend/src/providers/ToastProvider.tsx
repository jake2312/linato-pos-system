import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createToast, toastStore } from "./toastStore";
import type { Toast, ToastTone } from "./toastStore";
import { cn } from "../utils/cn";

type ToastOptions = {
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
};

type ToastApi = {
  push: (toast: Toast) => void;
  success: (title: string, options?: ToastOptions) => void;
  error: (title: string, options?: ToastOptions) => void;
  warning: (title: string, options?: ToastOptions) => void;
  info: (title: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const toneStyles: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  warning: "border-mango/40 bg-mango/10 text-mango",
  info: "border-basil/30 bg-basil/10 text-basil",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>(toastStore.getState());

  useEffect(() => toastStore.subscribe(setToasts), []);

  const api = useMemo<ToastApi>(() => {
    const push = (toast: Toast) => toastStore.addToast(toast);
    const make =
      (tone: ToastTone) => (title: string, options?: ToastOptions) =>
        push(createToast(tone, title, options?.message, options));

    return {
      push,
      success: make("success"),
      error: make("error"),
      warning: make("warning"),
      info: make("info"),
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed right-4 top-4 z-[60] flex w-[92vw] max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "rounded-2xl border px-4 py-3 shadow-card transition",
              toneStyles[toast.tone]
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.message && (
                  <p className="mt-1 text-xs opacity-80">{toast.message}</p>
                )}
              </div>
              <button
                className="text-xs font-semibold opacity-70 hover:opacity-100"
                onClick={() => toastStore.removeToast(toast.id)}
              >
                Dismiss
              </button>
            </div>
            {toast.action && (
              <button
                className="mt-2 text-xs font-semibold underline"
                onClick={() => {
                  toast.action?.onClick();
                  toastStore.removeToast(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
