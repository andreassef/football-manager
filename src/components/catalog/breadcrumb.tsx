import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center flex-wrap gap-1.5 text-[12.5px] text-text-3 mb-3.5">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-text-3">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-teal underline underline-offset-2">
              {item.label}
            </Link>
          ) : (
            <span className="text-text-1 font-semibold">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
