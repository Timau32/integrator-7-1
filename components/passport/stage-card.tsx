"use client";

import { CalendarRange, ChevronDown, HardHat, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/passport/status-badge";
import { Button } from "@/components/ui/button";
import { STAGE_STATUS_LABEL } from "@/lib/domain/status";
import type { Stage } from "@/lib/domain/types";
import { formatDate, formatDateTime, pluralize } from "@/lib/format";

interface StageCardProps {
  stage: Stage;
  index: number;
  onChangeStatus: (stage: Stage) => void;
}

/** Карточка этапа: плановые и фактические даты, статус и журнал переходов. */
export function StageCard({ stage, index, onChangeStatus }: StageCardProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const hasHistory = stage.history.length > 0;

  return (
    <li
      data-testid="stage-card"
      data-stage-id={stage.id}
      data-status={stage.status}
      className="bg-card rounded-xl border p-4 shadow-xs"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground tabular text-xs font-medium">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-base font-semibold">{stage.title}</h3>
          </div>
          {stage.assignee && (
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <HardHat aria-hidden className="size-4" />
              {stage.assignee}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={stage.status} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChangeStatus(stage)}
            aria-label={`Изменить статус этапа «${stage.title}», сейчас ${STAGE_STATUS_LABEL[stage.status]}`}
          >
            Изменить статус
          </Button>
        </div>
      </div>

      <dl className="text-muted-foreground mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <CalendarRange aria-hidden className="size-4 shrink-0" />
          <dt>План:</dt>
          <dd className="text-foreground tabular">
            {formatDate(stage.plannedStart)} — {formatDate(stage.plannedEnd)}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <CalendarRange aria-hidden className="size-4 shrink-0 opacity-0" />
          <dt>Факт:</dt>
          <dd className="text-foreground tabular">
            {formatDate(stage.actualStart)} — {formatDate(stage.actualEnd)}
          </dd>
        </div>
      </dl>

      {stage.status === "blocked" && stage.blockReason && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{stage.blockReason}</span>
        </p>
      )}

      {hasHistory && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setHistoryOpen((open) => !open)}
            aria-expanded={historyOpen}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
          >
            <ChevronDown
              aria-hidden
              className={`size-4 transition-transform ${historyOpen ? "rotate-180" : ""}`}
            />
            {stage.history.length}{" "}
            {pluralize(stage.history.length, [
              "переход",
              "перехода",
              "переходов",
            ])}
          </button>

          {historyOpen && (
            <ol className="border-border mt-2 space-y-2 border-l pl-4">
              {stage.history.map((change) => (
                <li key={change.id} className="text-sm">
                  <span className="text-muted-foreground tabular">
                    {formatDateTime(change.at)}
                  </span>{" "}
                  — {STAGE_STATUS_LABEL[change.from]} →{" "}
                  <span className="font-medium">
                    {STAGE_STATUS_LABEL[change.to]}
                  </span>
                  {change.comment && (
                    <span className="text-muted-foreground block">
                      {change.comment}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </li>
  );
}
