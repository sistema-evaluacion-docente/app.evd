import { Trash2 } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format, QUALITATIVE, WHOLE_DIMENSION, type DraftItem } from "../lib/draft";
import type { PlanIndicators } from "../types/Plan";

type CatalogDimension = PlanIndicators["dimensions"][number];

interface ItemEditorProps {
  item: DraftItem;
  catalog: PlanIndicators | undefined;
  dimensionOptions: { value: string; label: string }[];
  currentValue: number | null;
  onChange: (key: string, patch: Partial<DraftItem>) => void;
  onSelectIndicator: (item: DraftItem, value: string) => void;
  onSelectQuestion: (item: DraftItem, value: string) => void;
  onRemove: (key: string) => void;
}

export function ItemEditor({
  item,
  catalog,
  dimensionOptions,
  currentValue,
  onChange,
  onSelectIndicator,
  onSelectQuestion,
  onRemove,
}: ItemEditorProps) {
  const dimension: CatalogDimension | undefined = catalog?.dimensions.find(
    (d) => d.dimension === item.dimension,
  );

  // "Nota general" first, then every item of the form inside the dimension.
  const questionOptions = useMemo(
    () => [
      { value: WHOLE_DIMENSION, label: "Nota general de la dimensión" },
      ...(dimension?.questions ?? []).map((question) => ({
        value: question.code,
        label: `${question.code} · ${question.text}`,
      })),
    ],
    [dimension],
  );

  const indicatorValue =
    item.target_type === "OVERALL_AVERAGE" || item.target_type === "QUALITATIVE"
      ? item.target_type
      : (item.dimension ?? "");

  const questionValue =
    item.target_type === "QUESTION" ? (item.target_ref ?? "") : WHOLE_DIMENSION;

  const measurable = item.target_type !== "QUALITATIVE";

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start gap-2">
        <Textarea
          rows={2}
          value={item.description}
          onChange={(event) =>
            onChange(item.key, { description: event.target.value, auto: false })
          }
          placeholder="Acción de mejora concreta..."
          className="min-w-0 flex-1"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(item.key)}
          aria-label="Quitar ítem"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Indicador</Label>

          <Select
            items={dimensionOptions}
            value={indicatorValue}
            onValueChange={(value) =>
              onSelectIndicator(item, (value as string) ?? QUALITATIVE)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elige el indicador..." />
            </SelectTrigger>

            <SelectContent alignItemWithTrigger={false}>
              {dimensionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {item.dimension && (
          <div className="space-y-1.5">
            <Label className="text-xs">Ítem de la dimensión</Label>

            <Select
              items={questionOptions}
              value={questionValue}
              onValueChange={(value) =>
                onSelectQuestion(item, (value as string) ?? WHOLE_DIMENSION)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent alignItemWithTrigger={false} className="w-auto">
                {questionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {measurable && (
          <div className="space-y-1.5">
            <Label className="text-xs">Meta (≥)</Label>

            <Input
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={item.target_value ?? ""}
              onChange={(event) =>
                onChange(item.key, {
                  target_value:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                })
              }
              placeholder="3.5"
            />
          </div>
        )}

        {measurable && (
          <div className="space-y-1.5">
            <Label className="text-xs">Nota actual</Label>

            <p className="num flex h-9 items-center text-[13px] font-semibold text-foreground">
              {format(currentValue)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
