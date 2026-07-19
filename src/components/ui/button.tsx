import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "solid" | "ghost" | "danger";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(({ className, variant = "solid", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "text-[13px] font-bold px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        variant === "solid" && "bg-teal text-white hover:brightness-90",
        variant === "ghost" && "bg-transparent text-text-2 border border-border hover:border-teal hover:text-text-1",
        variant === "danger" && "bg-transparent text-critical border border-critical/30 hover:bg-critical-bg",
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";
