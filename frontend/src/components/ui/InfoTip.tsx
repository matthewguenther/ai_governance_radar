/** Hover/focus tooltip for explaining classifiers. Keyboard accessible; no deps. */

import { useState } from "react";
import { Info } from "lucide-react";

export function InfoTip({
  content,
  children,
  align = "left",
}: {
  content: React.ReactNode;
  children?: React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        role="button"
        aria-label="What does this mean?"
        aria-expanded={open}
        className="inline-flex cursor-help items-center rounded-sm"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      >
        {children ?? <Info aria-hidden className="h-3.5 w-3.5 text-tx-muted hover:text-tx-secondary" />}
      </span>
      {open && (
        <span
          role="tooltip"
          className={`absolute top-full z-50 mt-1.5 w-72 rounded-ctl border border-bd-strong bg-bg-raised px-3 py-2 text-xs font-normal normal-case leading-relaxed tracking-normal text-tx-secondary shadow-card ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
