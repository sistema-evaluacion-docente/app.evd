import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import type { TeacherMatrixData } from '@/features/evaluations'
import { usePeriodsStore } from '@/features/periods'
import { questions } from '@/lib/questions'

interface MatrizCardProps {
  teacherId: number
  matrix?: TeacherMatrixData
}

const QUESTION_CODES = Array.from({ length: 22 }, (_, i) => String(i + 1).padStart(3, '0'))

function scoreColor(score: number): string {
  if (score >= 4.5) return 'text-emerald-600'
  if (score >= 4.0) return 'text-green-600'
  if (score >= 3.5) return 'text-lime-600'
  if (score >= 3.0) return 'text-yellow-600'
  if (score >= 2.5) return 'text-orange-600'

  return 'text-red-600'
}

export default function MatrizCard({ matrix }: MatrizCardProps) {
  const { selectedPeriod } = usePeriodsStore()

  if (!matrix) {
    return (
      <Card className="p-5 sm:p-6">
        <Skeleton className="mb-5 h-6 w-52" />

        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz de Evaluacion</CardTitle>
      </CardHeader>

      <CardContent>
        {!matrix.courses.length ? (
          <p className="text-muted-foreground">
            {selectedPeriod
              ? 'Sin datos de evaluacion para este periodo.'
              : 'Selecciona un periodo academico.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="bg-muted sticky left-0 z-10 px-3 py-2 text-left font-semibold">
                    Materia
                  </th>

                  {QUESTION_CODES.map((code) => (
                    <th
                      key={code}
                      title={questions[code]?.question}
                      className="text-muted-foreground px-2 py-2 text-center font-medium"
                    >
                      {code}
                    </th>
                  ))}

                  <th className="px-3 py-2 text-center font-semibold">Promedio</th>
                </tr>
              </thead>

              <tbody>
                {matrix.courses.map((course) => (
                  <tr key={course.course_name} className="hover:bg-muted/50 border-b">
                    <td className="bg-background sticky left-0 z-10 px-3 py-2 font-medium whitespace-nowrap">
                      {course.course_name}
                    </td>

                    {QUESTION_CODES.map((code) => {
                      const val = course.question_averages[code]
                      return (
                        <td
                          key={code}
                          className={`px-2 py-2 text-center tabular-nums ${val != null ? scoreColor(val) : 'text-muted-foreground'}`}
                        >
                          {val != null ? val.toFixed(2) : '-'}
                        </td>
                      )
                    })}

                    <td className="px-3 py-2 text-center font-semibold tabular-nums">
                      {course.overall_average.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/60 font-semibold">
                  <td className="bg-muted sticky left-0 z-10 px-3 py-2">Promedio</td>

                  {QUESTION_CODES.map((code) => {
                    const val = matrix.column_averages[code]
                    return (
                      <td
                        key={code}
                        className={`px-2 py-2 text-center tabular-nums ${val != null ? scoreColor(val) : 'text-muted-foreground'}`}
                      >
                        {val != null ? val.toFixed(2) : '-'}
                      </td>
                    )
                  })}

                  <td className="px-3 py-2 text-center tabular-nums">
                    {matrix.column_averages &&
                      (
                        Object.values(matrix.column_averages).reduce((a, b) => a + b, 0) /
                        Object.values(matrix.column_averages).length
                      ).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
