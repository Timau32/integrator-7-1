import { describe, expect, it } from "vitest";

import { passportReducer, type PassportAction } from "./passport-reducer";
import { InvalidTransitionError } from "./status";
import type { ObjectPassport } from "./types";

const AT = "2026-09-15T12:00:00.000Z";

function makePassport(): ObjectPassport {
  return {
    id: "obj-test",
    name: "Тестовая квартира",
    kind: "apartment",
    address: "Москва, ул. Тестовая, 1",
    area: 50,
    rooms: 2,
    floor: 3,
    floorsTotal: 9,
    clientName: "Иванов Иван",
    clientPhone: "+7 900 000-00-00",
    manager: "Петров Пётр",
    createdAt: "2026-09-01",
    deadline: "2026-12-01",
    stages: [
      {
        id: "stg-1",
        title: "Демонтаж",
        status: "pending",
        plannedStart: "2026-09-02",
        plannedEnd: "2026-09-12",
        history: [],
      },
      {
        id: "stg-2",
        title: "Электрика",
        status: "in_progress",
        plannedStart: "2026-09-13",
        plannedEnd: "2026-09-30",
        actualStart: "2026-09-13",
        history: [],
      },
    ],
    estimate: [
      { id: "est-1", name: "Демонтаж", unit: "м²", quantity: 10, price: 800 },
    ],
  };
}

describe("passportReducer · этапы", () => {
  it("добавляет этап в конец списка в статусе pending", () => {
    const state = makePassport();
    const next = passportReducer(state, {
      type: "stage/add",
      payload: {
        id: "stg-3",
        title: "Плитка",
        plannedStart: "2026-10-01",
        plannedEnd: "2026-10-20",
      },
    });

    expect(next.stages).toHaveLength(3);
    expect(next.stages.at(-1)).toMatchObject({
      id: "stg-3",
      title: "Плитка",
      status: "pending",
    });
    expect(state.stages).toHaveLength(2);
  });

  it("меняет статус нужного этапа, не трогая остальные", () => {
    const state = makePassport();
    const next = passportReducer(state, {
      type: "stage/changeStatus",
      payload: {
        stageId: "stg-1",
        to: "in_progress",
        changeId: "chg-1",
        at: AT,
      },
    });

    expect(next.stages[0].status).toBe("in_progress");
    expect(next.stages[1]).toBe(state.stages[1]);
    expect(state.stages[0].status).toBe("pending");
  });

  it("пробрасывает доменную ошибку на запрещённом переходе", () => {
    const state = makePassport();

    expect(() =>
      passportReducer(state, {
        type: "stage/changeStatus",
        payload: {
          stageId: "stg-1",
          to: "completed",
          changeId: "chg-1",
          at: AT,
        },
      }),
    ).toThrow(InvalidTransitionError);
  });

  it("возвращает прежнее состояние для несуществующего этапа", () => {
    const state = makePassport();
    const next = passportReducer(state, {
      type: "stage/changeStatus",
      payload: {
        stageId: "stg-missing",
        to: "in_progress",
        changeId: "chg-1",
        at: AT,
      },
    });

    expect(next).toBe(state);
  });
});

describe("passportReducer · смета", () => {
  it("добавляет позицию и обрезает пробелы", () => {
    const state = makePassport();
    const next = passportReducer(state, {
      type: "estimate/add",
      payload: {
        id: "est-2",
        name: "  Стяжка пола  ",
        unit: " м² ",
        quantity: 50,
        price: 990,
      },
    });

    expect(next.estimate).toHaveLength(2);
    expect(next.estimate[1]).toEqual({
      id: "est-2",
      name: "Стяжка пола",
      unit: "м²",
      quantity: 50,
      price: 990,
    });
  });

  it("удаляет позицию по идентификатору", () => {
    const state = makePassport();
    const next = passportReducer(state, {
      type: "estimate/remove",
      payload: { id: "est-1" },
    });

    expect(next.estimate).toHaveLength(0);
    expect(state.estimate).toHaveLength(1);
  });

  it("игнорирует удаление несуществующей позиции", () => {
    const state = makePassport();
    const next = passportReducer(state, {
      type: "estimate/remove",
      payload: { id: "est-missing" },
    });

    expect(next.estimate).toHaveLength(1);
  });
});

describe("passportReducer · последовательность действий", () => {
  it("накапливает изменения через reduce", () => {
    const actions: PassportAction[] = [
      {
        type: "stage/add",
        payload: {
          id: "stg-3",
          title: "Покраска",
          plannedStart: "2026-10-01",
          plannedEnd: "2026-10-10",
        },
      },
      {
        type: "stage/changeStatus",
        payload: {
          stageId: "stg-3",
          to: "in_progress",
          changeId: "chg-1",
          at: AT,
        },
      },
      {
        type: "stage/changeStatus",
        payload: {
          stageId: "stg-3",
          to: "blocked",
          changeId: "chg-2",
          at: AT,
          comment: "Нет краски",
        },
      },
      {
        type: "estimate/add",
        payload: {
          id: "est-2",
          name: "Покраска стен",
          unit: "м²",
          quantity: 40,
          price: 350,
        },
      },
    ];

    const result = actions.reduce(passportReducer, makePassport());
    const added = result.stages.find((stage) => stage.id === "stg-3");

    expect(added?.status).toBe("blocked");
    expect(added?.blockReason).toBe("Нет краски");
    expect(added?.history).toHaveLength(2);
    expect(result.estimate).toHaveLength(2);
  });
});
