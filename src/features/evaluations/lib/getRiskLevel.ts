export function getRiskLevel(avg: number) {
  if (avg >= 4.0)
    return {
      label: "NORMAL",
      className: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
    };
  if (avg >= 3.5)
    return {
      label: "SEGUIMIENTO",
      className: "border-amber-200/70 bg-amber-50 text-amber-700",
    };
  return {
    label: "PLAN ACTIVO",
    className: "border-red-200/70 bg-red-50 text-red-700",
  };
}
