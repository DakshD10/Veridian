import { Badge } from "@/components/ui/badge";

type RunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

const statusConfig: Record<
  RunStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  RUNNING: { label: "Running", variant: "default" },
  COMPLETED: { label: "Completed", variant: "default" },
  FAILED: { label: "Failed", variant: "destructive" },
};

export function RunStatusBadge({ status }: { status: RunStatus }) {
  const config = statusConfig[status] ?? statusConfig.PENDING;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
