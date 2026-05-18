import { cn } from '@/shared/lib/utils'

export interface ToggleSwitchProps {
  value: boolean
  onChange: (value: boolean) => void
  label: string
}

/** shadcn-style on/off switch. */
export function ToggleSwitch({ value, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
        value ? 'bg-ink-900' : 'bg-ink-200',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          value ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
