"use client";

import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { useReducer, useState } from "react";

import { EstimateTab } from "@/components/passport/estimate-tab";
import { OverviewTab } from "@/components/passport/overview-tab";
import { StageStatusDialog } from "@/components/passport/stage-status-dialog";
import { StagesTab } from "@/components/passport/stages-tab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROPERTY_KIND_LABEL } from "@/lib/data/objects";
import {
  passportReducer,
  type NewEstimateItemInput,
} from "@/lib/domain/passport-reducer";
import { canTransition, STAGE_STATUS_LABEL } from "@/lib/domain/status";
import type { NewStageInput } from "@/lib/domain/stage";
import type { ObjectPassport, Stage, StageStatus } from "@/lib/domain/types";
import { createId, formatNumber } from "@/lib/format";

interface ObjectPassportViewProps {
  passport: ObjectPassport;
}

/**
 * Паспорт объекта: три вкладки и единое состояние на `useReducer`.
 *
 * Состояние живёт на клиенте — серверный компонент отдаёт только начальный
 * снимок данных, все изменения (статусы, новые этапы и позиции сметы)
 * применяются доменным редьюсером.
 */
export function ObjectPassportView({ passport }: ObjectPassportViewProps) {
  const [state, dispatch] = useReducer(passportReducer, passport);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const editingStage =
    state.stages.find((stage) => stage.id === editingStageId) ?? null;

  function handleConfirmTransition(to: StageStatus, comment?: string) {
    if (!editingStage || !canTransition(editingStage.status, to)) return;

    dispatch({
      type: "stage/changeStatus",
      payload: {
        stageId: editingStage.id,
        to,
        comment,
        changeId: createId("chg"),
        at: new Date().toISOString(),
      },
    });
    setAnnouncement(
      `Этап «${editingStage.title}» переведён в статус «${STAGE_STATUS_LABEL[to]}»`,
    );
    setEditingStageId(null);
  }

  function handleAddStage(stage: NewStageInput) {
    dispatch({ type: "stage/add", payload: stage });
    setAnnouncement(`Этап «${stage.title}» добавлен`);
  }

  function handleAddEstimateItem(item: NewEstimateItemInput) {
    dispatch({ type: "estimate/add", payload: item });
    setAnnouncement(`Позиция «${item.name}» добавлена в смету`);
  }

  function handleRemoveEstimateItem(id: string) {
    dispatch({ type: "estimate/remove", payload: { id } });
    setAnnouncement("Позиция удалена из сметы");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
        <Link href="/objects">
          <ArrowLeft aria-hidden />
          Все объекты
        </Link>
      </Button>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Building2 aria-hidden />
              {PROPERTY_KIND_LABEL[state.kind]}
            </Badge>
            <Badge variant="outline" className="tabular">
              {state.id}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {state.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            {state.address} · {formatNumber(state.area)} м²
          </p>
        </div>
      </header>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Основное</TabsTrigger>
          <TabsTrigger value="stages">Этапы</TabsTrigger>
          <TabsTrigger value="estimate">Смета</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab passport={state} />
        </TabsContent>

        <TabsContent value="stages">
          <StagesTab
            stages={state.stages}
            onAddStage={handleAddStage}
            onChangeStatus={(stage: Stage) => setEditingStageId(stage.id)}
          />
        </TabsContent>

        <TabsContent value="estimate">
          <EstimateTab
            items={state.estimate}
            onAddItem={handleAddEstimateItem}
            onRemoveItem={handleRemoveEstimateItem}
          />
        </TabsContent>
      </Tabs>

      <StageStatusDialog
        stage={editingStage}
        onOpenChange={(open) => {
          if (!open) setEditingStageId(null);
        }}
        onConfirm={handleConfirmTransition}
      />
    </div>
  );
}
