import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Button } from "./Button";

type ModalTone = "default" | "danger";

type ModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  tone?: ModalTone;
};

const toneRing: Record<ModalTone, string> = {
  default: "ring-basil/10",
  danger: "ring-rose/20",
};

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  tone = "default",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastActiveRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel) {
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable[0]?.focus();
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const focusable = panel?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      lastActiveRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "w-full max-w-lg rounded-3xl bg-white p-6 shadow-card ring-4",
          toneRing[tone]
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="heading text-xl">{title}</h2>}
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          <Button tone="ghost" size="sm" onClick={onClose} aria-label="Close">
            Close
          </Button>
        </div>
        <div className="mt-4">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
