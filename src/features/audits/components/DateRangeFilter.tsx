import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

interface DateRangeFilterProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

function formatDisplayDate(date: Date | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeFilterProps) {
  const dateRangeLabel =
    startDate || endDate
      ? `${formatDisplayDate(startDate)}${startDate && endDate ? " - " : ""}${formatDisplayDate(endDate)}`
      : "Rango de fechas";

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        <CalendarIcon className="size-4" />

        <span className={startDate || endDate ? "" : "text-muted-foreground"}>
          {dateRangeLabel}
        </span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex flex-col gap-3 p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">Desde</p>

              <Calendar
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
                className="p-0"
              />
            </div>

            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">Hasta</p>
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                className="p-0"
              />
            </div>
          </div>

          {(startDate || endDate) && (
            <Button
              onClick={() => {
                onStartDateChange(undefined);
                onEndDateChange(undefined);
              }}
            >
              Limpiar fechas
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DateRangeFilter;
