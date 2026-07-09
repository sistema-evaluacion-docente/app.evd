import { Skeleton } from "../ui/skeleton";

function AppLayoutSkeleton() {
  return (
    <div className="h-screen overflow-hidden grid animate-in fade-in duration-300">
      {/* Main content with sidebar */}
      <main className="md:grid grid-cols-[minmax(auto,300px)_1fr] grid-rows-1">
        {/* LeftBar Skeleton */}
        <aside className="border-r space-y-2 flex flex-col overflow-hidden">
          {/* Header aside */}
          <div className="p-4 h-16 bg-card border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-9 w-9" />
          </div>

          <div className="flex-1 space-y-2 pt-4">
            {/* Navigation label */}
            <div className="px-2">
              <Skeleton className="h-6 w-24 bg-background" />
            </div>

            {/* Navigation items */}
            <nav className="pb-4 px-2">
              <ul className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i} className="flex gap-1 items-center px-4 py-2">
                    <Skeleton className="h-8 w-10 bg-background" />
                    <Skeleton className="h-8 w-full bg-background" />
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* User section at bottom */}
          <div className="p-4 h-16 bg-card border-t flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-9 w-9" />
          </div>
        </aside>

        {/* Main content area */}
        <div className="h-[calc(100vh-53px)] overflow-y-auto">
          {/* Header Skeleton */}
          <header className="flex h-16 gap-4 justify-between items-center py-2 px-4 border-b bg-card">
            {/* Logo section */}
            <div className="flex gap-2 items-center">
              <Skeleton className="h-10 w-32" />
            </div>

            {/* Search bar */}
            <div className="flex-1 max-w-2xl">
              <Skeleton className="h-10 w-full rounded" />
            </div>

            {/* Theme switcher */}
            <div className="flex gap-4 items-center">
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </header>

          <div className="w-full mx-auto space-y-6 max-w-330 mt-10 px-4 py-6 lg:px-8 lg:py-8">
            <div className="grid md:grid-cols-3 gap-6">
              <Skeleton className="h-30 w-full" />
              <Skeleton className="h-30 w-full" />
            </div>

            <div className="md:flex h-90 gap-6 overflow-hidden">
              <div className="h-full w-full">
                <Skeleton className="h-6 w-52 mb-4" />
                <Skeleton className="h-full w-full" />
              </div>

              <div className="w-full max-w-xs h-full space-y-4">
                <Skeleton className="h-6 w-52" />

                <Skeleton className="h-1/2 w-full" />
                <Skeleton className="h-1/2 w-full" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AppLayoutSkeleton;
