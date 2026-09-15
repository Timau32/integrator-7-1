"use client";

import { Plus } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NewStageInput } from "@/lib/domain/stage";
import { createId } from "@/lib/format";

interface AddStageFormProps {
  onAdd: (stage: NewStageInput) => void;
}

interface FormErrors {
  title?: string;
  plannedStart?: string;
  plannedEnd?: string;
}

const EMPTY = { title: "", assignee: "", plannedStart: "", plannedEnd: "" };

/** Форма добавления этапа. Новый этап всегда создаётся в статусе «Не начат». */
export function AddStageForm({ onAdd }: AddStageFormProps) {
  const ids = {
    title: useId(),
    assignee: useId(),
    plannedStart: useId(),
    plannedEnd: useId(),
  };
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});

  function update(field: keyof typeof EMPTY, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!values.title.trim()) nextErrors.title = "Укажите название этапа";
    if (!values.plannedStart) nextErrors.plannedStart = "Укажите дату начала";
    if (!values.plannedEnd) nextErrors.plannedEnd = "Укажите дату окончания";
    if (
      values.plannedStart &&
      values.plannedEnd &&
      values.plannedEnd < values.plannedStart
    ) {
      nextErrors.plannedEnd = "Окончание не может быть раньше начала";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onAdd({
      id: createId("stg"),
      title: values.title,
      assignee: values.assignee,
      plannedStart: values.plannedStart,
      plannedEnd: values.plannedEnd,
    });
    setValues(EMPTY);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={ids.title}>Название этапа</Label>
          <Input
            id={ids.title}
            value={values.title}
            aria-invalid={Boolean(errors.title)}
            placeholder="Например: Монтаж тёплого пола"
            onChange={(event) => update("title", event.target.value)}
          />
          {errors.title && (
            <p role="alert" className="text-destructive text-sm">
              {errors.title}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={ids.assignee}>
            Ответственный
            <span className="text-muted-foreground font-normal">
              (необязательно)
            </span>
          </Label>
          <Input
            id={ids.assignee}
            value={values.assignee}
            placeholder="Бригада №4"
            onChange={(event) => update("assignee", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={ids.plannedStart}>Плановое начало</Label>
          <Input
            id={ids.plannedStart}
            type="date"
            value={values.plannedStart}
            aria-invalid={Boolean(errors.plannedStart)}
            onChange={(event) => update("plannedStart", event.target.value)}
          />
          {errors.plannedStart && (
            <p role="alert" className="text-destructive text-sm">
              {errors.plannedStart}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={ids.plannedEnd}>Плановое окончание</Label>
          <Input
            id={ids.plannedEnd}
            type="date"
            value={values.plannedEnd}
            aria-invalid={Boolean(errors.plannedEnd)}
            onChange={(event) => update("plannedEnd", event.target.value)}
          />
          {errors.plannedEnd && (
            <p role="alert" className="text-destructive text-sm">
              {errors.plannedEnd}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="brand">
          <Plus aria-hidden />
          Добавить этап
        </Button>
      </div>
    </form>
  );
}
