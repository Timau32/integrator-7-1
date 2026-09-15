const moneyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 3,
});

/** Форматирует рубли: `1 234,50 ₽`. */
export function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

/** Форматирует произвольное число в локали ru-RU. */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/**
 * Форматирует ISO-дату `YYYY-MM-DD` как `ДД.ММ.ГГГГ`.
 * Работает на строке, чтобы результат не зависел от таймзоны рантайма.
 */
export function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  if (!year || !month || !day) return "—";
  return `${day}.${month}.${year}`;
}

/** Форматирует ISO-метку времени как `ДД.ММ.ГГГГ, ЧЧ:ММ`. */
export function formatDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return formatDate(isoTimestamp);
  return `${formatDate(isoTimestamp)}, ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

/**
 * Выбирает форму слова по числу: `pluralize(2, ["этап", "этапа", "этапов"])`.
 */
export function pluralize(
  count: number,
  forms: [one: string, few: string, many: string],
): string {
  const mod100 = Math.abs(count) % 100;
  const mod10 = mod100 % 10;
  if (mod100 > 10 && mod100 < 20) return forms[2];
  if (mod10 > 1 && mod10 < 5) return forms[1];
  if (mod10 === 1) return forms[0];
  return forms[2];
}

/** Генерирует идентификатор для новых сущностей на клиенте. */
export function createId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}_${random}`;
}
