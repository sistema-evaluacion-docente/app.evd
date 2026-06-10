import { Landmark } from "lucide-react";

function BrandPanel() {
  return (
    <section
      className="relative flex flex-col items-center justify-center overflow-hidden bg-brand-500 px-10 py-12 text-white"
      aria-hidden="true"
    >
      <div className="flex flex-row items-center gap-4 md:flex-col md:gap-7">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm md:h-24 md:w-24">
          <Landmark className="h-8 w-8 md:h-11 md:w-11" strokeWidth={1.6} />
        </div>

        <div className="hidden h-px w-8 bg-white/55 md:block" />

        <div className="text-xs font-semibold uppercase leading-relaxed tracking-[0.22em] text-white/95 md:text-center md:text-sm">
          Evaluación
          <br className="hidden md:block" /> Docente
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-7 hidden text-center text-xs font-semibold tracking-[0.3em] text-white/50 md:block">
        UFPS
      </div>
    </section>
  );
}

export default BrandPanel;
