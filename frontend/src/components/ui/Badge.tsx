import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export type BadgeTone = "info" | "success" | "warning" | "danger" | "neutral";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneStyles: Record<BadgeTone, string> = {
  info: "bg-basil/10 text-basil",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-mango/15 text-mango",
  danger: "bg-rose/15 text-rose",
  neutral: "bg-slate-100 text-slate-600",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        toneStyles[tone],
        className
      )}
      {...props}
    />
  );
}
