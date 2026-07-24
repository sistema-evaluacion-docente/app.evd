import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { useEffect } from 'react'

import { Spinner } from '@/components/ui/spinner'
import useGetPeriods from '../hooks/useGetPeriods'
import { usePeriodsStore } from '../store/periodsStore'
import type { Period } from '../types/Period'

interface PeriodsSelectorProps {
  className?: string
  placeholder?: string
  label?: string
}

/**
 * A component to select an academic period.
 *
 * @param {PeriodsSelectorProps} props - The properties for the component.
 * @returns {JSX.Element} The rendered component.
 */
function PeriodsSelector({ className, placeholder, label }: PeriodsSelectorProps) {
  const { data, isLoading, isFetching } = useGetPeriods({
    page: 1,
    limit: 100,
    search: '',
  })

  const { selectedPeriod, setSelectedPeriod } = usePeriodsStore()

  const periods: Period[] = (data?.data ?? []).filter((p) => p.active)

  useEffect(() => {
    if (periods.length === 0) return
    const isSelectedActive = periods.some((p) => p.id === selectedPeriod?.id)
    if (!isSelectedActive) {
      setSelectedPeriod(periods[0])
    }
  }, [periods, selectedPeriod, setSelectedPeriod])

  return (
    <div className={className}>
      {label && (
        <label className="text-muted-foreground mb-1 block text-[13px] font-medium">{label}</label>
      )}

      {/* Controlled: the store picks a period asynchronously, so a `defaultValue`
          would be read once (empty) and then change, which Base UI warns about.
          It also has to be the id — that is what the items carry, not the name. */}
      <Select
        disabled={isLoading || isFetching}
        value={selectedPeriod?.id ?? ''}
        onValueChange={(value) => {
          const period = periods.find((p) => p.id === value)

          if (period) setSelectedPeriod(period)
        }}
      >
        <SelectTrigger className="w-full max-w-xs">
          {isLoading || isFetching ? <Spinner /> : (selectedPeriod?.name ?? placeholder)}
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            {periods?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export default PeriodsSelector
