import { buildInitialState, duplicateStore, rebaseStateFromTemplate } from "@/lib/seeds";
import { createId, deepClone } from "@/lib/utils";
import type { AppState, CategoryKey, PriceCatalogItem, Temperature } from "@/lib/types";

type StoreNumericSection =
  | "sales"
  | "variableCosts"
  | "labor"
  | "fixedCosts"
  | "loss";

type MenuVariantField = "price" | "cupSizeMl" | "shotCount" | "enabled";

export type AppAction =
  | { type: "hydrate"; state: AppState }
  | { type: "completeWizard" }
  | { type: "setAnalysisMode"; mode: AppState["analysisMode"] }
  | { type: "setTargetMonthlyNetProfit"; value: number }
  | { type: "selectStore"; storeId: string }
  | { type: "setSalesBasis"; value: AppState["wizard"]["salesBasis"] }
  | { type: "setStoreMode"; value: AppState["wizard"]["storeMode"] }
  | { type: "setVatMode"; value: AppState["wizard"]["vatMode"] }
  | { type: "applyTemplate"; templateId: string }
  | { type: "updateCategory"; storeId: string; categoryKey: CategoryKey; patch: Partial<AppState["stores"][number]["categories"][CategoryKey]> }
  | { type: "updateStoreField"; storeId: string; section: StoreNumericSection; field: string; value: number }
  | { type: "updateCatalogItem"; catalog: "ingredients" | "packaging"; itemId: string; patch: Partial<PriceCatalogItem> }
  | { type: "updateMenuField"; storeId: string; menuId: string; field: "share" | "hotShare"; value: number }
  | { type: "updateMenuVariantField"; storeId: string; menuId: string; temperature: Temperature; field: MenuVariantField; value: number | boolean }
  | { type: "updateMenuUsage"; storeId: string; menuId: string; temperature: Temperature; usageKind: "recipe" | "packaging"; itemId: string; value: number }
  | { type: "addStore" }
  | { type: "duplicateStore"; storeId: string }
  | { type: "removeStore"; storeId: string }
  | { type: "applyStoreToAll"; storeId: string }
  | { type: "resetState" };

function updateStore(
  state: AppState,
  storeId: string,
  updater: (store: AppState["stores"][number]) => AppState["stores"][number],
) {
  return {
    ...state,
    stores: state.stores.map((store) => (store.id === storeId ? updater(store) : store)),
  };
}

