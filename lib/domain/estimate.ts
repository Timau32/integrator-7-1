import type { EstimateItem } from "./types";

/** Комиссия платформы «Интегратор 7/1» — 7% от суммы работ. */
export const PLATFORM_COMMISSION_RATE = 0.07;

/** Итоговый расчёт по смете. */
export interface EstimateTotals {
  /** Сумма всех позиций без комиссии. */
  subtotal: number;
  /** Комиссия платформы. */
  commission: number;
  /** Ставка комиссии, доля единицы. */
  commissionRate: number;
  /** Итого к оплате: `subtotal + commission`. */
  total: number;
  /** Количество позиций в смете. */
  itemsCount: number;
}

/**
 * Округление до копеек без накопления ошибки двоичной плавающей точки.
 */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Сумма по позиции: количество × цена. */
export function lineTotal(item: Pick<EstimateItem, "quantity" | "price">) {
  return roundMoney(item.quantity * item.price);
}

/**
 * Считает итоги сметы: сумму работ, комиссию платформы и итог к оплате.
 * Каждая позиция округляется до копеек до суммирования — так итог в таблице
 * совпадает с суммой видимых пользователю строк.
 */
export function calculateEstimate(items: readonly EstimateItem[]): EstimateTotals {
  const subtotal = roundMoney(
    items.reduce((acc, item) => acc + lineTotal(item), 0),
  );
  const commission = roundMoney(subtotal * PLATFORM_COMMISSION_RATE);

  return {
    subtotal,
    commission,
    commissionRate: PLATFORM_COMMISSION_RATE,
    total: roundMoney(subtotal + commission),
    itemsCount: items.length,
  };
}
