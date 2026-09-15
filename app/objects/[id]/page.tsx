import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ObjectPassportView } from "@/components/passport/object-passport-view";
import { findObjectPassport, OBJECT_PASSPORTS } from "@/lib/data/objects";

/** Пререндерим паспорта всех объектов из реестра. */
export function generateStaticParams() {
  return OBJECT_PASSPORTS.map((passport) => ({ id: passport.id }));
}

export async function generateMetadata(
  props: PageProps<"/objects/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const passport = findObjectPassport(id);

  if (!passport) return { title: "Объект не найден" };

  return {
    title: passport.name,
    description: `Паспорт объекта: ${passport.address}`,
  };
}

/** Паспорт объекта — серверный компонент отдаёт начальный снимок данных. */
export default async function ObjectPassportPage(
  props: PageProps<"/objects/[id]">,
) {
  const { id } = await props.params;
  const passport = findObjectPassport(id);

  if (!passport) notFound();

  return <ObjectPassportView passport={passport} />;
}
