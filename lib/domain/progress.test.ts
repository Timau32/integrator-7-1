import { describe, expect, it } from "vitest";

import { summarizeStages } from "./progress";
import type { Stage, StageStatus } from "./types";

function stage(id: string, status: StageStatus): Stage {
  return {
    id,
    title: `Этап ${id}`,
    status,
    plannedStart: "2026-09-01",
    plannedEnd: "2026-09-30",
    history: [],
  };
}

describe("summarizeStages", () => {
  it("на пустом списке возвращает нули без деления на ноль", () => {
    const summary = summarizeStages([]);

    expect(summary.total).toBe(0);
    expect(summary.completionPercent).toBe(0);
    expect(summary.hasBlockers).toBe(false);
    expect(summary.byStatus).toEqual({
      pending: 0,
      in_progress: 0,
      completed: 0,
      blocked: 0,
    });
  });

  it("считает распределение по статусам", () => {
    const summary = summarizeStages([
      stage("1", "completed"),
      stage("2", "completed"),
      stage("3", "in_progress"),
      stage("4", "blocked"),
      stage("5", "pending"),
    ]);

    expect(summary.total).toBe(5);
    expect(summary.byStatus).toEqual({
      pending: 1,
      in_progress: 1,
      completed: 2,
      blocked: 1,
    });
  });

  it("считает процент готовности по завершённым этапам", () => {
    const summary = summarizeStages([
      stage("1", "completed"),
      stage("2", "pending"),
      stage("3", "pending"),
      stage("4", "pending"),
    ]);

    expect(summary.completionPercent).toBe(25);
  });

  it("округляет процент до целого", () => {
    const summary = summarizeStages([
      stage("1", "completed"),
      stage("2", "pending"),
      stage("3", "pending"),
    ]);

    expect(summary.completionPercent).toBe(33);
  });

  it("поднимает флаг блокировки при наличии заблокированного этапа", () => {
    expect(summarizeStages([stage("1", "blocked")]).hasBlockers).toBe(true);
    expect(summarizeStages([stage("1", "pending")]).hasBlockers).toBe(false);
  });
});
