import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useEffect, useRef } from "react";

import useGetPeriods from "../hooks/useGetPeriods";
import { usePeriodsStore } from "../store/periodsStore";
import type { Period } from "../types/Period";
import { Spinner } from "@/components/ui/spinner";

interface PeriodsSelectorProps {
  className?: string;
  placeholder?: string;
  label?: string;
}

function PeriodsSelector({
  className,
  placeholder,
  label,
}: PeriodsSelectorProps) {
  const { data, isLoading, isFetching } = useGetPeriods({
    page: 1,
    limit: 100,
    search: "",
  });

  const { selectedPeriod, setSelectedPeriod } = usePeriodsStore();

  const hasAutoSelected = useRef(false);

  const periods: Period[] = data?.data ?? [];

  useEffect(() => {
    if (periods.length === 0 || hasAutoSelected.current) return;

    const active = periods.find((p) => p.active) ?? periods[0];

    if (active) {
      setSelectedPeriod(active);
      hasAutoSelected.current = true;
    }
  }, [periods, setSelectedPeriod]);

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-[13px] font-medium text-ink-700">
          {label}
        </label>
      )}

      <Select
        disabled={isLoading || isFetching}
        defaultValue={selectedPeriod?.name ?? ""}
        onValueChange={(value) => {
          const period = periods.find((p) => p.id === value);

          if (period) setSelectedPeriod(period);
        }}
      >
        <SelectTrigger>
          {isLoading || isFetching ? (
            <Spinner />
          ) : (
            (selectedPeriod?.name ?? placeholder)
          )}
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            {periods?.map((p) => (
              <SelectItem value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export default PeriodsSelector;
