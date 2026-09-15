import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StageStatusDialog } from "./stage-status-dialog";
import { STAGE_STATUS_LABEL } from "@/lib/domain/status";
import type { Stage, StageStatus } from "@/lib/domain/types";

function makeStage(status: StageStatus): Stage {
  return {
    id: "stg-1",
    title: "Штукатурка стен",
    status,
    plannedStart: "2026-09-01",
    plannedEnd: "2026-09-30",
    history: [],
  };
}

function renderDialog(status: StageStatus) {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();

  render(
    <StageStatusDialog
      stage={makeStage(status)}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
    />,
  );

  return { onConfirm, onOpenChange, user: userEvent.setup() };
}

/** Заголовки всех кнопок переходов, отрисованных в модалке. */
function visibleTransitions(): StageStatus[] {
  return screen
    .getAllByRole("button")
    .map((button) => button.getAttribute("data-testid"))
    .filter((testId): testId is string => Boolean(testId?.startsWith("transition-")))
    .map((testId) => testId.replace("transition-", "") as StageStatus);
}

describe("StageStatusDialog · состав переходов", () => {
  it("из «Не начат» показывает только «Взять в работу»", () => {
    renderDialog("pending");
    expect(visibleTransitions()).toEqual(["in_progress"]);
  });

  it("из «В работе» показывает завершение и блокировку", () => {
    renderDialog("in_progress");
    expect(visibleTransitions()).toEqual(["completed", "blocked"]);
  });

  it("из «Завершён» показывает только возврат в работу", () => {
    renderDialog("completed");
    expect(visibleTransitions()).toEqual(["in_progress"]);
  });

  it("из «Заблокирован» показывает только возобновление", () => {
    renderDialog("blocked");
    expect(visibleTransitions()).toEqual(["in_progress"]);
  });

  it("не показывает запрещённый переход «Не начат» → «Завершён»", () => {
    renderDialog("pending");
    expect(screen.queryByTestId("transition-completed")).not.toBeInTheDocument();
    expect(screen.queryByTestId("transition-blocked")).not.toBeInTheDocument();
  });

  it("не показывает запрещённый переход «Завершён» → «Заблокирован»", () => {
    renderDialog("completed");
    expect(screen.queryByTestId("transition-blocked")).not.toBeInTheDocument();
  });

  it("не показывает запрещённый переход «Заблокирован» → «Завершён»", () => {
    renderDialog("blocked");
    expect(screen.queryByTestId("transition-completed")).not.toBeInTheDocument();
  });

  it.each(["pending", "in_progress", "completed", "blocked"] as const)(
    "не предлагает переход в текущий статус (%s)",
    (status) => {
      renderDialog(status);
      expect(visibleTransitions()).not.toContain(status);
    },
  );

  it("показывает текущий статус этапа", () => {
    renderDialog("in_progress");
    expect(
      screen.getByTestId("status-badge-in_progress"),
    ).toHaveTextContent(STAGE_STATUS_LABEL.in_progress);
  });
});

describe("StageStatusDialog · подтверждение перехода", () => {
  it("сообщает выбранный статус наверх", async () => {
    const { onConfirm, user } = renderDialog("pending");

    await user.click(screen.getByTestId("transition-in_progress"));

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith("in_progress", undefined);
  });

  it("передаёт комментарий вместе с переходом", async () => {
    const { onConfirm, user } = renderDialog("in_progress");

    await user.type(screen.getByLabelText(/Комментарий/), "Акт подписан");
    await user.click(screen.getByTestId("transition-completed"));

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith(
      "completed",
      "Акт подписан",
    );
  });

  it("не пропускает блокировку без причины", async () => {
    const { onConfirm, user } = renderDialog("in_progress");

    await user.click(screen.getByTestId("transition-blocked"));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/блокирует этап/i);
  });

  it("пропускает блокировку после указания причины", async () => {
    const { onConfirm, user } = renderDialog("in_progress");

    await user.click(screen.getByTestId("transition-blocked"));
    await user.type(screen.getByLabelText(/Комментарий/), "Нет согласования УК");
    await user.click(screen.getByTestId("transition-blocked"));

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith(
      "blocked",
      "Нет согласования УК",
    );
  });

  it("закрывается по кнопке «Отмена» без изменения статуса", async () => {
    const { onConfirm, onOpenChange, user } = renderDialog("pending");

    await user.click(screen.getByRole("button", { name: "Отмена" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe("StageStatusDialog · закрытое состояние", () => {
  it("ничего не рендерит без выбранного этапа", () => {
    render(
      <StageStatusDialog
        stage={null}
        onConfirm={vi.fn()}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
