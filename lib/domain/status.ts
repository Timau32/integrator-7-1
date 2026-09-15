import type { StageStatus } from "./types";

/** Все статусы этапа в порядке нормального жизненного цикла. */
export const STAGE_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "blocked",
] as const satisfies readonly StageStatus[];

/**
 * Граф разрешённых переходов между статусами этапа.
 *
 * Единственный источник правды: и модалка, и редьюсер, и тесты читают его.
 * Всё, чего нет в списке, — запрещено, включая переход в тот же статус:
 * `pending → completed`, `completed → blocked`, `blocked → completed`.
 */
export const STAGE_TRANSITIONS: Readonly<
  Record<StageStatus, readonly StageStatus[]>
> = {
  pending: ["in_progress"],
  in_progress: ["completed", "blocked"],
  completed: ["in_progress"],
  blocked: ["in_progress"],
};

/** Человекочитаемая подпись статуса. */
export const STAGE_STATUS_LABEL: Readonly<Record<StageStatus, string>> = {
  pending: "Не начат",
  in_progress: "В работе",
  completed: "Завершён",
  blocked: "Заблокирован",
};

/** Подпись действия для кнопки перехода в модалке. */
export const STAGE_TRANSITION_LABEL: Readonly<Record<StageStatus, string>> = {
  pending: "Вернуть в план",
  in_progress: "Взять в работу",
  completed: "Завершить",
  blocked: "Заблокировать",
};

/** Пояснение к действию — что именно произойдёт с этапом. */
export const STAGE_TRANSITION_HINT: Readonly<
  Record<StageStatus, Partial<Record<StageStatus, string>>>
> = {
  pending: {
    in_progress: "Этап стартует, зафиксируем фактическую дату начала",
  },
  in_progress: {
    completed: "Работы приняты, зафиксируем фактическую дату завершения",
    blocked: "Работы остановлены — потребуется указать причину",
  },
  completed: {
    in_progress: "Возврат в работу: например, по замечаниям приёмки",
  },
  blocked: {
    in_progress: "Препятствие снято, работы возобновляются",
  },
};

/** Ошибка недопустимого перехода — бросается доменным слоем. */
export class InvalidTransitionError extends Error {
  readonly from: StageStatus;
  readonly to: StageStatus;

  constructor(from: StageStatus, to: StageStatus) {
    super(
      `Переход «${STAGE_STATUS_LABEL[from]}» → «${STAGE_STATUS_LABEL[to]}» запрещён`,
    );
    this.name = "InvalidTransitionError";
    this.from = from;
    this.to = to;
  }
}

/**
 * Список статусов, в которые этап может быть переведён прямо сейчас.
 * Именно он рендерится в модалке — запрещённые переходы в UI не попадают.
 */
export function getAvailableTransitions(
  from: StageStatus,
): readonly StageStatus[] {
  return STAGE_TRANSITIONS[from];
}

/** Разрешён ли переход `from → to`. */
export function canTransition(from: StageStatus, to: StageStatus): boolean {
  return STAGE_TRANSITIONS[from].includes(to);
}

/** Бросает {@link InvalidTransitionError}, если переход запрещён. */
export function assertTransition(from: StageStatus, to: StageStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

/** Требуется ли обязательный комментарий при переходе в статус `to`. */
export function isCommentRequired(to: StageStatus): boolean {
  return to === "blocked";
}

/** Терминален ли статус — из него нет ни одного перехода. */
export function isTerminal(status: StageStatus): boolean {
  return STAGE_TRANSITIONS[status].length === 0;
}
