"use client";

import { ListChecks } from "lucide-react";

import { AddStageForm } from "@/components/passport/add-stage-form";
import { StageCard } from "@/components/passport/stage-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { summarizeStages } from "@/lib/domain/progress";
import { STAGE_STATUS_LABEL, STAGE_STATUSES } from "@/lib/domain/status";
import type { NewStageInput } from "@/lib/domain/stage";
import type { Stage } from "@/lib/domain/types";
import { pluralize } from "@/lib/format";

interface StagesTabProps {
  stages: readonly Stage[];
  onChangeStatus: (stage: Stage) => void;
  onAddStage: (stage: NewStageInput) => void;
}

/** Вкладка «Этапы»: список работ, смена статусов и добавление нового этапа. */
export function StagesTab({
  stages,
  onChangeStatus,
  onAddStage,
}: StagesTabProps) {
  const summary = summarizeStages(stages);

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Этапы работ</CardTitle>
            <CardDescription>
              {summary.total}{" "}
              {pluralize(summary.total, ["этап", "этапа", "этапов"])} · готово{" "}
              {summary.completionPercent}%
            </CardDescription>
          </div>
          <dl className="hidden gap-4 text-sm sm:flex">
            {STAGE_STATUSES.map((status) => (
              <div key={status} className="text-right">
                <dt className="text-muted-foreground text-xs">
                  {STAGE_STATUS_LABEL[status]}
                </dt>
                <dd className="tabular font-semibold">
                  {summary.byStatus[status]}
                </dd>
              </div>
            ))}
          </dl>
        </CardHeader>

        <CardContent>
          {stages.length === 0 ? (
            <p className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center text-sm">
              <ListChecks aria-hidden className="size-6" />
              Этапов пока нет. Добавьте первый этап в форме ниже.
            </p>
          ) : (
            <ul className="grid gap-3">
              {stages.map((stage, index) => (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  index={index}
                  onChangeStatus={onChangeStatus}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Добавить этап</CardTitle>
          <CardDescription>
            Новый этап попадёт в конец списка со статусом «Не начат».
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddStageForm onAdd={onAddStage} />
        </CardContent>
      </Card>
    </div>
  );
}
