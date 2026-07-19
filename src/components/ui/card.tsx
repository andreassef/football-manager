import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-card border border-border p-[18px]", className)} {...props} />;
}

export function PanelTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-sm font-bold mb-1 tracking-tight", className)} {...props} />;
}

export function PanelNote({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-[11.5px] text-text-3 mb-3.5", className)} {...props} />;
}

export function Eyebrow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-3", className)}
      {...props}
    />
  );
}
