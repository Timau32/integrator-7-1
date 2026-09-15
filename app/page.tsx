import { redirect } from "next/navigation";

/** Корень приложения ведёт в реестр объектов. */
export default function Home() {
  redirect("/objects");
}
