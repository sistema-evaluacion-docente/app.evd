import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";
import { Link } from "wouter";

import { AppLayout } from "@/widgets/layout";

export function NotFoundPage() {
  return (
    <AppLayout mainClassName="text-center h-[100vh-300px] grid place-items-center">
      <div>
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <TriangleAlert size={24} />
        </div>

        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-500">
          Error 404
        </p>

        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          Página no encontrada
        </h1>

        <p className="mt-3 text-sm text-foreground/70 sm:text-[15px]">
          La ruta que intentaste abrir no existe o fue movida.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto">
              Ir al dashboard
            </Button>
          </Link>

          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Ir al login
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
