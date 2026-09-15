/**
 * Статус этапа работ.
 *
 * Жизненный цикл описан в {@link STAGE_TRANSITIONS} — перевод между статусами
 * разрешён только по явно объявленным рёбрам графа.
 */
export type StageStatus = "pending" | "in_progress" | "completed" | "blocked";

/** Запись в журнале изменений статуса этапа. */
export interface StageStatusChange {
  id: string;
  from: StageStatus;
  to: StageStatus;
  /** ISO-дата перехода. */
  at: string;
  /** Комментарий исполнителя; обязателен при переводе в `blocked`. */
  comment?: string;
}

/** Этап работ внутри паспорта объекта. */
export interface Stage {
  id: string;
  title: string;
  /** Ответственный за этап (бригада / прораб). */
  assignee?: string;
  status: StageStatus;
  /** Плановое начало, ISO-дата `YYYY-MM-DD`. */
  plannedStart: string;
  /** Плановое окончание, ISO-дата `YYYY-MM-DD`. */
  plannedEnd: string;
  /** Фактическое начало — проставляется при первом переходе в `in_progress`. */
  actualStart?: string;
  /** Фактическое окончание — проставляется при переходе в `completed`. */
  actualEnd?: string;
  /** Причина блокировки — актуальна, пока статус `blocked`. */
  blockReason?: string;
  history: StageStatusChange[];
}

/** Позиция сметы. */
export interface EstimateItem {
  id: string;
  name: string;
  /** Единица измерения: м², шт, компл. и т.п. */
  unit: string;
  quantity: number;
  /** Цена за единицу в рублях. */
  price: number;
}

/** Тип объекта недвижимости. */
export type PropertyKind = "apartment" | "room" | "studio" | "house";

/** Паспорт объекта — корневая сущность платформы. */
export interface ObjectPassport {
  id: string;
  name: string;
  kind: PropertyKind;
  address: string;
  /** Площадь в м². */
  area: number;
  rooms: number;
  floor: number;
  floorsTotal: number;
  clientName: string;
  clientPhone: string;
  manager: string;
  /** Дата постановки объекта на платформу, ISO `YYYY-MM-DD`. */
  createdAt: string;
  /** Плановая сдача объекта, ISO `YYYY-MM-DD`. */
  deadline: string;
  stages: Stage[];
  estimate: EstimateItem[];
}
