interface StatusBadgeProps {
  status: "complete" | "partial" | "missing";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    complete: "bg-green-100 text-green-800",
    partial: "bg-yellow-100 text-yellow-800",
    missing: "bg-red-100 text-red-800",
  };

  const labels = {
    complete: "Complete",
    partial: "Partial",
    missing: "Missing",
  };

  return (
    <span
      class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
