import {
  assertTransition,
  isCommentRequired,
  STAGE_STATUS_LABEL,
} from "./status";
import type { Stage, StageStatus, StageStatusChange } from "./types";

/** Ошибка: переход требует комментария, а он не указан. */
export class CommentRequiredError extends Error {
  readonly to: StageStatus;

  constructor(to: StageStatus) {
    super(
      `Для перевода в статус «${STAGE_STATUS_LABEL[to]}» нужно указать причину`,
    );
    this.name = "CommentRequiredError";
    this.to = to;
  }
}

/** Параметры перевода этапа в новый статус. */
export interface StageTransitionInput {
  to: StageStatus;
  /** Идентификатор записи в журнале. */
  changeId: string;
  /** Полная ISO-метка времени перехода. */
  at: string;
  comment?: string;
}

/** Обрезает ISO-метку времени до календарной даты `YYYY-MM-DD`. */
export function toIsoDate(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10);
}

/**
 * Переводит этап в новый статус, возвращая новый объект этапа.
 *
 * Помимо смены самого статуса проставляет фактические даты, ведёт журнал
 * переходов и снимает причину блокировки при возврате в работу.
 *
 * @throws {import("./status").InvalidTransitionError} если переход запрещён графом.
 * @throws {CommentRequiredError} если переход требует комментария.
 */
export function applyStageTransition(
  stage: Stage,
  { to, changeId, at, comment }: StageTransitionInput,
): Stage {
  assertTransition(stage.status, to);

  const trimmedComment = comment?.trim() || undefined;
  if (isCommentRequired(to) && !trimmedComment) {
    throw new CommentRequiredError(to);
  }

  const change: StageStatusChange = {
    id: changeId,
    from: stage.status,
    to,
    at,
    comment: trimmedComment,
  };

  const next: Stage = {
    ...stage,
    status: to,
    history: [...stage.history, change],
    blockReason: to === "blocked" ? trimmedComment : undefined,
  };

  if (to === "in_progress") {
    next.actualStart = stage.actualStart ?? toIsoDate(at);
    /** Возврат в работу снимает ранее зафиксированное завершение. */
    next.actualEnd = undefined;
  }

  if (to === "completed") {
    next.actualStart = stage.actualStart ?? toIsoDate(at);
    next.actualEnd = toIsoDate(at);
  }

  return next;
}

/** Черновик нового этапа из формы. */
export interface NewStageInput {
  id: string;
  title: string;
  assignee?: string;
  plannedStart: string;
  plannedEnd: string;
}

/** Создаёт новый этап — всегда в статусе `pending` и с пустым журналом. */
export function createStage({
  id,
  title,
  assignee,
  plannedStart,
  plannedEnd,
}: NewStageInput): Stage {
  return {
    id,
    title: title.trim(),
    assignee: assignee?.trim() || undefined,
    status: "pending",
    plannedStart,
    plannedEnd,
    history: [],
  };
}
