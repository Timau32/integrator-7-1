import { STAGE_STATUSES } from "./status";
import type { Stage, StageStatus } from "./types";

/** Сводка по этапам объекта. */
export interface StagesSummary {
  total: number;
  byStatus: Record<StageStatus, number>;
  /** Доля завершённых этапов, 0…100, округлённая до целого процента. */
  completionPercent: number;
  /** Есть ли заблокированные этапы — объект требует внимания менеджера. */
  hasBlockers: boolean;
}

/** Считает распределение этапов по статусам и процент готовности объекта. */
export function summarizeStages(stages: readonly Stage[]): StagesSummary {
  const byStatus = Object.fromEntries(
    STAGE_STATUSES.map((status) => [status, 0]),
  ) as Record<StageStatus, number>;

  for (const stage of stages) {
    byStatus[stage.status] += 1;
  }

  const total = stages.length;
  const completionPercent =
    total === 0 ? 0 : Math.round((byStatus.completed / total) * 100);

  return {
    total,
    byStatus,
    completionPercent,
    hasBlockers: byStatus.blocked > 0,
  };
}
