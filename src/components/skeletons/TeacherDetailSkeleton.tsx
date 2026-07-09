import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function TeacherDetailSkeleton() {
  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-full" />

          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-7 w-56" />

            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-40" />
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border px-4 py-3">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="mt-2 h-8 w-20" />
          </div>

          <div className="rounded-lg border px-4 py-3">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="mt-3 h-7 w-24 rounded-full" />
          </div>

          <div className="col-span-2 rounded-lg border px-4 py-3 sm:col-span-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="mt-2 h-2.5 w-36" />
          </div>
        </div>

        <Separator className="my-5" />

        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-56 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="h-full p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>

          <ul>
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center justify-between py-3.5">
                <Skeleton className="h-3 w-44" />
                <Skeleton className="h-6 w-14" />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="h-full p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <ul>
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex items-center justify-between py-3.5">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
                <Skeleton className="h-6 w-14" />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="border-b px-5 pb-3 sm:px-6">
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
        </div>
        <ul>
          {[1, 2, 3].map((i) => (
            <li key={i} className="px-5 py-4 sm:px-6">
              <Skeleton className="h-4 w-full max-w-180" />
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="mb-1 flex items-start justify-between">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-3 w-44" />
        <Skeleton className="mt-4 h-40 w-full" />
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3.5 w-72" />
          </div>
          <Skeleton className="h-10 w-52 rounded-md" />
        </div>

        <div className="relative pt-2">
          <div className="absolute left-[16%] right-[16%] top-8.5 h-0.5 rounded-full bg-ink-100" />
          <div className="relative grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col items-center px-2 text-center"
              >
                <Skeleton className="h-11 w-11 rounded-md" />
                <Skeleton className="mt-3 h-3.5 w-20" />
                <Skeleton className="mt-0.5 h-2.5 w-16" />
                <Skeleton className="mt-2 h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg border px-4 py-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
              <div className="mt-2 flex items-center justify-between">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default TeacherDetailSkeleton;