export function createInitialAppState() {
  return buildInitialState();
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "completeWizard":
      return {
        ...state,
        wizard: {
          ...state.wizard,
          completed: true,
        },
      };
    case "setAnalysisMode":
      return { ...state, analysisMode: action.mode };
    case "setTargetMonthlyNetProfit":
      return { ...state, targetMonthlyNetProfit: Math.max(0, action.value) };
    case "selectStore":
      return { ...state, selectedStoreId: action.storeId };
    case "setSalesBasis":
      return {
        ...state,
        wizard: { ...state.wizard, salesBasis: action.value },
      };
    case "setStoreMode": {
      if (action.value === state.wizard.storeMode) {
        return state;
      }

      if (action.value === "single") {
        const firstStore = state.stores[0];
        return {
          ...state,
          wizard: { ...state.wizard, storeMode: action.value },
          stores: [firstStore],
          selectedStoreId: firstStore.id,
        };
      }

      const secondStore = duplicateStore(state.stores[0]);
      secondStore.name = "매장 2";
      return {
        ...state,
        wizard: { ...state.wizard, storeMode: action.value },
        stores: [...state.stores, secondStore],
      };
    }
    case "setVatMode":
      return {
        ...state,
        wizard: { ...state.wizard, vatMode: action.value },
      };
    case "applyTemplate":
      return rebaseStateFromTemplate(state, action.templateId);
    case "updateCategory":
      return updateStore(state, action.storeId, (store) => ({
        ...store,
        categories: {
          ...store.categories,
          [action.categoryKey]: {
            ...store.categories[action.categoryKey],
            ...action.patch,
          },
        },
      }));
    case "updateStoreField":
      return updateStore(state, action.storeId, (store) => ({
        ...store,
        [action.section]: {
          ...store[action.section],
          [action.field]: action.value,
        },
      }));
    case "updateCatalogItem":
      return {
        ...state,
        priceCatalog: {
          ...state.priceCatalog,
          [action.catalog]: state.priceCatalog[action.catalog].map((item) =>
            item.id === action.itemId ? { ...item, ...action.patch } : item,
          ),
        },
      };
    case "updateMenuField":
      return updateStore(state, action.storeId, (store) => ({
        ...store,
        menus: store.menus.map((menu) =>
          menu.id === action.menuId ? { ...menu, [action.field]: action.value } : menu,
        ),
      }));
    case "updateMenuVariantField":
      return updateStore(state, action.storeId, (store) => ({
        ...store,
        menus: store.menus.map((menu) => {
          if (menu.id !== action.menuId) {
            return menu;
          }

          const variant = menu.variants[action.temperature];
          if (!variant) {
            return menu;
          }

          return {
            ...menu,
            variants: {
              ...menu.variants,
              [action.temperature]: {
                ...variant,
                [action.field]: action.value,
              },
            },
          };
        }),
      }));
    case "updateMenuUsage":
      return updateStore(state, action.storeId, (store) => ({
        ...store,
        menus: store.menus.map((menu) => {
          if (menu.id !== action.menuId) {
            return menu;
          }

          const variant = menu.variants[action.temperature];
          if (!variant) {
            return menu;
          }

          const usageList =
            action.usageKind === "recipe" ? variant.recipe : variant.packaging;
          const nextUsageList = usageList.map((usage) =>
            usage.itemId === action.itemId
              ? {
                  ...usage,
                  [action.usageKind === "recipe" ? "amount" : "quantity"]: action.value,
                }
              : usage,
          );

          return {
            ...menu,
            variants: {
              ...menu.variants,
              [action.temperature]: {
                ...variant,
                [action.usageKind]: nextUsageList,
              },
            },
          };
        }),
      }));
    case "addStore": {
      const newStore = duplicateStore(state.stores[state.stores.length - 1]);
      newStore.id = createId("store");
      newStore.name = `매장 ${state.stores.length + 1}`;
      return {
        ...state,
        wizard: { ...state.wizard, storeMode: "multi" },
        stores: [...state.stores, newStore],
        selectedStoreId: newStore.id,
      };
    }
    case "duplicateStore": {
      const source = state.stores.find((store) => store.id === action.storeId);
      if (!source) {
        return state;
      }

      const copy = duplicateStore(source);
      copy.name = `매장 ${state.stores.length + 1}`;
      return {
        ...state,
        wizard: { ...state.wizard, storeMode: "multi" },
        stores: [...state.stores, copy],
        selectedStoreId: copy.id,
      };
    }
    case "removeStore": {
      if (state.stores.length <= 1) {
        return state;
      }

      const nextStores = state.stores.filter((store) => store.id !== action.storeId);
      const nextSelectedId =
        state.selectedStoreId === action.storeId
          ? nextStores[0]?.id ?? state.selectedStoreId
          : state.selectedStoreId;

      return {
        ...state,
        wizard: {
          ...state.wizard,
          storeMode: nextStores.length > 1 ? "multi" : "single",
        },
        stores: nextStores,
        selectedStoreId: nextSelectedId,
      };
    }
    case "applyStoreToAll": {
      const source = state.stores.find((store) => store.id === action.storeId);
      if (!source) {
        return state;
      }

      return {
        ...state,
        stores: state.stores.map((store, index) =>
          store.id === source.id
            ? store
            : {
                ...deepClone(source),
                id: store.id,
                name: `매장 ${index + 1}`,
              },
        ),
      };
    }
    case "resetState":
      return buildInitialState({
        salesBasis: state.wizard.salesBasis,
        storeMode: state.wizard.storeMode,
        vatMode: state.wizard.vatMode,
        templateId: state.wizard.templateId,
      });
    default:
      return state;
  }
}
