import { applyStageTransition, createStage, type NewStageInput } from "./stage";
import type { EstimateItem, ObjectPassport, StageStatus } from "./types";

/** Черновик позиции сметы из формы. */
export interface NewEstimateItemInput {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
}

/** Действия над паспортом объекта. */
export type PassportAction =
  | { type: "stage/add"; payload: NewStageInput }
  | {
      type: "stage/changeStatus";
      payload: {
        stageId: string;
        to: StageStatus;
        changeId: string;
        at: string;
        comment?: string;
      };
    }
  | { type: "estimate/add"; payload: NewEstimateItemInput }
  | { type: "estimate/remove"; payload: { id: string } };

/**
 * Редьюсер паспорта объекта.
 *
 * Все правила перехода статусов живут в доменном слое — редьюсер только
 * маршрутизирует действия и пробрасывает доменные ошибки наверх.
 */
export function passportReducer(
  state: ObjectPassport,
  action: PassportAction,
): ObjectPassport {
  switch (action.type) {
    case "stage/add":
      return { ...state, stages: [...state.stages, createStage(action.payload)] };

    case "stage/changeStatus": {
      const { stageId, ...transition } = action.payload;
      const target = state.stages.find((stage) => stage.id === stageId);
      if (!target) return state;

      const updated = applyStageTransition(target, transition);
      return {
        ...state,
        stages: state.stages.map((stage) =>
          stage.id === stageId ? updated : stage,
        ),
      };
    }

    case "estimate/add": {
      const item: EstimateItem = {
        ...action.payload,
        name: action.payload.name.trim(),
        unit: action.payload.unit.trim(),
      };
      return { ...state, estimate: [...state.estimate, item] };
    }

    case "estimate/remove":
      return {
        ...state,
        estimate: state.estimate.filter(
          (item) => item.id !== action.payload.id,
        ),
      };

    default: {
      /** Проверка исчерпывающей обработки: новый тип действия сломает сборку. */
      action satisfies never;
      return state;
    }
  }
}
