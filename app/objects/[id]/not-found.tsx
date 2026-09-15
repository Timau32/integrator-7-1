import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Экран отсутствующего объекта. */
export default function ObjectNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-brand tabular text-5xl font-semibold">404</p>
      <h1 className="text-xl font-semibold">Объект не найден</h1>
      <p className="text-muted-foreground text-sm">
        Паспорт с таким идентификатором отсутствует в реестре платформы.
      </p>
      <Button asChild variant="brand">
        <Link href="/objects">Вернуться к объектам</Link>
      </Button>
    </div>
  );
}
