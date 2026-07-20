import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned action buttons. */
  actions?: ReactNode;
  /** Optional element rendered above the title (e.g. a role badge). */
  badge?: ReactNode;
  /** Render the institutional red underline below the title. */
  underline?: boolean;
}

/** Standard page heading: optional badge, title, description and actions. */
export function PageHeader({
  title,
  description,
  actions,
  badge,
  underline,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-4 sm:flex-row",
        underline ? "sm:items-start" : "sm:items-end",
      )}
    >
      <div>
        {badge && <div className="mb-3">{badge}</div>}

        <h1 className="inline-block text-2xl font-semibold leading-tight tracking-tight">
          {title}
          {underline && (
            <span className="mt-2 block h-1 w-16 rounded-full bg-brand-600" />
          )}
        </h1>

        {description && (
          <p
            className="mt-1.5 text-[14px] text-muted-foreground"
            style={{ textWrap: "pretty" }}
          >
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </div>
  );
}
