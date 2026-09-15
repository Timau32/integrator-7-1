import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: "Интегратор 7/1",
    template: "%s · Интегратор 7/1",
  },
  description:
    "Платформа управления ремонтом: паспорт объекта, этапы работ и смета с комиссией 7%.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link href="/objects" className="flex items-center gap-2">
              <span className="bg-brand text-brand-foreground tabular grid size-7 place-items-center rounded-md text-xs font-bold">
                7/1
              </span>
              <span className="text-sm font-semibold tracking-tight">
                Интегратор
              </span>
            </Link>
            <span className="text-muted-foreground ml-auto text-sm">
              Паспорт объекта
            </span>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="text-muted-foreground border-t py-6 text-center text-xs">
          Демо-стенд платформы «Интегратор 7/1» · комиссия платформы 7%
        </footer>
      </body>
    </html>
  );
}
