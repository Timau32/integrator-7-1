import { describe, expect, it } from "vitest";

import {
  calculateEstimate,
  lineTotal,
  PLATFORM_COMMISSION_RATE,
  roundMoney,
} from "./estimate";
import type { EstimateItem } from "./types";

function item(
  overrides: Partial<EstimateItem> & Pick<EstimateItem, "quantity" | "price">,
): EstimateItem {
  return {
    id: "est-x",
    name: "Позиция",
    unit: "шт",
    ...overrides,
  };
}

describe("комиссия платформы", () => {
  it("равна 7%", () => {
    expect(PLATFORM_COMMISSION_RATE).toBe(0.07);
  });
});

describe("roundMoney", () => {
  it("округляет до копеек", () => {
    expect(roundMoney(1234.5678)).toBe(1234.57);
  });

  it("гасит ошибку двоичной плавающей точки", () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(1.005)).toBe(1.01);
  });
});

describe("lineTotal", () => {
  it("умножает количество на цену", () => {
    expect(lineTotal({ quantity: 12, price: 850 })).toBe(10200);
  });

  it("округляет дробный результат до копеек", () => {
    expect(lineTotal({ quantity: 18.2, price: 690 })).toBe(12558);
    expect(lineTotal({ quantity: 3.33, price: 10.01 })).toBe(33.33);
  });
});

describe("calculateEstimate", () => {
  it("на пустой смете даёт нули", () => {
    expect(calculateEstimate([])).toEqual({
      subtotal: 0,
      commission: 0,
      commissionRate: 0.07,
      total: 0,
      itemsCount: 0,
    });
  });

  it("считает сумму, комиссию 7% и итог", () => {
    const totals = calculateEstimate([
      item({ id: "a", quantity: 10, price: 1000 }),
      item({ id: "b", quantity: 2, price: 5000 }),
    ]);

    expect(totals.subtotal).toBe(20000);
    expect(totals.commission).toBe(1400);
    expect(totals.total).toBe(21400);
    expect(totals.itemsCount).toBe(2);
  });

  it("итог всегда равен сумме работ плюс комиссия", () => {
    const totals = calculateEstimate([
      item({ id: "a", quantity: 186.5, price: 720 }),
      item({ id: "b", quantity: 62.4, price: 990 }),
      item({ id: "c", quantity: 21.8, price: 1650 }),
    ]);

    expect(totals.total).toBe(roundMoney(totals.subtotal + totals.commission));
  });

  it("суммирует уже округлённые строки, чтобы итог совпадал с таблицей", () => {
    const items = [
      item({ id: "a", quantity: 3.33, price: 10.01 }),
      item({ id: "b", quantity: 3.33, price: 10.01 }),
    ];

    const totals = calculateEstimate(items);
    const visibleSum = items.reduce((acc, next) => acc + lineTotal(next), 0);

    expect(totals.subtotal).toBe(roundMoney(visibleSum));
    expect(totals.subtotal).toBe(66.66);
  });

  it("округляет комиссию до копеек", () => {
    const totals = calculateEstimate([item({ quantity: 1, price: 1234.56 })]);

    expect(totals.commission).toBe(86.42);
    expect(totals.total).toBe(1320.98);
  });
});
