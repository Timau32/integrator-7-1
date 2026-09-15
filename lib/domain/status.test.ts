import { describe, expect, it } from "vitest";

import {
  assertTransition,
  canTransition,
  getAvailableTransitions,
  InvalidTransitionError,
  isCommentRequired,
  isTerminal,
  STAGE_STATUSES,
  STAGE_TRANSITION_HINT,
} from "./status";
import type { StageStatus } from "./types";

/** Пары переходов, явно разрешённые техническим заданием. */
const ALLOWED: ReadonlyArray<[StageStatus, StageStatus]> = [
  ["pending", "in_progress"],
  ["in_progress", "completed"],
  ["in_progress", "blocked"],
  ["blocked", "in_progress"],
  ["completed", "in_progress"],
];

/** Пары переходов, явно запрещённые техническим заданием. */
const FORBIDDEN: ReadonlyArray<[StageStatus, StageStatus]> = [
  ["pending", "completed"],
  ["completed", "blocked"],
  ["blocked", "completed"],
  ["pending", "blocked"],
];

describe("граф переходов статусов", () => {
  it.each(ALLOWED)("разрешает %s → %s", (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each(FORBIDDEN)("запрещает %s → %s", (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it.each(STAGE_STATUSES)("запрещает переход %s в тот же статус", (status) => {
    expect(canTransition(status, status)).toBe(false);
  });

  it("разрешает ровно пять переходов на весь граф", () => {
    const edges = STAGE_STATUSES.flatMap((from) =>
      getAvailableTransitions(from).map((to) => [from, to]),
    );
    expect(edges).toHaveLength(ALLOWED.length);
    expect(edges).toEqual(expect.arrayContaining(ALLOWED.map(([f, t]) => [f, t])));
  });
});

describe("getAvailableTransitions", () => {
  it("из pending предлагает только взятие в работу", () => {
    expect(getAvailableTransitions("pending")).toEqual(["in_progress"]);
  });

  it("из in_progress предлагает завершение и блокировку", () => {
    expect(getAvailableTransitions("in_progress")).toEqual([
      "completed",
      "blocked",
    ]);
  });

  it("из completed предлагает только возврат в работу", () => {
    expect(getAvailableTransitions("completed")).toEqual(["in_progress"]);
  });

  it("из blocked предлагает только возобновление работ", () => {
    expect(getAvailableTransitions("blocked")).toEqual(["in_progress"]);
  });

  it("никогда не предлагает текущий статус", () => {
    for (const status of STAGE_STATUSES) {
      expect(getAvailableTransitions(status)).not.toContain(status);
    }
  });

  it("для каждого доступного перехода есть пояснение в UI", () => {
    for (const from of STAGE_STATUSES) {
      for (const to of getAvailableTransitions(from)) {
        expect(STAGE_TRANSITION_HINT[from][to]).toBeTruthy();
      }
    }
  });
});

describe("assertTransition", () => {
  it("молча пропускает разрешённый переход", () => {
    expect(() => assertTransition("pending", "in_progress")).not.toThrow();
  });

  it("бросает InvalidTransitionError на запрещённом переходе", () => {
    expect(() => assertTransition("pending", "completed")).toThrow(
      InvalidTransitionError,
    );
  });

  it("сохраняет в ошибке исходный и целевой статус", () => {
    try {
      assertTransition("blocked", "completed");
      expect.unreachable("ожидалась ошибка перехода");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTransitionError);
      expect((error as InvalidTransitionError).from).toBe("blocked");
      expect((error as InvalidTransitionError).to).toBe("completed");
    }
  });
});

describe("правила комментария и терминальности", () => {
  it("требует комментарий только при блокировке", () => {
    expect(isCommentRequired("blocked")).toBe(true);
    expect(isCommentRequired("completed")).toBe(false);
    expect(isCommentRequired("in_progress")).toBe(false);
    expect(isCommentRequired("pending")).toBe(false);
  });

  it("не имеет терминальных статусов: из любого есть выход", () => {
    for (const status of STAGE_STATUSES) {
      expect(isTerminal(status)).toBe(false);
    }
  });
});
