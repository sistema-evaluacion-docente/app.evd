import {
  Check,
  Clock,
  Plus,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Card } from "@/shared/ui";

const PLAN_STEPS = [
  {
    key: "inicio",
    label: "Inicio",
    sub: "Feb 15, 2024",
    state: "done" as const,
  },
  {
    key: "medio",
    label: "Mitad de Semestre",
    sub: "Abr 20, 2024",
    state: "current" as const,
  },
  {
    key: "final",
    label: "Final de Semestre",
    sub: "Jun 30, 2024",
    state: "pending" as const,
  },
];

const PLAN_GOALS = [
  { title: "Meta 1: Actualización de Syllabus", progress: 100, done: true },
  {
    title: "Meta 2: Formación en Herramientas Digitales",
    progress: 45,
    done: false,
  },
];

function StepIcon({ state }: { state: "done" | "current" | "pending" }) {
  if (state === "done") {
    return (
      <div className='inline-flex h-11 w-11 items-center justify-center rounded-md bg-emerald-500 text-white'>
        <Check size={20} strokeWidth={2.4} />
      </div>
    );
  }
  if (state === "current") {
    return (
      <div className='inline-flex h-11 w-11 items-center justify-center rounded-md bg-brand-600 text-white ring-4 ring-brand-100'>
        <TrendingUp size={20} />
      </div>
    );
  }
  return (
    <div className='inline-flex h-11 w-11 items-center justify-center rounded-md bg-ink-100 text-ink-400'>
      <Clock size={18} />
    </div>
  );
}

export default function ImprovementPlanCard() {
  return (
    <Card className='p-5 sm:p-6'>
      <div className='mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end'>
        <div>
          <h2 className='text-[20px] font-semibold text-ink-900'>
            Plan de Mejoramiento Docente
          </h2>
          <p className='mt-1 text-[13px] text-ink-500'>
            Seguimiento de objetivos y hitos académicos para el periodo
            actual.
          </p>
        </div>
        <button
          disabled
          className='inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-ink-200 bg-white px-4 text-[13px] font-semibold text-ink-400'
        >
          <Plus size={14} strokeWidth={2} /> Crear Plan de Mejoramiento
        </button>
      </div>

      <div className='relative pt-2'>
        <div className='absolute left-[16%] right-[16%] top-8.5 h-0.5 rounded-full bg-ink-100'>
          <div
            className='h-full rounded-full bg-brand-600 transition-all duration-700'
            style={{ width: "50%" }}
          />
        </div>
        <div className='relative grid grid-cols-3 gap-3'>
          {PLAN_STEPS.map((step) => (
            <div
              key={step.key}
              className='flex flex-col items-center px-2 text-center'
            >
              <StepIcon state={step.state} />
              <div className='mt-3 text-[13px] font-semibold text-ink-900'>
                {step.label}
              </div>
              <div className='mt-0.5 text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-500'>
                {step.sub}
              </div>
              {step.state === "current" && (
                <span className='mt-2 inline-flex h-5 items-center rounded-full border border-brand-200/70 bg-brand-50 px-2 text-[10.5px] font-semibold uppercase tracking-wide text-brand-700'>
                  En Progreso
                </span>
              )}
              {step.state === "done" && (
                <span className='mt-2 inline-flex h-5 items-center rounded-full border border-emerald-200/70 bg-emerald-50 px-2 text-[10.5px] font-semibold uppercase tracking-wide text-emerald-700'>
                  Completado
                </span>
              )}
              {step.state === "pending" && (
                <span className='mt-2 inline-flex h-5 items-center rounded-full bg-ink-100 px-2 text-[10.5px] font-semibold uppercase tracking-wide text-ink-500'>
                  Pendiente
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className='mt-7 grid grid-cols-1 gap-3 md:grid-cols-2'>
        {PLAN_GOALS.map((goal) => (
          <div
            key={goal.title}
            className='rounded-lg border border-ink-200 bg-white px-4 py-4'
          >
            <div className='flex items-start gap-3'>
              <span
                className={cn(
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  goal.done
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-brand-50 text-brand-700",
                )}
              >
                {goal.done ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  <span className='h-2 w-2 rounded-full bg-brand-600' />
                )}
              </span>
              <div className='text-[13.5px] font-semibold text-ink-900'>
                {goal.title}
              </div>
            </div>
            <div className='mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100'>
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  goal.done ? "bg-emerald-500" : "bg-brand-600",
                )}
                style={{ width: `${goal.progress}%` }}
              />
            </div>
            <div className='mt-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.04em]'>
              <span className='num tabular-nums text-ink-700'>
                {goal.progress}%
              </span>
              <span
                className={goal.done ? "text-emerald-700" : "text-brand-700"}
              >
                {goal.done ? "Completado" : "En progreso"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
