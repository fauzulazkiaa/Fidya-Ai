import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50",
        {
          primary:
            "bg-accent text-white hover:brightness-110 active:brightness-95 shadow-[0_4px_14px_rgba(79,70,229,0.25)]",
          secondary:
            "border border-card-border bg-card text-foreground hover:bg-accent-soft",
          ghost: "text-muted hover:text-foreground hover:bg-tick-empty/50",
        }[variant],
        {
          sm: "h-8 px-3.5 text-xs",
          md: "h-10 px-5 text-sm",
          lg: "h-12 px-7 text-base",
          icon: "size-10",
        }[size],
        className
      )}
      {...props}
    />
  );
}
