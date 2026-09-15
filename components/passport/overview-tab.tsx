"use client";

import { TriangleAlert } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PROPERTY_KIND_LABEL } from "@/lib/data/objects";
import { calculateEstimate } from "@/lib/domain/estimate";
import { summarizeStages } from "@/lib/domain/progress";
import { STAGE_STATUS_LABEL, STAGE_STATUSES } from "@/lib/domain/status";
import type { ObjectPassport } from "@/lib/domain/types";
import { formatDate, formatMoney, formatNumber, pluralize } from "@/lib/format";

interface OverviewTabProps {
  passport: ObjectPassport;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

/** Вкладка «Основное»: карточка объекта, прогресс и финансовая сводка. */
export function OverviewTab({ passport }: OverviewTabProps) {
  const summary = summarizeStages(passport.stages);
  const totals = calculateEstimate(passport.estimate);

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Об объекте</CardTitle>
          <CardDescription>{passport.address}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Тип" value={PROPERTY_KIND_LABEL[passport.kind]} />
            <Field
              label="Площадь"
              value={`${formatNumber(passport.area)} м²`}
            />
            <Field
              label="Комнат"
              value={`${passport.rooms} ${pluralize(passport.rooms, ["комната", "комнаты", "комнат"])}`}
            />
            <Field
              label="Этаж"
              value={`${passport.floor} из ${passport.floorsTotal}`}
            />
            <Field label="Заказчик" value={passport.clientName} />
            <Field label="Телефон" value={passport.clientPhone} />
            <Field label="Менеджер" value={passport.manager} />
            <Field
              label="На платформе с"
              value={formatDate(passport.createdAt)}
            />
            <Field label="Плановая сдача" value={formatDate(passport.deadline)} />
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Готовность</CardTitle>
            <CardDescription>
              {summary.byStatus.completed} из {summary.total}{" "}
              {pluralize(summary.total, ["этапа", "этапов", "этапов"])}{" "}
              завершено
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="tabular text-3xl font-semibold">
                {summary.completionPercent}%
              </span>
            </div>
            <div
              className="bg-muted h-2 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={summary.completionPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Готовность объекта"
            >
              <div
                className="bg-brand h-full rounded-full transition-[width] duration-500"
                style={{ width: `${summary.completionPercent}%` }}
              />
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              {STAGE_STATUSES.map((status) => (
                <div key={status} className="flex items-center justify-between">
                  <dt className="text-muted-foreground">
                    {STAGE_STATUS_LABEL[status]}
                  </dt>
                  <dd className="tabular font-medium">
                    {summary.byStatus[status]}
                  </dd>
                </div>
              ))}
            </dl>

            {summary.hasBlockers && (
              <p className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>
                  {summary.byStatus.blocked}{" "}
                  {pluralize(summary.byStatus.blocked, [
                    "этап заблокирован",
                    "этапа заблокировано",
                    "этапов заблокировано",
                  ])}{" "}
                  — нужно решение менеджера.
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Финансы</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Стоимость работ</span>
              <span className="tabular font-medium">
                {formatMoney(totals.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Комиссия, {Math.round(totals.commissionRate * 100)}%
              </span>
              <span className="tabular text-brand font-medium">
                {formatMoney(totals.commission)}
              </span>
            </div>
            <div className="border-border flex items-center justify-between border-t pt-3">
              <span className="font-semibold">Итого</span>
              <span className="tabular font-semibold">
                {formatMoney(totals.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
