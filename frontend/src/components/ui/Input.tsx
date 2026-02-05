import type { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
};

export function Input({
  label,
  helperText,
  className,
  ...props
}: InputProps) {
  return (
    <label className="flex w-full flex-col gap-1 text-xs font-semibold uppercase text-slate-500">
      {label && <span>{label}</span>}
      <input
        className={cn(
          "w-full rounded-xl border-slate-200 text-sm font-normal text-slate-800 focus:border-basil focus:ring-basil/30",
          className
        )}
        {...props}
      />
      {helperText && (
        <span className="text-[11px] font-normal text-slate-400">
          {helperText}
        </span>
      )}
    </label>
  );
}
