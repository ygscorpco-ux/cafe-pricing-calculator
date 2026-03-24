import { buildInitialState, rebaseStateFromTemplate } from "@/lib/seeds";
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
  | { type: "setTargetIngredientRate"; value: number }
  | { type: "setSalesBasis"; value: AppState["wizard"]["salesBasis"] }
  | { type: "setVatMode"; value: AppState["wizard"]["vatMode"] }
  | { type: "applyTemplate"; templateId: string }
  | {
      type: "updateCategory";
      categoryKey: CategoryKey;
      patch: Partial<AppState["store"]["categories"][CategoryKey]>;
    }
  | {
      type: "updateStoreField";
      section: StoreNumericSection;
      field: string;
      value: number;
    }
  | {
      type: "updateCatalogItem";
      catalog: "ingredients" | "packaging";
      itemId: string;
      patch: Partial<PriceCatalogItem>;
    }
  | { type: "updateMenuField"; menuId: string; field: "share" | "hotShare"; value: number }
  | {
      type: "updateMenuVariantField";
      menuId: string;
      temperature: Temperature;
      field: MenuVariantField;
      value: number | boolean;
    }
  | {
      type: "updateMenuUsage";
      menuId: string;
      temperature: Temperature;
      usageKind: "recipe" | "packaging";
      itemId: string;
      value: number;
    }
  | { type: "resetState" };

function updateStore(
  state: AppState,
  updater: (store: AppState["store"]) => AppState["store"],
) {
  return {
    ...state,
    store: updater(state.store),
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
    case "setTargetIngredientRate":
      return {
        ...state,
        targetIngredientRate: Math.min(Math.max(action.value, 0.05), 0.8),
      };
    case "setSalesBasis":
      return {
        ...state,
        wizard: { ...state.wizard, salesBasis: action.value },
      };
    case "setVatMode":
      return {
        ...state,
        wizard: { ...state.wizard, vatMode: action.value },
      };
    case "applyTemplate":
      return rebaseStateFromTemplate(state, action.templateId);
    case "updateCategory":
      return updateStore(state, (store) => ({
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
      return updateStore(state, (store) => ({
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
      return updateStore(state, (store) => ({
        ...store,
        menus: store.menus.map((menu) =>
          menu.id === action.menuId ? { ...menu, [action.field]: action.value } : menu,
        ),
      }));
    case "updateMenuVariantField":
      return updateStore(state, (store) => ({
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
      return updateStore(state, (store) => ({
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
    case "resetState":
      return buildInitialState({
        salesBasis: state.wizard.salesBasis,
        vatMode: state.wizard.vatMode,
        templateId: state.wizard.templateId,
      });
    default:
      return state;
  }
}
