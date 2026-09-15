import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ObjectPassportView } from "./object-passport-view";
import type { ObjectPassport } from "@/lib/domain/types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function makePassport(): ObjectPassport {
  return {
    id: "obj-test",
    name: "Тестовая квартира",
    kind: "apartment",
    address: "Москва, ул. Тестовая, 1",
    area: 50,
    rooms: 2,
    floor: 3,
    floorsTotal: 9,
    clientName: "Иванов Иван",
    clientPhone: "+7 900 000-00-00",
    manager: "Петров Пётр",
    createdAt: "2026-09-01",
    deadline: "2026-12-01",
    stages: [
      {
        id: "stg-1",
        title: "Демонтаж перегородок",
        status: "pending",
        plannedStart: "2026-09-02",
        plannedEnd: "2026-09-12",
        history: [],
      },
      {
        id: "stg-2",
        title: "Черновая электрика",
        status: "in_progress",
        plannedStart: "2026-09-13",
        plannedEnd: "2026-09-30",
        actualStart: "2026-09-13",
        history: [],
      },
    ],
    estimate: [
      { id: "est-1", name: "Демонтаж", unit: "м²", quantity: 10, price: 1000 },
    ],
  };
}

/** Открывает вкладку по её подписи. */
async function openTab(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("tab", { name }));
}

/**
 * jsdom принимает значение `input[type=date]` только целиком, поэтому
 * плановые даты задаём одним событием change, а не посимвольным вводом.
 */
function setDate(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

/**
 * Карточка этапа по заголовку.
 *
 * Ищем прямым запросом по DOM: при открытой модалке Radix помечает фон
 * `aria-hidden`, и `getByRole` перестал бы находить карточки.
 */
function stageCard(title: string): HTMLElement {
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>("[data-testid='stage-card']"),
  );
  const card = cards.find(
    (candidate) => candidate.querySelector("h3")?.textContent === title,
  );
  if (!card) throw new Error(`Карточка этапа «${title}» не найдена`);
  return card;
}

describe("ObjectPassportView · вкладки", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    render(<ObjectPassportView passport={makePassport()} />);
  });

  it("показывает три вкладки паспорта", () => {
    expect(screen.getByRole("tab", { name: "Основное" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Этапы" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Смета" })).toBeInTheDocument();
  });

  it("по умолчанию открыта вкладка «Основное»", () => {
    expect(screen.getByRole("tab", { name: "Основное" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Москва, ул. Тестовая, 1")).toBeInTheDocument();
  });

  it("переключается на «Этапы» и показывает список", async () => {
    await openTab(user, "Этапы");

    expect(screen.getAllByTestId("stage-card")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "Демонтаж перегородок" }),
    ).toBeInTheDocument();
  });

  it("переключается на «Смета» и показывает таблицу", async () => {
    await openTab(user, "Смета");

    expect(screen.getByTestId("estimate-table")).toBeInTheDocument();
    expect(screen.getAllByTestId("estimate-row")).toHaveLength(1);
  });
});

