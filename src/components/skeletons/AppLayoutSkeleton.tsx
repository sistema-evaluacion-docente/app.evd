import { Skeleton } from '../ui/skeleton'

function AppLayoutSkeleton() {
  return (
    <div className="animate-in fade-in grid h-screen overflow-hidden duration-500">
      <main className="grid-cols-[minmax(auto,300px)_1fr] grid-rows-1 md:grid">
        <aside className="bg-card/50 flex flex-col overflow-hidden border-r">
          <div className="bg-card flex h-16 items-center justify-between border-b p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 animate-pulse rounded-full" />
              <Skeleton className="h-4 w-28 animate-pulse delay-75" />
            </div>
            <Skeleton className="h-9 w-9 animate-pulse rounded-lg delay-100" />
          </div>

          <div className="flex-1 space-y-3 px-3 pt-6">
            <div className="px-3">
              <Skeleton className="h-5 w-20 animate-pulse delay-150" />
            </div>

            <nav className="pb-4">
              <ul className="space-y-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <li
                    key={i}
                    className="bg-muted/30 flex animate-pulse items-center gap-3 rounded-lg px-3 py-2.5"
                    style={{ animationDelay: `${200 + i * 50}ms` }}
                  >
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-4 flex-1" />
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="bg-card flex h-16 items-center justify-between border-t p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 animate-pulse rounded-full delay-500" />
              <Skeleton className="h-4 w-24 animate-pulse delay-550" />
            </div>
            <Skeleton className="h-8 w-8 animate-pulse rounded-lg delay-600" />
          </div>
        </aside>

        <div className="bg-background h-[calc(100vh-53px)] overflow-y-auto">
          <header className="bg-card/80 flex h-16 items-center justify-between gap-4 border-b px-6 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-28 animate-pulse rounded-lg delay-100" />
            </div>

            <div className="max-w-2xl flex-1">
              <Skeleton className="h-10 w-full animate-pulse rounded-lg delay-150" />
            </div>

            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 animate-pulse rounded-full delay-200" />
            </div>
          </header>

          <div className="mx-auto mt-8 w-full max-w-330 space-y-8 px-6 py-8 lg:px-10">
            <div className="grid gap-6 md:grid-cols-3">
              <Skeleton className="h-32 w-full animate-pulse rounded-xl delay-250" />
              <Skeleton className="h-32 w-full animate-pulse rounded-xl delay-300" />
              <Skeleton className="hidden h-32 w-full animate-pulse rounded-xl delay-350 md:block" />
            </div>

            <div className="h-96 gap-6 overflow-hidden md:flex">
              <div className="h-full w-full space-y-4">
                <Skeleton className="h-6 w-48 animate-pulse delay-400" />
                <Skeleton className="h-[calc(100%-2rem)] w-full animate-pulse rounded-xl delay-450" />
              </div>

              <div className="h-full w-full max-w-xs space-y-4">
                <Skeleton className="h-6 w-40 animate-pulse delay-500" />
                <Skeleton className="h-1/2 w-full animate-pulse rounded-xl delay-550" />
                <Skeleton className="h-1/2 w-full animate-pulse rounded-xl delay-600" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AppLayoutSkeleton
