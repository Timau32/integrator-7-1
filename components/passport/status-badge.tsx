import { CircleCheck, CircleDashed, CircleSlash, Loader } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { STAGE_STATUS_LABEL } from "@/lib/domain/status";
import type { StageStatus } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const STATUS_ICON = {
  pending: CircleDashed,
  in_progress: Loader,
  completed: CircleCheck,
  blocked: CircleSlash,
} as const satisfies Record<StageStatus, React.ElementType>;

interface StatusBadgeProps {
  status: StageStatus;
  className?: string;
}

/** Бейдж статуса этапа: цвет и иконка закреплены за статусом. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const Icon = STATUS_ICON[status];

  return (
    <Badge
      variant={status}
      className={cn("gap-1.5 px-2 py-1", className)}
      data-testid={`status-badge-${status}`}
    >
      <Icon aria-hidden className={status === "in_progress" ? "animate-spin [animation-duration:3s]" : undefined} />
      {STAGE_STATUS_LABEL[status]}
    </Badge>
  );
}