describe("ObjectPassportView · смена статуса этапа", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(async () => {
    user = userEvent.setup();
    render(<ObjectPassportView passport={makePassport()} />);
    await openTab(user, "Этапы");
  });

  it("открывает модалку только с разрешёнными переходами", async () => {
    await user.click(
      within(stageCard("Демонтаж перегородок")).getByRole("button", {
        name: /Изменить статус/,
      }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("transition-in_progress")).toBeInTheDocument();
    expect(screen.queryByTestId("transition-completed")).not.toBeInTheDocument();
    expect(screen.queryByTestId("transition-blocked")).not.toBeInTheDocument();
  });

  it("применяет переход и обновляет список этапов", async () => {
    await user.click(
      within(stageCard("Демонтаж перегородок")).getByRole("button", {
        name: /Изменить статус/,
      }),
    );
    await user.click(screen.getByTestId("transition-in_progress"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(stageCard("Демонтаж перегородок")).toHaveAttribute(
      "data-status",
      "in_progress",
    );
  });

  it("после старта предлагает уже другой набор переходов", async () => {
    const openDialog = async () =>
      user.click(
        within(stageCard("Демонтаж перегородок")).getByRole("button", {
          name: /Изменить статус/,
        }),
      );

    await openDialog();
    await user.click(screen.getByTestId("transition-in_progress"));
    await openDialog();

    expect(screen.getByTestId("transition-completed")).toBeInTheDocument();
    expect(screen.getByTestId("transition-blocked")).toBeInTheDocument();
    expect(
      screen.queryByTestId("transition-in_progress"),
    ).not.toBeInTheDocument();
  });

  it("сохраняет причину блокировки на карточке этапа", async () => {
    await user.click(
      within(stageCard("Черновая электрика")).getByRole("button", {
        name: /Изменить статус/,
      }),
    );
    await user.type(
      screen.getByLabelText(/Комментарий/),
      "Нет согласования УК",
    );
    await user.click(screen.getByTestId("transition-blocked"));

    const card = stageCard("Черновая электрика");
    expect(card).toHaveAttribute("data-status", "blocked");
    expect(within(card).getByText("Нет согласования УК")).toBeInTheDocument();
  });

  it("не меняет статус, если блокировка отправлена без причины", async () => {
    await user.click(
      within(stageCard("Черновая электрика")).getByRole("button", {
        name: /Изменить статус/,
      }),
    );
    await user.click(screen.getByTestId("transition-blocked"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(stageCard("Черновая электрика")).toHaveAttribute(
      "data-status",
      "in_progress",
    );
  });
});

describe("ObjectPassportView · форма добавления этапа", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(async () => {
    user = userEvent.setup();
    render(<ObjectPassportView passport={makePassport()} />);
    await openTab(user, "Этапы");
  });

  it("добавляет этап в список в статусе «Не начат»", async () => {
    await user.type(
      screen.getByLabelText("Название этапа"),
      "Монтаж натяжного потолка",
    );
    setDate("Плановое начало", "2026-10-01");
    setDate("Плановое окончание", "2026-10-15");
    await user.click(screen.getByRole("button", { name: /Добавить этап/ }));

    expect(screen.getAllByTestId("stage-card")).toHaveLength(3);
    expect(stageCard("Монтаж натяжного потолка")).toHaveAttribute(
      "data-status",
      "pending",
    );
  });

  it("очищает форму после успешного добавления", async () => {
    const title = screen.getByLabelText("Название этапа");

    await user.type(title, "Монтаж дверей");
    setDate("Плановое начало", "2026-10-01");
    setDate("Плановое окончание", "2026-10-15");
    await user.click(screen.getByRole("button", { name: /Добавить этап/ }));

    expect(title).toHaveValue("");
  });

  it("не добавляет этап без названия", async () => {
    await user.click(screen.getByRole("button", { name: /Добавить этап/ }));

    expect(screen.getAllByTestId("stage-card")).toHaveLength(2);
    expect(screen.getByText("Укажите название этапа")).toBeInTheDocument();
  });

  it("не принимает окончание раньше начала", async () => {
    await user.type(screen.getByLabelText("Название этапа"), "Монтаж дверей");
    setDate("Плановое начало", "2026-10-15");
    setDate("Плановое окончание", "2026-10-01");
    await user.click(screen.getByRole("button", { name: /Добавить этап/ }));

    expect(screen.getAllByTestId("stage-card")).toHaveLength(2);
    expect(
      screen.getByText("Окончание не может быть раньше начала"),
    ).toBeInTheDocument();
  });
});

describe("ObjectPassportView · смета", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(async () => {
    user = userEvent.setup();
    render(<ObjectPassportView passport={makePassport()} />);
    await openTab(user, "Смета");
  });

  it("считает итог с комиссией платформы 7%", () => {
    expect(screen.getByTestId("estimate-subtotal")).toHaveTextContent("10 000,00");
    expect(screen.getByTestId("estimate-commission")).toHaveTextContent("700,00");
    expect(screen.getByTestId("estimate-total")).toHaveTextContent("10 700,00");
  });

  it("добавляет позицию и пересчитывает итог", async () => {
    await user.type(screen.getByLabelText("Наименование"), "Стяжка пола");
    await user.type(screen.getByLabelText("Единица"), "м²");
    await user.type(screen.getByLabelText("Кол-во"), "10");
    await user.type(screen.getByLabelText("Цена, ₽"), "1000");
    await user.click(screen.getByRole("button", { name: /Добавить позицию/ }));

    expect(screen.getAllByTestId("estimate-row")).toHaveLength(2);
    /** 20 000 работ + 1 400 комиссии = 21 400. */
    expect(screen.getByTestId("estimate-commission")).toHaveTextContent(
      "1 400,00",
    );
    expect(screen.getByTestId("estimate-total")).toHaveTextContent("21 400,00");
  });

  it("принимает количество с запятой как десятичный разделитель", async () => {
    await user.type(screen.getByLabelText("Наименование"), "Плинтус");
    await user.type(screen.getByLabelText("Единица"), "пог. м");
    await user.type(screen.getByLabelText("Кол-во"), "2,5");
    await user.type(screen.getByLabelText("Цена, ₽"), "200");
    await user.click(screen.getByRole("button", { name: /Добавить позицию/ }));

    const rows = screen.getAllByTestId("estimate-row");
    expect(rows).toHaveLength(2);
    expect(within(rows[1]).getByText(/500,00/)).toBeInTheDocument();
  });

  it("не добавляет позицию с нулевым количеством", async () => {
    await user.type(screen.getByLabelText("Наименование"), "Плинтус");
    await user.type(screen.getByLabelText("Единица"), "пог. м");
    await user.type(screen.getByLabelText("Кол-во"), "0");
    await user.type(screen.getByLabelText("Цена, ₽"), "200");
    await user.click(screen.getByRole("button", { name: /Добавить позицию/ }));

    expect(screen.getAllByTestId("estimate-row")).toHaveLength(1);
    expect(
      screen.getByText("Количество должно быть больше нуля"),
    ).toBeInTheDocument();
  });

  it("удаляет позицию из сметы", async () => {
    await user.click(
      screen.getByRole("button", { name: /Удалить позицию/ }),
    );

    expect(screen.queryAllByTestId("estimate-row")).toHaveLength(0);
    expect(screen.getByTestId("estimate-total")).toHaveTextContent("0,00");
  });
});
