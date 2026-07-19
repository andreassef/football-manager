import { cn } from "@/lib/cn";

type Tone = "won" | "lost" | "open" | "void";

const toneClass: Record<Tone, string> = {
  won: "bg-good-bg text-good",
  lost: "bg-critical-bg text-critical",
  open: "bg-warning-bg text-warning",
  void: "bg-void-bg text-text-2",
};

export function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full",
        toneClass[tone]
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function statusTone(status: "PENDING" | "WON" | "LOST" | "VOID"): Tone {
  switch (status) {
    case "WON":
      return "won";
    case "LOST":
      return "lost";
    case "PENDING":
      return "open";
    case "VOID":
      return "void";
  }
}
