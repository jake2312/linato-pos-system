import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table
        className={cn("w-full text-left text-sm", className)}
        {...props}
      />
    </div>
  );
}
