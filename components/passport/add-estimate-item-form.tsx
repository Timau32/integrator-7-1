"use client";

import { Plus } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lineTotal } from "@/lib/domain/estimate";
import type { NewEstimateItemInput } from "@/lib/domain/passport-reducer";
import { createId, formatMoney } from "@/lib/format";

interface AddEstimateItemFormProps {
  onAdd: (item: NewEstimateItemInput) => void;
}

interface FormErrors {
  name?: string;
  unit?: string;
  quantity?: string;
  price?: string;
}

const EMPTY = { name: "", unit: "", quantity: "", price: "" };

/** Приводит ввод к числу, принимая и точку, и запятую как разделитель. */
function parseAmount(raw: string): number {
  return Number.parseFloat(raw.replace(",", "."));
}

/** Форма добавления позиции сметы с живым предпросмотром суммы строки. */
export function AddEstimateItemForm({ onAdd }: AddEstimateItemFormProps) {
  const ids = {
    name: useId(),
    unit: useId(),
    quantity: useId(),
    price: useId(),
  };
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});

  const quantity = parseAmount(values.quantity);
  const price = parseAmount(values.price);
  const preview =
    Number.isFinite(quantity) && Number.isFinite(price)
      ? lineTotal({ quantity, price })
      : null;

  function update(field: keyof typeof EMPTY, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!values.name.trim()) nextErrors.name = "Укажите наименование";
    if (!values.unit.trim()) nextErrors.unit = "Укажите единицу";
    if (!Number.isFinite(quantity) || quantity <= 0) {
      nextErrors.quantity = "Количество должно быть больше нуля";
    }
    if (!Number.isFinite(price) || price < 0) {
      nextErrors.price = "Цена не может быть отрицательной";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onAdd({
      id: createId("est"),
      name: values.name,
      unit: values.unit,
      quantity,
      price,
    });
    setValues(EMPTY);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor={ids.name}>Наименование</Label>
          <Input
            id={ids.name}
            value={values.name}
            aria-invalid={Boolean(errors.name)}
            placeholder="Например: Монтаж натяжного потолка"
            onChange={(event) => update("name", event.target.value)}
          />
          {errors.name && (
            <p role="alert" className="text-destructive text-sm">
              {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={ids.unit}>Единица</Label>
          <Input
            id={ids.unit}
            value={values.unit}
            list="estimate-units"
            aria-invalid={Boolean(errors.unit)}
            placeholder="м²"
            onChange={(event) => update("unit", event.target.value)}
          />
          <datalist id="estimate-units">
            <option value="м²" />
            <option value="м³" />
            <option value="пог. м" />
            <option value="шт" />
            <option value="точка" />
            <option value="компл." />
          </datalist>
          {errors.unit && (
            <p role="alert" className="text-destructive text-sm">
              {errors.unit}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-1">
          <div className="space-y-2">
            <Label htmlFor={ids.quantity}>Кол-во</Label>
            <Input
              id={ids.quantity}
              inputMode="decimal"
              value={values.quantity}
              aria-invalid={Boolean(errors.quantity)}
              placeholder="12,5"
              onChange={(event) => update("quantity", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={ids.price}>Цена, ₽</Label>
            <Input
              id={ids.price}
              inputMode="decimal"
              value={values.price}
              aria-invalid={Boolean(errors.price)}
              placeholder="1500"
              onChange={(event) => update("price", event.target.value)}
            />
          </div>
        </div>
      </div>

      {(errors.quantity || errors.price) && (
        <p role="alert" className="text-destructive text-sm">
          {errors.quantity ?? errors.price}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Сумма строки:{" "}
          <span className="text-foreground tabular font-medium">
            {preview !== null ? formatMoney(preview) : "—"}
          </span>
        </p>
        <Button type="submit" variant="brand">
          <Plus aria-hidden />
          Добавить позицию
        </Button>
      </div>
    </form>
  );
}
