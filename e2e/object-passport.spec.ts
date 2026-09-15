import { expect, test, type Page } from "@playwright/test";

const OBJECT_URL = "/objects/obj-1024";

/**
 * Карточка этапа по его заголовку.
 *
 * Фильтруем по тексту, а не по роли: при открытой модалке Radix помечает фон
 * `aria-hidden`, и ролевые локаторы перестают находить карточки.
 */
function stageCard(page: Page, title: string) {
  return page.getByTestId("stage-card").filter({ hasText: title });
}

/** Открывает модалку смены статуса для указанного этапа. */
async function openStatusDialog(page: Page, title: string) {
  await stageCard(page, title)
    .getByRole("button", { name: /Изменить статус/ })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test.describe("Реестр объектов", () => {
  test("открывает паспорт объекта из списка", async ({ page }) => {
    await page.goto("/objects");

    await expect(
      page.getByRole("heading", { name: "Объекты", level: 1 }),
    ).toBeVisible();

    await page
      .getByRole("link", { name: "2-комнатная на Ленинском" })
      .click();

    await expect(
      page.getByRole("heading", { name: "2-комнатная на Ленинском", level: 1 }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${OBJECT_URL}$`));
  });

  test("корень перенаправляет в реестр объектов", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/objects$/);
  });
});

test.describe("Паспорт объекта · вкладки", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(OBJECT_URL);
  });

  test("показывает три вкладки и переключается между ними", async ({
    page,
  }) => {
    await expect(page.getByRole("tab", { name: "Основное" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.getByRole("tab", { name: "Этапы" }).click();
    await expect(page.getByTestId("stage-card").first()).toBeVisible();

    await page.getByRole("tab", { name: "Смета" }).click();
    await expect(page.getByTestId("estimate-table")).toBeVisible();
  });
});

test.describe("Паспорт объекта · переходы статусов", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(OBJECT_URL);
    await page.getByRole("tab", { name: "Этапы" }).click();
  });

  test("из «Не начат» доступен только переход в работу", async ({ page }) => {
    await openStatusDialog(page, "Штукатурка стен и стяжка пола");

    await expect(page.getByTestId("transition-in_progress")).toBeVisible();
    await expect(page.getByTestId("transition-completed")).toHaveCount(0);
    await expect(page.getByTestId("transition-blocked")).toHaveCount(0);
  });

  test("запрещённый переход «Завершён» → «Заблокирован» не предлагается", async ({
    page,
  }) => {
    await openStatusDialog(page, "Демонтаж перегородок и старой отделки");

    await expect(page.getByTestId("transition-in_progress")).toBeVisible();
    await expect(page.getByTestId("transition-blocked")).toHaveCount(0);
    await expect(page.getByTestId("transition-completed")).toHaveCount(0);
  });

  test("запрещённый переход «Заблокирован» → «Завершён» не предлагается", async ({
    page,
  }) => {
    await openStatusDialog(page, "Разводка водоснабжения и канализации");

    await expect(page.getByTestId("transition-in_progress")).toBeVisible();
    await expect(page.getByTestId("transition-completed")).toHaveCount(0);
  });

  test("переводит этап в работу, список обновляется", async ({ page }) => {
    const card = stageCard(page, "Штукатурка стен и стяжка пола");
    await expect(card).toHaveAttribute("data-status", "pending");

    await openStatusDialog(page, "Штукатурка стен и стяжка пола");
    await page.getByTestId("transition-in_progress").click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(card).toHaveAttribute("data-status", "in_progress");
    await expect(card.getByTestId("status-badge-in_progress")).toBeVisible();
  });

  test("блокировка требует причину и показывает её на карточке", async ({
    page,
  }) => {
    const card = stageCard(page, "Черновая электрика и слаботочка");

    await openStatusDialog(page, "Черновая электрика и слаботочка");
    await page.getByTestId("transition-blocked").click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(card).toHaveAttribute("data-status", "in_progress");

    await page.getByLabel(/Комментарий/).fill("Нет допуска на объект");
    await page.getByTestId("transition-blocked").click();

    await expect(card).toHaveAttribute("data-status", "blocked");
    await expect(card.getByText("Нет допуска на объект")).toBeVisible();
  });

  test("проводит этап по полному циклу до завершения", async ({ page }) => {
    const title = "Приёмка работ заказчиком";
    const card = stageCard(page, title);

    await openStatusDialog(page, title);
    await page.getByTestId("transition-in_progress").click();
    await expect(card).toHaveAttribute("data-status", "in_progress");

    await openStatusDialog(page, title);
    await page.getByTestId("transition-completed").click();
    await expect(card).toHaveAttribute("data-status", "completed");
  });
});

test.describe("Паспорт объекта · формы", () => {
  test("добавляет этап в список", async ({ page }) => {
    await page.goto(OBJECT_URL);
    await page.getByRole("tab", { name: "Этапы" }).click();

    const before = await page.getByTestId("stage-card").count();

    await page.getByLabel("Название этапа").fill("Монтаж кондиционера");
    await page.getByLabel("Ответственный").fill("Климат-сервис");
    await page.getByLabel("Плановое начало").fill("2026-10-01");
    await page.getByLabel("Плановое окончание").fill("2026-10-08");
    await page.getByRole("button", { name: /Добавить этап/ }).click();

    await expect(page.getByTestId("stage-card")).toHaveCount(before + 1);
    await expect(
      stageCard(page, "Монтаж кондиционера"),
    ).toHaveAttribute("data-status", "pending");
  });

  test("добавляет позицию сметы и пересчитывает комиссию 7%", async ({
    page,
  }) => {
    await page.goto(OBJECT_URL);
    await page.getByRole("tab", { name: "Смета" }).click();

    const before = await page.getByTestId("estimate-row").count();

    await page.getByLabel("Наименование").fill("Монтаж кондиционера");
    await page.getByLabel("Единица").fill("шт");
    await page.getByLabel("Кол-во").fill("2");
    await page.getByLabel("Цена, ₽").fill("10000");
    await page.getByRole("button", { name: /Добавить позицию/ }).click();

    await expect(page.getByTestId("estimate-row")).toHaveCount(before + 1);

    const subtotal = await readMoney(page, "estimate-subtotal");
    const commission = await readMoney(page, "estimate-commission");
    const total = await readMoney(page, "estimate-total");

    expect(commission).toBeCloseTo(Number((subtotal * 0.07).toFixed(2)), 2);
    expect(total).toBeCloseTo(Number((subtotal + commission).toFixed(2)), 2);
  });
});

/** Читает денежное значение из элемента, отбрасывая разделители и символ ₽. */
async function readMoney(page: Page, testId: string): Promise<number> {
  const raw = (await page.getByTestId(testId).innerText()).trim();
  const normalized = raw
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return Number(normalized);
}
