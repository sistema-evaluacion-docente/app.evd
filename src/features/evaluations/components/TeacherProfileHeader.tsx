import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Building2,
  Calendar,
  Check,
  Clock,
  FileText,
  Mail,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";

import type { EvaluationRecord } from "@/features/evaluations";
import { useGetTeacherEvaluationDetail } from "@/features/evaluations";
import { usePeriodsStore } from "@/features/periods";
import { useGetTeacherById, useGetTeacherHistory } from "@/features/teachers";
import { getRiskLevel } from "../lib/getRiskLevel";

interface TeacherProfileHeaderProps {
  teacherId: number;
  evaluation?: EvaluationRecord;
}

export default function TeacherProfileHeader({
  teacherId,
  evaluation,
}: TeacherProfileHeaderProps) {
  const { selectedPeriod } = usePeriodsStore();

  const {
    data: teacherRes,
    isLoading: teacherLoading,
    isFetched: teacherFetched,
  } = useGetTeacherById(teacherId);
  const teacher = teacherRes?.data;

  const {
    data: detailRes,
    isLoading: detailLoading,
    isFetched: detailFetched,
  } = useGetTeacherEvaluationDetail(evaluation?.id, teacherId);
  const detail = detailRes?.data;

  const { data: historyRes } = useGetTeacherHistory(teacherId);
  const history = useMemo(() => historyRes?.data?.history ?? [], [historyRes]);

  const recurrentLowPerformance = useMemo(() => {
    const last4 = history.slice(-4);
    return last4.length === 4 && last4.every((h) => h.overall_average < 3.5);
  }, [history]);

  const teacherName = detail?.name ?? teacher?.user?.name ?? "—";
  const contractType = detail?.contract_type ?? teacher?.contract_type ?? "—";
  const periodLabel = detail?.period_name ?? selectedPeriod?.name ?? "—";
  const overallAverage = detail?.overall_average ?? 0;
  const risk = getRiskLevel(overallAverage);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <Avatar>
            <AvatarFallback>
              {teacherName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>

            <AvatarImage
              src={teacher?.user?.avatar_url ?? ""}
              alt={teacherName}
            />
          </Avatar>

          {teacher?.active && (
            <span className="absolute -bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {teacherLoading || !teacherFetched ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-56" />

              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-40" />
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink-900 sm:text-[28px]">
                {teacherName}
              </h1>

              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13.5px] text-ink-600">
                <li className="inline-flex items-center gap-2">
                  <Building2 size={14} className="text-ink-400" />
                  Cód. {teacher?.institutional_code ?? "—"}
                </li>

                <li className="inline-flex items-center gap-2">
                  <Clock size={14} className="text-ink-400" /> {contractType}
                </li>

                <li className="inline-flex items-center gap-2">
                  <Calendar size={14} className="text-ink-400" /> Periodo
                  Académico: {periodLabel}
                </li>
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-ink-200 bg-ink-50/40 px-4 py-3">
          <div className="text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] text-ink-500">
            Promedio Global
          </div>

          <div className="mt-2 flex items-baseline gap-1">
            {detailLoading || !detailFetched ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="animate-fade-in">
                <span className="num text-[32px] font-semibold leading-none tabular-nums text-ink-900">
                  {overallAverage > 0 ? overallAverage : "—"}
                </span>

                {overallAverage > 0 && (
                  <span className="text-[14px] font-medium text-ink-500">
                    /5.0
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-lg border border-ink-200 px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
            Nivel de Riesgo
          </div>

          <div className="mt-3">
            {overallAverage > 0 ? (
              <span
                className={cn(
                  "inline-flex h-7 items-center rounded-full border px-3 text-[12px] font-semibold",
                  risk.className,
                )}
              >
                {risk.label}
              </span>
            ) : (
              <span className="text-[12px] text-ink-400">Sin datos</span>
            )}
          </div>
        </div>

        <div
          className={cn(
            "col-span-2 rounded-lg border px-4 py-3 sm:col-span-1",
            recurrentLowPerformance
              ? "border-red-200/70 bg-red-50/50"
              : "border-emerald-200/70 bg-emerald-50/50",
          )}
        >
          <div
            className={cn(
              "inline-flex items-start gap-2 text-[11px] font-semibold leading-snug tracking-[0.04em]",
              recurrentLowPerformance ? "text-red-700" : "text-emerald-700",
            )}
          >
            <span
              className={cn(
                "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                recurrentLowPerformance
                  ? "bg-red-100 text-red-700"
                  : "bg-emerald-100 text-emerald-700",
              )}
            >
              <Check size={10} strokeWidth={3} />
            </span>

            <span className="uppercase">
              Bajo desempeño recurrente:{" "}
              {recurrentLowPerformance ? "Detectado" : "No detectado"}
            </span>
          </div>

          <div
            className={cn(
              "mt-2 text-[10.5px]",
              recurrentLowPerformance
                ? "text-red-700/70"
                : "text-emerald-700/70",
            )}
          >
            * Basado en últimos 4 periodos
          </div>
        </div>
      </div>

      {/* <Separator className="my-5" /> */}

      <div className="flex flex-wrap gap-2">
        <Link href={`/matrix/${teacherId}`}>
          <Button size="lg">
            <FileText size={15} /> Ver Reporte Detallado Del docente
          </Button>
        </Link>

        <Button variant="outline" size="lg">
          <Mail size={15} /> Enviar Citación
        </Button>
      </div>
    </Card>
  );
}
