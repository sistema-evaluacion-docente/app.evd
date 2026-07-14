import { ShieldCheck } from 'lucide-react'

/** Black pill marking a Super Admin–only screen. */
export function AdminViewBadge() {
  return (
    <div className="inline-flex h-6 items-center gap-2 rounded-full bg-ink-900 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-50">
      <ShieldCheck size={12} strokeWidth={2.25} />
      Vista Super Admin
    </div>
  )
}
