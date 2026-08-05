import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'wouter'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useAcademicPeriodsStore, useGetAcademicPeriods } from '@/features/periods'
import { cn } from '@/lib/utils'

export interface PeriodSelectOption {
  id: number
  name: string
  code: string
}

interface PeriodSelectProps {
  options?: PeriodSelectOption[]
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  placeholder?: string
  ariaLabel?: string
  className?: string
  disabled?: boolean
  size?: 'sm' | 'default'
  searchParam?: string
}

export function PeriodSelect({
  options: externalOptions,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Selecciona un periodo',
  ariaLabel = 'Periodo académico',
  className,
  disabled = false,
  size = 'default',
  searchParam,
}: PeriodSelectProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: periodsData, isLoading } = useGetAcademicPeriods()
  const setPeriods = useAcademicPeriodsStore((s) => s.setPeriods)
  const cachedPeriods = useAcademicPeriodsStore((s) => s.periods)

  useEffect(() => {
    if (periodsData?.data && periodsData.data.length > 0) {
      setPeriods(periodsData.data)
    }
  }, [periodsData, setPeriods])

  const options = (externalOptions ?? periodsData?.data ?? cachedPeriods ?? []).sort((a, b) =>
    b.name.localeCompare(a.name),
  )

  const isUrlMode = searchParam !== undefined

  const urlId = useMemo(() => {
    if (!isUrlMode) return undefined

    const raw = searchParams.get(searchParam)

    if (!raw) return undefined

    return options.find((o) => o.name === raw)?.id
  }, [searchParams, searchParam, options, isUrlMode])

  const selectedId = isUrlMode
    ? (urlId ?? defaultValue ?? options[0]?.id)
    : (value ?? defaultValue ?? options[0]?.id)

  useEffect(() => {
    if (isUrlMode && !urlId && selectedId) {
      const name = options.find((o) => o.id === selectedId)?.name

      if (name) {
        setSearchParams({ [searchParam]: name }, { replace: true })
        console.log('Setting search param:', searchParam, name)
        onValueChange?.(selectedId)
      }
    }
  }, [isUrlMode, urlId, selectedId, options, searchParam, setSearchParams, onValueChange])

  useEffect(() => {
    if (isUrlMode && value === undefined && urlId !== undefined) {
      onValueChange?.(urlId)
    }
  }, [isUrlMode, value, urlId, selectedId, onValueChange])

  const handleChange = (id: number) => {
    if (isUrlMode) {
      const name = options.find((o) => o.id === id)?.name

      if (name) {
        setSearchParams({ [searchParam]: name }, { replace: true })
      }
    }
    onValueChange?.(id)
  }

  if (isLoading && !externalOptions) {
    return <Spinner className={cn('size-5', className)} />
  }

  return (
    <Select
      value={selectedId}
      onValueChange={(val) => handleChange(val as number)}
      disabled={disabled}
    >
      <SelectTrigger aria-label={ariaLabel} size={size} className={cn('w-fit', className)}>
        <SelectValue placeholder={placeholder}>
          {selectedId
            ? options.find((p) => p.id === selectedId)?.name ||
              options.find((p) => p.id === selectedId)?.code
            : undefined}
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {options.map((period) => (
          <SelectItem key={period.id} value={period.id}>
            {period.name || period.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
