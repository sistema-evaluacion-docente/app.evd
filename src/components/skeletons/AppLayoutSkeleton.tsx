import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Menu label widths, so the sidebar reads as a list of words, not of blocks. */
const MENU_WIDTHS = ['w-24', 'w-20', 'w-28', 'w-16', 'w-24']

/** Line widths of the fake table rows. */
const ROW_WIDTHS = ['w-40', 'w-32', 'w-44', 'w-28', 'w-36']

/**
 * Loading placeholder for the whole app shell, shown while the session is
 * resolving. Mirrors the real chrome — offcanvas sidebar, sticky header and
 * the centered content column — so the layout doesn't jump once `AppLayout`
 * takes over, and reveals its regions in a staggered wave.
 *
 * @example
 * if (isLoading) return <AppLayoutSkeleton />
 */
function AppLayoutSkeleton() {
  return (
    <div className="flex h-dvh overflow-hidden" role="status" aria-busy="true">
      <span className="sr-only">Cargando la aplicación…</span>

      <aside className="bg-sidebar hidden w-64 shrink-0 flex-col border-r md:flex">
        <div className="flex items-center gap-2.5 p-2">
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <Skeleton className="h-3.5 w-36" />
        </div>

        <div className="flex-1 px-2 py-2">
          <Skeleton className="mx-2 h-2.5 w-24" />

          <ul className="mt-3 space-y-1">
            {MENU_WIDTHS.map((width, index) => (
              <li
                key={index}
                className="flex h-8 items-center gap-2 rounded-md px-2"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <Skeleton className="size-4 shrink-0 rounded-sm" />
                <Skeleton className={cn('h-3', width)} />
              </li>
            ))}
          </ul>
        </div>

        <div className="p-2">
          <div className="flex h-8 items-center gap-2 px-2">
            <Skeleton className="size-4 shrink-0 rounded-sm" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background flex h-17 shrink-0 items-center border-b">
          <div className="flex h-full w-full items-center gap-3 px-4 lg:px-8">
            <Skeleton className="size-9 shrink-0 rounded-md" />

            <div className="hidden items-center gap-2 sm:flex">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="size-1.5 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>

            <div className="ml-auto flex items-center gap-3">
              <Skeleton className="hidden h-9 w-65 rounded-md md:block" />
              <Skeleton className="size-9 shrink-0 rounded-full" />
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 lg:px-8 lg:py-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-9 w-36 rounded-md" />
            </div>

            <div
              className="border-border bg-background rounded-md border"
              style={{ animationDelay: '80ms' }}
            >
              <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                <Skeleton className="h-9 w-64 rounded-md" />
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>

              <div className="divide-border divide-y">
                {ROW_WIDTHS.map((width, index) => (
                  <div key={index} className="flex items-center gap-4 px-4 py-3.5">
                    <Skeleton className="size-8 shrink-0 rounded-full" />

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className={cn('h-3.5', width)} />
                      <Skeleton className="h-2.5 w-20" />
                    </div>

                    <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
                    <Skeleton className="h-3.5 w-10 shrink-0" />
                  </div>
                ))}
              </div>

              <div className="border-border flex items-center justify-between border-t px-4 py-3">
                <Skeleton className="h-3 w-40" />

                <div className="flex items-center gap-2">
                  <Skeleton className="size-8 rounded-md" />
                  <Skeleton className="size-8 rounded-md" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AppLayoutSkeleton
