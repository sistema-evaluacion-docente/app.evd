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
  Scale,
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
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
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
              <h1 className="text-xl font-semibold leading-tight tracking-tight sm:text-xl">
                {teacherName}
              </h1>

              <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground sm:text-sm">
                <li className="inline-flex items-center gap-2">
                  <Building2 size={14} className="text-muted-foreground" />
                  Cód. {teacher?.institutional_code ?? "—"}
                </li>

                <li className="inline-flex items-center gap-2">
                  <Clock size={14} className="text-muted-foreground" />{" "}
                  {contractType}
                </li>

                <li className="inline-flex items-center gap-2">
                  <Calendar size={14} className="text-muted-foreground" />{" "}
                  Periodo Académico: {periodLabel}
                </li>
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-muted/50 px-4 py-3">
          <div className="text-xs font-semibold uppercase leading-tight tracking-[0.08em] text-muted-foreground">
            Promedio Global
          </div>

          <div className="mt-2 flex items-baseline gap-1">
            {detailLoading || !detailFetched ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="animate-fade-in">
                <span className="num text-2xl font-semibold leading-none tabular-nums">
                  {overallAverage > 0 ? overallAverage : "—"}
                </span>

                {overallAverage > 0 && (
                  <span className="font-medium text-muted-foreground">
                    /5.0
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-lg border bg-muted/50 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Nivel de Riesgo
          </div>

          <div className="mt-3">
            {overallAverage > 0 ? (
              <span
                className={cn(
                  "inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold",
                  risk.className,
                )}
              >
                {risk.label}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Sin datos</span>
            )}
          </div>
        </div>

        <div
          className={cn(
            "col-span-2 rounded-lg border bg-muted/50 px-4 py-3 sm:col-span-1",
          )}
        >
          <div
            className={cn(
              "inline-flex items-start gap-2 text-xs font-semibold leading-snug tracking-[0.04em]",
            )}
          >
            <span
              className={cn(
                "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
              )}
            >
              <Check size={10} strokeWidth={3} />
            </span>

            <span className="uppercase">
              Bajo desempeño recurrente:{" "}
              {recurrentLowPerformance ? "Detectado" : "No detectado"}
            </span>
          </div>

          <div className={cn("mt-2 text-xs")}>
            * Basado en últimos 4 periodos
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/matrix/${teacherId}`}>
          <Button>
            <FileText size={15} /> Ver Reporte Detallado
          </Button>
        </Link>

        <Link href={`/teachers/${teacherId}/comparison`}>
          <Button variant="outline">
            <Scale size={15} /> Comparar semestres
          </Button>
        </Link>

        <Button variant="outline">
          <Mail size={15} /> Enviar Citación
        </Button>
      </div>
    </Card>
  );
}
