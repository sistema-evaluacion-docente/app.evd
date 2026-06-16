import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

import AppLayoutSkeleton from "@/components/skeletons/AppLayoutSkeleton";
import useAuth from "@/shared/hooks/useAuth";
import { AppHeader, type AppHeaderProps } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

export interface AppLayoutProps {
  children: ReactNode;
  /**
   * Intended audience of the page. Currently the sidebar derives the active
   * role from auth, so this is accepted for call-site clarity but not consumed
   * by the shell yet.
   */
  role?: "director" | "teacher" | "admin";
  /** Utility classes for the `<main>` content wrapper (max-width, spacing). */
  mainClassName?: string;
  header?: Omit<AppHeaderProps, "onOpenMenu">;
}

/** Application shell: role-based sidebar + header + scrollable content. */
export function AppLayout({
  children,
  mainClassName = "max-w-[1320px] space-y-5",
  header,
}: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { isLoading } = useAuth();

  if (isLoading) {
    return <AppLayoutSkeleton />;
  }

  return (
    <div className="flex min-h-screen bg-ink-50">
      <AppSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onOpenMenu={() => setMobileOpen(true)} {...header} />

        <main
          className={cn(
            "mx-auto w-full flex-1 px-4 py-6 lg:px-8 lg:py-8",
            mainClassName,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
