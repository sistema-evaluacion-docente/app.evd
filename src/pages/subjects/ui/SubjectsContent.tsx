import { cn } from "@/lib/utils";
import { useGetSubjects } from "@/features/subjects";
import { PageHeader } from "@/shared/ui";
import { ArrowDown, ArrowUp, BookOpen, Minus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

function scoreTextColor(score: number) {
  if (score >= 4.0) return "text-emerald-600";
  if (score >= 3.5) return "text-amber-600";
  return "text-red-600";
}

function scoreBarColor(score: number) {
  if (score >= 4.0) return "bg-emerald-500";
  if (score >= 3.5) return "bg-amber-500";
  return "bg-red-500";
}

function ScoreCell({ score }: { score: number }) {
  return (
    <div className='flex min-w-18 flex-col gap-1'>
      <span
        className={cn(
          "text-[14px] font-semibold tabular-nums",
          scoreTextColor(score),
        )}
      >
        {score.toFixed(2)}
      </span>
      <div className='h-0.75 overflow-hidden rounded-full bg-muted'>
        <div
          className={cn("h-full rounded-full", scoreBarColor(score))}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

function TrendCell({
  current,
  prev,
}: {
  current: number;
  prev: number | null;
}) {
  if (prev === null) return <span className='text-[12px] text-muted-foreground'>—</span>;
  const delta = current - prev;
  if (Math.abs(delta) <= 0.02)
    return (
      <span className='flex items-center gap-1 text-[12px] text-muted-foreground tabular-nums'>
        <Minus size={11} /> 0.00
      </span>
    );
  if (delta > 0)
    return (
      <span className='flex items-center gap-1 text-[12px] text-emerald-600 tabular-nums'>
        <ArrowUp size={11} /> +{Math.abs(delta).toFixed(2)}
      </span>
    );
  return (
    <span className='flex items-center gap-1 text-[12px] text-red-600 tabular-nums'>
      <ArrowDown size={11} /> -{Math.abs(delta).toFixed(2)}
    </span>
  );
}

function DiagnosisBadge({ avg }: { avg: number }) {
  if (avg < 3.5)
    return (
      <span className='inline-flex rounded px-2 py-0.5 text-[11px] font-medium bg-red-50 text-red-700'>
        Materia en riesgo
      </span>
    );
  if (avg < 4.0)
    return (
      <span className='inline-flex rounded px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700'>
        En seguimiento
      </span>
    );
  return (
    <span className='inline-flex rounded px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700'>
      Buen desempeño
    </span>
  );
}

type SortKey = "asc" | "desc" | "code" | "name";

function SubjectsContent() {
  const { data, isLoading } = useGetSubjects();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("asc");

  const all = data?.data ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = q
      ? all.filter(
          (s) =>
            s.course_name.toLowerCase().includes(q) ||
            s.course_code.toLowerCase().includes(q),
        )
      : [...all];

    switch (sort) {
      case "asc":
        list.sort((a, b) => a.overall_average - b.overall_average);
        break;
      case "desc":
        list.sort((a, b) => b.overall_average - a.overall_average);
        break;
      case "code":
        list.sort((a, b) => a.course_code.localeCompare(b.course_code));
        break;
      case "name":
        list.sort((a, b) => a.course_name.localeCompare(b.course_name));
        break;
    }
    return list;
  }, [all, search, sort]);

  const atRisk = filtered.filter((s) => s.overall_average < 3.5).length;
  const attention = filtered.filter(
    (s) => s.overall_average >= 3.5 && s.overall_average < 4.0,
  ).length;
  const good = filtered.filter((s) => s.overall_average >= 4.0).length;
  const globalAvg = filtered.length
    ? filtered.reduce((a, s) => a + s.overall_average, 0) / filtered.length
    : 0;

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "asc", label: "Menor promedio" },
    { key: "desc", label: "Mayor promedio" },
    { key: "code", label: "Código" },
    { key: "name", label: "Nombre" },
  ];

  return (
    <>
      <PageHeader title='Materias' />

      {/* Summary chips */}
      <div className='flex flex-wrap gap-3'>
        {[
          {
            label: "Materias",
            value: filtered.length,
            color: "text-brand-600",
          },
          { label: "En riesgo (<3.5)", value: atRisk, color: "text-red-600" },
          { label: "En atención", value: attention, color: "text-amber-600" },
          { label: "Buen promedio", value: good, color: "text-emerald-600" },
          {
            label: "Promedio global",
            value: isLoading ? "—" : globalAvg.toFixed(2),
            color: scoreTextColor(globalAvg),
          },
        ].map((chip) => (
          <div
            key={chip.label}
            className='flex flex-col gap-0.5 rounded-md border border-border bg-card px-4 py-2.5 shadow-sm'
          >
            <span
              className={cn(
                "text-[20px] font-semibold tabular-nums leading-none",
                chip.color,
              )}
            >
              {chip.value}
            </span>
            <span className='text-[11px] uppercase tracking-wide text-muted-foreground'>
              {chip.label}
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className='flex flex-wrap items-center gap-2'>
        <div className='flex min-w-45 max-w-65 flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 shadow-sm'>
          <Search size={14} className='shrink-0 text-muted-foreground' />
          <input
            type='text'
            placeholder='Buscar por nombre o código...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground'
          />
        </div>

        <div className='flex items-center gap-1.5'>
          <span className='text-[11px] uppercase tracking-wide text-muted-foreground'>
            Ordenar:
          </span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={cn(
                "rounded border px-2.5 py-1 text-[12px] transition-colors",
                sort === opt.key
                  ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
                  : "border-border bg-card text-muted-foreground hover:border-brand-400 hover:text-brand-600",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className='overflow-hidden rounded-lg border border-border bg-card shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-205 border-collapse'>
            <thead className='bg-muted'>
              <tr>
                {[
                  "Código",
                  "Materia",
                  "Docentes",
                  "Grupos",
                  "Promedio",
                  "Tendencia",
                  "Dim. más débil",
                  "Diagnóstico",
                ].map((h) => (
                  <th
                    key={h}
                    className='border-b border-border px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className='divide-y divide-border'>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className='px-4 py-3'>
                        <div className='h-4 animate-pulse rounded bg-muted' />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className='px-4 py-12 text-center text-[13px] text-muted-foreground'
                  >
                    <div className='flex flex-col items-center gap-3'>
                      <BookOpen size={28} className='opacity-30' />
                      Sin resultados para los filtros seleccionados
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((subject) => (
                  <tr
                    key={subject.course_id}
                    className='cursor-pointer transition-colors hover:bg-muted/70'
                  >
                    <td className='px-4 py-3'>
                      <Link href={`/subjects/${subject.course_id}`}>
                        <span className='font-mono text-[14px] font-medium text-muted-foreground'>
                          {subject.course_code}
                        </span>
                      </Link>
                    </td>

                    <td className='px-4 py-3'>
                      <Link href={`/subjects/${subject.course_id}`}>
                        <div>
                          <p className='text-[13.5px] font-medium text-foreground hover:text-brand-600'>
                            {subject.course_name}
                          </p>
                          <p className='text-[11px] text-muted-foreground'>
                            {subject.department_name}
                          </p>
                        </div>
                      </Link>
                    </td>

                    <td className='px-4 py-3 text-center'>
                      <span className='text-[13px] tabular-nums text-muted-foreground'>
                        {subject.teacher_count}
                      </span>
                    </td>

                    <td className='px-4 py-3 text-center'>
                      <span className='text-[13px] tabular-nums text-muted-foreground'>
                        {subject.group_count}
                      </span>
                    </td>

                    <td className='px-4 py-3'>
                      <ScoreCell score={subject.overall_average} />
                    </td>

                    <td className='px-4 py-3'>
                      <TrendCell
                        current={subject.overall_average}
                        prev={subject.previous_overall_average}
                      />
                    </td>

                    <td className='px-4 py-3'>
                      <span className='inline-block max-w-40 truncate rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground'>
                        {subject.weakest_dimension}
                      </span>
                    </td>

                    <td className='px-4 py-3'>
                      <DiagnosisBadge avg={subject.overall_average} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default SubjectsContent;
