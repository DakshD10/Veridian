interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
      case "PASS":
        return "bg-green-950/60 text-green-500 border-green-900";
      case "RUNNING":
        return "bg-violet-950/60 text-violet-400 border-violet-900";
      case "PENDING":
        return "bg-[#1F1F23] text-[#71717A] border-[#27272A]";
      case "FAILED":
      case "FAIL":
        return "bg-red-950/60 text-red-500 border-red-900";
      default:
        return "bg-[#1F1F23] text-[#71717A] border-[#27272A]";
    }
  };

  const isRunning = status.toUpperCase() === "RUNNING";

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-0.75 rounded border text-[12px] font-mono ${getStatusStyles(status)}`}>
      {isRunning && (
        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {status}
    </div>
  );
}
