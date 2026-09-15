import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, TriangleAlert } from "lucide-react";

import { StatusBadge } from "@/components/passport/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OBJECT_PASSPORTS, PROPERTY_KIND_LABEL } from "@/lib/data/objects";
import { calculateEstimate } from "@/lib/domain/estimate";
import { summarizeStages } from "@/lib/domain/progress";
import { formatDate, formatMoney, formatNumber, pluralize } from "@/lib/format";

export const metadata: Metadata = {
  title: "Объекты",
  description: "Реестр объектов платформы «Интегратор 7/1».",
};

/** Реестр объектов: точка входа в паспорт каждого объекта. */
export default function ObjectsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Объекты
        </h1>
        <p className="text-muted-foreground text-sm">
          {OBJECT_PASSPORTS.length}{" "}
          {pluralize(OBJECT_PASSPORTS.length, ["объект", "объекта", "объектов"])}{" "}
          в работе. Откройте паспорт, чтобы вести этапы и смету.
        </p>
      </header>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {OBJECT_PASSPORTS.map((passport) => {
          const summary = summarizeStages(passport.stages);
          const totals = calculateEstimate(passport.estimate);
          const currentStage = passport.stages.find(
            (stage) => stage.status === "in_progress",
          );

          return (
            <li key={passport.id}>
              <Card className="hover:border-ring relative h-full transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {PROPERTY_KIND_LABEL[passport.kind]}
                    </Badge>
                    {summary.hasBlockers && (
                      <Badge variant="blocked" className="gap-1">
                        <TriangleAlert aria-hidden />
                        Блокировка
                      </Badge>
                    )}
                  </div>
                  <CardTitle>
                    <Link
                      href={`/objects/${passport.id}`}
                      className="after:absolute after:inset-0 hover:underline"
                    >
                      {passport.name}
                    </Link>
                  </CardTitle>
                  <CardDescription>{passport.address}</CardDescription>
                </CardHeader>

                <CardContent className="grid gap-4">
                  <div className="space-y-2">
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <span>Готовность</span>
                      <span className="tabular">
                        {summary.completionPercent}%
                      </span>
                    </div>
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                      <div
                        className="bg-brand h-full rounded-full"
                        style={{ width: `${summary.completionPercent}%` }}
                      />
                    </div>
                  </div>

                  {currentStage ? (
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground text-xs">
                        Текущий этап
                      </p>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">
                          {currentStage.title}
                        </p>
                        <StatusBadge status={currentStage.status} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Активных этапов нет
                    </p>
                  )}

                  <dl className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground text-xs">Площадь</dt>
                      <dd className="tabular font-medium">
                        {formatNumber(passport.area)} м²
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs">Сдача</dt>
                      <dd className="tabular font-medium">
                        {formatDate(passport.deadline)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted-foreground text-xs">
                        Смета с комиссией
                      </dt>
                      <dd className="tabular font-medium">
                        {formatMoney(totals.total)}
                      </dd>
                    </div>
                  </dl>

                  <span className="text-brand flex items-center gap-1 text-sm font-medium">
                    Открыть паспорт
                    <ArrowUpRight aria-hidden className="size-4" />
                  </span>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
