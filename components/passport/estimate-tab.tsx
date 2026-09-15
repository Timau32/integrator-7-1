"use client";

import { Trash2 } from "lucide-react";

import { AddEstimateItemForm } from "@/components/passport/add-estimate-item-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateEstimate, lineTotal } from "@/lib/domain/estimate";
import type { NewEstimateItemInput } from "@/lib/domain/passport-reducer";
import type { EstimateItem } from "@/lib/domain/types";
import { formatMoney, formatNumber, pluralize } from "@/lib/format";

interface EstimateTabProps {
  items: readonly EstimateItem[];
  onAddItem: (item: NewEstimateItemInput) => void;
  onRemoveItem: (id: string) => void;
}

/** Вкладка «Смета»: позиции, итог и комиссия платформы 7%. */
export function EstimateTab({
  items,
  onAddItem,
  onRemoveItem,
}: EstimateTabProps) {
  const totals = calculateEstimate(items);
  const commissionPercent = Math.round(totals.commissionRate * 100);

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Смета</CardTitle>
          <CardDescription>
            {totals.itemsCount}{" "}
            {pluralize(totals.itemsCount, ["позиция", "позиции", "позиций"])} в
            расчёте
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="text-muted-foreground m-5 rounded-lg border border-dashed p-10 text-center text-sm">
              Смета пуста. Добавьте первую позицию в форме ниже.
            </p>
          ) : (
            <Table data-testid="estimate-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Наименование</TableHead>
                  <TableHead>Ед.</TableHead>
                  <TableHead className="text-right">Кол-во</TableHead>
                  <TableHead className="text-right">Цена</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead className="w-12 pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} data-testid="estimate-row">
                    <TableCell className="pl-5 font-medium">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.unit}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatNumber(item.quantity)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatMoney(item.price)}
                    </TableCell>
                    <TableCell className="tabular text-right font-medium">
                      {formatMoney(lineTotal(item))}
                    </TableCell>
                    <TableCell className="pr-5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive size-8"
                        aria-label={`Удалить позицию «${item.name}»`}
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Стоимость работ</span>
            <span className="tabular font-medium" data-testid="estimate-subtotal">
              {formatMoney(totals.subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Комиссия платформы, {commissionPercent}%
            </span>
            <span
              className="tabular text-brand font-medium"
              data-testid="estimate-commission"
            >
              {formatMoney(totals.commission)}
            </span>
          </div>
          <div className="border-border flex items-center justify-between border-t pt-3">
            <span className="font-semibold">Итого к оплате</span>
            <span
              className="tabular text-lg font-semibold"
              data-testid="estimate-total"
            >
              {formatMoney(totals.total)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Добавить позицию</CardTitle>
          <CardDescription>
            Сумма строки и итог пересчитываются автоматически.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddEstimateItemForm onAdd={onAddItem} />
        </CardContent>
      </Card>
    </div>
  );
}
