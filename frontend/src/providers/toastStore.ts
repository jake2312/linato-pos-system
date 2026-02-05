export type ToastTone = "success" | "error" | "warning" | "info";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type Toast = {
  id: string;
  title: string;
  message?: string;
  tone: ToastTone;
  duration?: number;
  action?: ToastAction;
};

type ToastListener = (toasts: Toast[]) => void;

const listeners = new Set<ToastListener>();
let toasts: Toast[] = [];
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const notify = () => {
  listeners.forEach((listener) => listener([...toasts]));
};

export const toastStore = {
  getState: () => [...toasts],
  subscribe: (listener: ToastListener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  addToast: (toast: Toast) => {
    toasts = [toast, ...toasts].slice(0, 5);
    notify();

    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        toastStore.removeToast(toast.id);
      }, toast.duration);
      timers.set(toast.id, timer);
    }
  },
  removeToast: (id: string) => {
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
    toasts = toasts.filter((toast) => toast.id !== id);
    notify();
  },
  clear: () => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    toasts = [];
    notify();
  },
};

export const createToast = (
  tone: ToastTone,
  title: string,
  message?: string,
  options?: { duration?: number; action?: ToastAction }
): Toast => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  tone,
  title,
  message,
  duration: options?.duration ?? 4000,
  action: options?.action,
});
