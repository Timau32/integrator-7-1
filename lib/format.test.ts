import { describe, expect, it } from "vitest";

import { createId, formatDate, formatMoney, pluralize } from "./format";

describe("formatDate", () => {
  it("переводит ISO-дату в ДД.ММ.ГГГГ", () => {
    expect(formatDate("2026-09-15")).toBe("15.09.2026");
  });

  it("принимает полную метку времени", () => {
    expect(formatDate("2026-01-05T23:45:00.000Z")).toBe("05.01.2026");
  });

  it("на пустом значении отдаёт прочерк", () => {
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
  });
});

describe("formatMoney", () => {
  it("форматирует рубли с двумя знаками и символом валюты", () => {
    const result = formatMoney(21400);

    expect(result).toContain("21");
    expect(result).toContain("400,00");
    expect(result).toContain("₽");
  });
});

describe("pluralize", () => {
  const forms: [string, string, string] = ["этап", "этапа", "этапов"];

  it.each([
    [1, "этап"],
    [2, "этапа"],
    [4, "этапа"],
    [5, "этапов"],
    [11, "этапов"],
    [14, "этапов"],
    [21, "этап"],
    [22, "этапа"],
    [100, "этапов"],
    [0, "этапов"],
  ])("для %i выбирает форму «%s»", (count, expected) => {
    expect(pluralize(count, forms)).toBe(expected);
  });
});

describe("createId", () => {
  it("добавляет переданный префикс", () => {
    expect(createId("stg")).toMatch(/^stg_/);
  });

  it("генерирует уникальные значения", () => {
    const ids = new Set(Array.from({ length: 100 }, () => createId("est")));
    expect(ids.size).toBe(100);
  });
});
