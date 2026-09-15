import { beforeEach, describe, expect, it } from "vitest";

import {
  applyStageTransition,
  CommentRequiredError,
  createStage,
  toIsoDate,
} from "./stage";
import { InvalidTransitionError } from "./status";
import type { Stage, StageStatus } from "./types";

const AT = "2026-09-15T12:30:00.000Z";

function makeStage(overrides: Partial<Stage> = {}): Stage {
  return {
    id: "stg-test",
    title: "Штукатурка стен",
    status: "pending",
    plannedStart: "2026-09-01",
    plannedEnd: "2026-09-30",
    history: [],
    ...overrides,
  };
}

describe("applyStageTransition", () => {
  let stage: Stage;

  beforeEach(() => {
    stage = makeStage();
  });

  it("меняет статус и не мутирует исходный этап", () => {
    const next = applyStageTransition(stage, {
      to: "in_progress",
      changeId: "chg-1",
      at: AT,
    });

    expect(next.status).toBe("in_progress");
    expect(stage.status).toBe("pending");
    expect(next).not.toBe(stage);
  });

  it("бросает InvalidTransitionError на запрещённом переходе", () => {
    expect(() =>
      applyStageTransition(stage, {
        to: "completed",
        changeId: "chg-1",
        at: AT,
      }),
    ).toThrow(InvalidTransitionError);
  });

  it("проставляет фактическое начало при первом старте", () => {
    const next = applyStageTransition(stage, {
      to: "in_progress",
      changeId: "chg-1",
      at: AT,
    });

    expect(next.actualStart).toBe("2026-09-15");
    expect(next.actualEnd).toBeUndefined();
  });

  it("не перезаписывает фактическое начало при возврате в работу", () => {
    const completed = makeStage({
      status: "completed",
      actualStart: "2026-09-02",
      actualEnd: "2026-09-10",
    });

    const next = applyStageTransition(completed, {
      to: "in_progress",
      changeId: "chg-2",
      at: AT,
    });

    expect(next.actualStart).toBe("2026-09-02");
    expect(next.actualEnd).toBeUndefined();
  });

  it("фиксирует фактическое окончание при завершении", () => {
    const inProgress = makeStage({
      status: "in_progress",
      actualStart: "2026-09-02",
    });

    const next = applyStageTransition(inProgress, {
      to: "completed",
      changeId: "chg-3",
      at: AT,
    });

    expect(next.actualEnd).toBe("2026-09-15");
    expect(next.actualStart).toBe("2026-09-02");
  });

  it("требует причину при блокировке", () => {
    const inProgress = makeStage({ status: "in_progress" });

    expect(() =>
      applyStageTransition(inProgress, {
        to: "blocked",
        changeId: "chg-4",
        at: AT,
      }),
    ).toThrow(CommentRequiredError);
  });

  it("не принимает причину из одних пробелов", () => {
    const inProgress = makeStage({ status: "in_progress" });

    expect(() =>
      applyStageTransition(inProgress, {
        to: "blocked",
        changeId: "chg-4",
        at: AT,
        comment: "   ",
      }),
    ).toThrow(CommentRequiredError);
  });

  it("сохраняет причину блокировки в этапе", () => {
    const inProgress = makeStage({ status: "in_progress" });

    const next = applyStageTransition(inProgress, {
      to: "blocked",
      changeId: "chg-4",
      at: AT,
      comment: "  Нет согласования УК  ",
    });

    expect(next.status).toBe("blocked");
    expect(next.blockReason).toBe("Нет согласования УК");
  });

  it("снимает причину блокировки при возобновлении работ", () => {
    const blocked = makeStage({
      status: "blocked",
      blockReason: "Нет согласования УК",
      actualStart: "2026-09-02",
    });

    const next = applyStageTransition(blocked, {
      to: "in_progress",
      changeId: "chg-5",
      at: AT,
    });

    expect(next.status).toBe("in_progress");
    expect(next.blockReason).toBeUndefined();
  });

  it("дописывает запись в журнал переходов", () => {
    const next = applyStageTransition(stage, {
      to: "in_progress",
      changeId: "chg-1",
      at: AT,
      comment: "Стартуем",
    });

    expect(next.history).toHaveLength(1);
    expect(next.history[0]).toEqual({
      id: "chg-1",
      from: "pending",
      to: "in_progress",
      at: AT,
      comment: "Стартуем",
    });
  });

  it("проходит полный цикл pending → in_progress → blocked → in_progress → completed", () => {
    const steps: Array<[StageStatus, string | undefined]> = [
      ["in_progress", undefined],
      ["blocked", "Ждём материалы"],
      ["in_progress", undefined],
      ["completed", "Работы приняты"],
    ];

    const result = steps.reduce(
      (acc, [to, comment], index) =>
        applyStageTransition(acc, {
          to,
          comment,
          changeId: `chg-${index}`,
          at: AT,
        }),
      stage,
    );

    expect(result.status).toBe("completed");
    expect(result.history).toHaveLength(4);
    expect(result.blockReason).toBeUndefined();
    expect(result.actualEnd).toBe("2026-09-15");
  });
});

describe("createStage", () => {
  it("создаёт этап в статусе pending с пустым журналом", () => {
    const stage = createStage({
      id: "stg-new",
      title: "  Монтаж дверей  ",
      plannedStart: "2026-10-01",
      plannedEnd: "2026-10-14",
    });

    expect(stage).toEqual({
      id: "stg-new",
      title: "Монтаж дверей",
      assignee: undefined,
      status: "pending",
      plannedStart: "2026-10-01",
      plannedEnd: "2026-10-14",
      history: [],
    });
  });

  it("не сохраняет пустого ответственного", () => {
    const stage = createStage({
      id: "stg-new",
      title: "Монтаж дверей",
      assignee: "   ",
      plannedStart: "2026-10-01",
      plannedEnd: "2026-10-14",
    });

    expect(stage.assignee).toBeUndefined();
  });
});

describe("toIsoDate", () => {
  it("обрезает метку времени до календарной даты", () => {
    expect(toIsoDate("2026-09-15T23:59:59.000Z")).toBe("2026-09-15");
  });
});
