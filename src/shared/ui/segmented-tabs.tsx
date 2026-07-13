import { Card } from './card'
import { cn } from '@/shared/lib/utils'

export interface SegmentedTab {
  value: string
  label: string
  description: string
}

export interface SegmentedTabsProps {
  value: string
  onChange: (value: string) => void
  tabs: SegmentedTab[]
}

/** Two-up card tab selector with a label + helper description per tab. */
export function SegmentedTabs({ value, onChange, tabs }: SegmentedTabsProps) {
  return (
    <Card className="p-1.5">
      <div className="grid grid-cols-2 gap-1">
        {tabs.map((tab) => {
          const active = tab.value === value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={cn(
                'rounded-md px-4 py-3 text-left transition-colors',
                active
                  ? 'bg-ink-900 text-ink-50 shadow-card'
                  : 'text-ink-700 hover:bg-ink-50',
              )}
            >
              <div className="text-[13.5px] font-semibold">{tab.label}</div>
              <div
                className={cn(
                  'mt-0.5 text-[11.5px]',
                  active ? 'text-ink-50/70' : 'text-ink-500',
                )}
              >
                {tab.description}
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
