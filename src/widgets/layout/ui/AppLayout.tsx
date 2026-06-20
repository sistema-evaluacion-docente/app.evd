import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";

import AppLayoutSkeleton from "@/components/skeletons/AppLayoutSkeleton";
import securityConfig from "@/config/security";
import useAuth from "@/shared/hooks/useAuth";
import { AppHeader, type AppHeaderProps } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";

export interface AppLayoutProps {
  children: ReactNode;
  /** Utility classes for the `<main>` content wrapper (max-width, spacing). */
  mainClassName?: string;
  header?: Omit<AppHeaderProps, "onOpenMenu">;
}

function isAuthorizedForPage(path: string, role: string | null): boolean {
  const pageConfig = securityConfig.pages.find(
    (page) => path === page.path || path.startsWith(page.path + "/"),
  );

  return !pageConfig || (role !== null && pageConfig.roles.includes(role));
}

/** Application shell: role-based sidebar + header + scrollable content. */
export function AppLayout({
  children,
  mainClassName = "max-w-[1320px] space-y-5",
  header,
}: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  const { isLoading, selectedRole } = useAuth();

  if (isLoading) {
    return <AppLayoutSkeleton />;
  }

  const authorized = isAuthorizedForPage(location, selectedRole);

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
          {authorized ? (
            children
          ) : (
            <div className="flex flex-col h-[calc(100vh-200px)] items-center justify-center py-20 text-center">
              <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-red-100">
                <span className="text-4xl text-red-500">!</span>
              </div>

              <h2 className="text-2xl font-semibold text-ink-700">
                Acceso no autorizado
              </h2>

              <p className="mt-2 text-ink- mb-4">
                No tienes permisos para acceder a esta página.
              </p>

              <Link to="/dashboard">
                <Button variant="link">Volver al inicio</Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
