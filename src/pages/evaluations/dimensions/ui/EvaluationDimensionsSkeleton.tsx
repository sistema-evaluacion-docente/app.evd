import { Card } from "@/components/ui/card";

function EvaluationDimensionsSkeleton() {
  return (
    <>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="h-7 w-64 animate-pulse rounded bg-ink-100" />
          <div className="mt-2 h-3.5 w-36 animate-pulse rounded bg-ink-100" />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-ink-100" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-ink-100" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between">
              <div className="h-2.5 w-24 animate-pulse rounded bg-ink-100" />
              <div className="h-4 w-4 animate-pulse rounded bg-ink-100" />
            </div>

            <div className="mt-3 h-7 w-16 animate-pulse rounded bg-ink-100" />
            <div className="mt-2.5 h-3 w-10 animate-pulse rounded bg-ink-100" />
          </Card>
        ))}
      </div>

      <div className="space-y-5">
        {[1, 2, 3].map((dimIdx) => (
          <div key={dimIdx}>
            <div className="bg-background border rounded-lg p-4 mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="h-5 w-48 animate-pulse rounded bg-ink-100" />
                <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-ink-100" />
              </div>

              <div className="flex items-center gap-2">
                <div className="h-4 w-10 animate-pulse rounded bg-ink-100" />
                <div className="h-1.5 w-20 animate-pulse rounded-full bg-ink-100" />
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-ink-200">
              <table className="w-full text-left">
                <thead className="bg-ink-50">
                  <tr>
                    <th className="px-4 py-2.5">
                      <div className="h-2.5 w-12 animate-pulse rounded bg-ink-200" />
                    </th>

                    <th className="px-4 py-2.5">
                      <div className="h-2.5 w-20 animate-pulse rounded bg-ink-200" />
                    </th>

                    <th className="px-4 py-2.5 text-right">
                      <div className="ml-auto h-2.5 w-12 animate-pulse rounded bg-ink-200" />
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-ink-100 bg-white">
                  {[1, 2, 3].map((rowIdx) => (
                    <tr key={rowIdx}>
                      <td className="px-4 py-3">
                        <div className="h-3.5 w-14 animate-pulse rounded bg-ink-100" />
                      </td>

                      <td className="px-4 py-3">
                        <div className="h-3.5 w-full max-w-sm animate-pulse rounded bg-ink-100" />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="ml-auto h-4 w-12 animate-pulse rounded bg-ink-100" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default EvaluationDimensionsSkeleton;
