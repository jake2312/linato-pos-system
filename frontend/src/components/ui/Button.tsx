import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type ButtonTone = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone;
  size?: ButtonSize;
  loading?: boolean;
};

const toneStyles: Record<ButtonTone, string> = {
  primary: "bg-basil text-white hover:bg-basil/90",
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  danger: "bg-rose text-white hover:bg-rose/90",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-sm",
};

export function Button({
  tone = "primary",
  size = "md",
  loading,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-basil/30 disabled:cursor-not-allowed disabled:opacity-60",
        toneStyles[tone],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/60 border-t-white" />
      )}
      {children}
    </button>
  );
}
