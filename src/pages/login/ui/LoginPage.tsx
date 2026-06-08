import { Landmark, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import useAuth from "@/shared/hooks/useAuth";
import { cn } from "@/shared/lib/utils";

export function LoginPage() {
  const { loginWithGoogle } = useAuth();

  const [isLoadingLogin, setIsLoadingLogin] = useState(false);

  const handleLoginWithGoogle = () => {
    if (isLoadingLogin) return;

    setIsLoadingLogin(true);

    loginWithGoogle()
      .then((response) => {
        if (response?.status === 200) {
          toast.success("Login successful");
        } else {
          toast.error(response?.error || "Login failed");
        }
      })
      .finally(() => {
        setIsLoadingLogin(false);
      });
  };

  return (
    <main className="grid min-h-screen md:grid-cols-[minmax(320px,38%)_1fr]">
      {/* Brand panel */}
      <section
        className="relative flex flex-col items-center justify-center overflow-hidden bg-brand-600 px-10 py-12 text-white"
        style={{
          backgroundImage:
            "radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,0.06), transparent 55%), radial-gradient(120% 90% at 0% 100%, rgba(0,0,0,0.18), transparent 60%)",
        }}
        aria-hidden="true"
      >
        <div className="flex flex-row items-center gap-4 sm:flex-col sm:gap-7">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm sm:h-24 sm:w-24">
            <Landmark className="h-8 w-8 sm:h-11 sm:w-11" strokeWidth={1.6} />
          </div>
          <div className="hidden h-px w-8 bg-white/55 sm:block" />
          <div className="text-[11px] font-semibold uppercase leading-relaxed tracking-[0.22em] text-white/95 sm:text-center sm:text-[13px]">
            Evaluación
            <br className="hidden sm:block" /> Docente
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-7 hidden text-center text-[11px] font-semibold tracking-[0.3em] text-white/50 sm:block">
          UFPS
        </div>
      </section>

      {/* Login card */}
      <section className="flex items-center justify-center bg-white px-6 py-12">
        <div className="animate-rise flex w-full max-w-[420px] flex-col">
          <header className="mb-7 text-center">
            <h1 className="text-[26px] font-semibold tracking-tight text-ink-900">
              Acceso al Sistema
            </h1>
            <p className="mt-2 text-[13.5px] text-ink-500">
              Inicie sesión con sus credenciales institucionales
            </p>
          </header>

          <button
            type="button"
            onClick={handleLoginWithGoogle}
            aria-busy={isLoadingLogin}
            className={cn(
              "inline-flex h-12 w-full items-center justify-center gap-3 rounded-[10px] border border-[#dadce0] bg-white px-4 text-[14.5px] font-medium text-[#1f1f1f] transition-all",
              "hover:border-[#d2e3fc] hover:bg-[#f8faff] hover:shadow-[0_1px_2px_0_rgba(60,64,67,0.30),0_1px_3px_1px_rgba(60,64,67,0.15)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a73e8]",
            )}
          >
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              {isLoadingLogin
                ? "Verificando cuenta institucional"
                : "Iniciar sesión con Google Institucional"}

              {isLoadingLogin && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink-300 border-t-[#1a73e8]" />
              )}
            </span>
          </button>

          <p
            className="mt-4 text-center text-[12px] leading-relaxed text-ink-500"
            style={{ textWrap: "pretty" }}
          >
            Para acceder, debe utilizar su cuenta de correo electrónico
            proporcionada por la universidad.
          </p>

          <div className="my-6 flex items-center gap-3.5">
            <span className="h-px flex-1 bg-ink-200" />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              Información
            </span>
            <span className="h-px flex-1 bg-ink-200" />
          </div>

          <div className="inline-flex w-full items-center justify-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink-500">
            <ShieldCheck size={14} className="text-ink-400" />
            <span>Uso exclusivo personal autorizado</span>
          </div>
        </div>
      </section>
    </main>
  );
}
