import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-2xl bg-white p-4 shadow-card", className)}
      {...props}
    />
  );
}
