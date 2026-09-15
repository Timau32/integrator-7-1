"use client";

import { ArrowRight, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";

import { StatusBadge } from "@/components/passport/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getAvailableTransitions,
  isCommentRequired,
  STAGE_STATUS_LABEL,
  STAGE_TRANSITION_HINT,
  STAGE_TRANSITION_LABEL,
} from "@/lib/domain/status";
import type { Stage, StageStatus } from "@/lib/domain/types";

interface StageStatusDialogProps {
  /** Этап, статус которого меняем; `null` — модалка закрыта. */
  stage: Stage | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (to: StageStatus, comment?: string) => void;
}

/**
 * Модалка смены статуса этапа.
 *
 * Список действий строится из доменного графа переходов, поэтому запрещённые
 * переходы физически не могут быть отрисованы.
 */
export function StageStatusDialog({
  stage,
  onOpenChange,
  onConfirm,
}: StageStatusDialogProps) {
  return (
    <Dialog open={stage !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {stage && (
          /** Ключ по этапу сбрасывает черновик комментария при смене этапа. */
          <TransitionPicker
            key={stage.id}
            stage={stage}
            onConfirm={onConfirm}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface TransitionPickerProps {
  stage: Stage;
  onConfirm: (to: StageStatus, comment?: string) => void;
  onCancel: () => void;
}

/**
 * Содержимое модалки: комментарий и список доступных переходов.
 * Комментарий опционален для всех переходов и обязателен при блокировке.
 */
function TransitionPicker({
  stage,
  onConfirm,
  onCancel,
}: TransitionPickerProps) {
  const commentId = useId();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const transitions = getAvailableTransitions(stage.status);

  function handleSelect(to: StageStatus) {
    const trimmed = comment.trim();

    if (isCommentRequired(to) && !trimmed) {
      setError("Опишите, что блокирует этап — это увидят заказчик и менеджер");
      return;
    }

    onConfirm(to, trimmed || undefined);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Изменить статус этапа</DialogTitle>
        <DialogDescription asChild>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-foreground font-medium">{stage.title}</span>
            <span aria-hidden>·</span>
            <span>сейчас</span>
            <StatusBadge status={stage.status} />
          </div>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor={commentId}>
          Комментарий
          <span className="text-muted-foreground font-normal">
            (обязателен при блокировке)
          </span>
        </Label>
        <Textarea
          id={commentId}
          value={comment}
          aria-invalid={error !== null}
          placeholder="Например: подписан акт скрытых работ"
          onChange={(event) => {
            setComment(event.target.value);
            if (error) setError(null);
          }}
        />
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Доступные переходы
        </p>
        <ul className="grid gap-2">
          {transitions.map((to) => (
            <li key={to}>
              <button
                type="button"
                data-testid={`transition-${to}`}
                onClick={() => handleSelect(to)}
                className="hover:border-ring hover:bg-accent focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-[3px]"
              >
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {STAGE_TRANSITION_LABEL[to]}
                  </span>
                  <span className="text-muted-foreground block text-sm">
                    {STAGE_TRANSITION_HINT[stage.status][to]}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ArrowRight
                    aria-hidden
                    className="text-muted-foreground size-4"
                  />
                  <StatusBadge status={to} />
                </div>
              </button>
            </li>
          ))}
        </ul>

        {transitions.length === 0 && (
          <p className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm">
            <TriangleAlert aria-hidden className="size-4" />
            Из статуса «{STAGE_STATUS_LABEL[stage.status]}» переходы не
            предусмотрены.
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </>
  );
}
