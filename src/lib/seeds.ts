import {
  CATEGORY_META,
  DEFAULT_TARGET_INGREDIENT_RATE,
  DEFAULT_TARGET_MONTHLY_NET_PROFIT,
  TEMPLATES,
} from "@/lib/constants";
import { deepClone, roundToUnit } from "@/lib/utils";
import type {
  AppState,
  CategoryKey,
  CategoryState,
  MenuState,
  PriceCatalogItem,
  PricingStrategy,
  StoreState,
  VatMode,
  WizardState,
} from "@/lib/types";

const BASE_INGREDIENT_CATALOG: PriceCatalogItem[] = [
  { id: "coffeeBeans", label: "원두", unit: "g", pricePerUnit: 48, enabled: true },
  { id: "milk", label: "우유", unit: "ml", pricePerUnit: 1.9, enabled: true },
  { id: "vanillaSyrup", label: "바닐라 시럽", unit: "ml", pricePerUnit: 18, enabled: true },
  { id: "caramelSyrup", label: "카라멜 시럽", unit: "ml", pricePerUnit: 19, enabled: true },
  { id: "chocolateSauce", label: "초코 소스", unit: "ml", pricePerUnit: 24, enabled: true },
  { id: "strawberryBase", label: "딸기청", unit: "ml", pricePerUnit: 16, enabled: true },
  { id: "yuzuBase", label: "유자청", unit: "ml", pricePerUnit: 17, enabled: true },
  { id: "greenGrapeBase", label: "청포도청", unit: "ml", pricePerUnit: 18, enabled: true },
  { id: "citrusBase", label: "청귤청", unit: "ml", pricePerUnit: 18, enabled: true },
  { id: "water", label: "물", unit: "ml", pricePerUnit: 0.25, enabled: true },
  { id: "ice", label: "얼음", unit: "g", pricePerUnit: 0.9, enabled: true },
  {
    id: "whippingCream",
    label: "휘핑",
    unit: "ml",
    pricePerUnit: 28,
    enabled: true,
    advanced: true,
  },
  {
    id: "toppingPowder",
    label: "토핑 파우더",
    unit: "g",
    pricePerUnit: 22,
    enabled: true,
    advanced: true,
  },
  {
    id: "otherIngredientBundle",
    label: "기타 식재료 묶음",
    unit: "ea",
    pricePerUnit: 120,
    enabled: true,
  },
];

const BASE_PACKAGING_CATALOG: PriceCatalogItem[] = [
  { id: "hotCup", label: "HOT 컵", unit: "ea", pricePerUnit: 95, enabled: true },
  { id: "iceCup", label: "ICE 컵", unit: "ea", pricePerUnit: 110, enabled: true },
  { id: "lid", label: "뚜껑", unit: "ea", pricePerUnit: 45, enabled: true },
  { id: "straw", label: "빨대", unit: "ea", pricePerUnit: 18, enabled: true },
  { id: "holder", label: "홀더", unit: "ea", pricePerUnit: 35, enabled: true },
  { id: "carrier", label: "캐리어", unit: "ea", pricePerUnit: 140, enabled: true },
  { id: "napkin", label: "냅킨", unit: "ea", pricePerUnit: 8, enabled: true },
  { id: "labelSticker", label: "라벨", unit: "ea", pricePerUnit: 6, enabled: true },
  {
    id: "vinylBag",
    label: "비닐봉투",
    unit: "ea",
    pricePerUnit: 30,
    enabled: true,
    advanced: true,
  },
];

const HOT_PACKAGING = [
  { itemId: "hotCup", quantity: 1 },
  { itemId: "lid", quantity: 1 },
  { itemId: "holder", quantity: 0.55 },
  { itemId: "napkin", quantity: 0.4 },
  { itemId: "labelSticker", quantity: 1 },
  { itemId: "carrier", quantity: 0.12 },
  { itemId: "vinylBag", quantity: 0.04 },
];

const ICE_PACKAGING = [
  { itemId: "iceCup", quantity: 1 },
  { itemId: "lid", quantity: 1 },
  { itemId: "straw", quantity: 1 },
  { itemId: "napkin", quantity: 0.6 },
  { itemId: "labelSticker", quantity: 1 },
  { itemId: "carrier", quantity: 0.16 },
  { itemId: "vinylBag", quantity: 0.06 },
];

const BASE_MENUS: MenuState[] = [
  {
    id: "espresso",
    name: "에스프레소",
    group: "커피",
    temperatureSupport: "hot",
    share: 4,
    hotShare: 1,
    variants: {
      hot: {
        enabled: true,
        price: 0,
        cupSizeMl: 60,
        shotCount: 2,
        recipe: [
          { itemId: "coffeeBeans", amount: 18 },
          { itemId: "water", amount: 25 },
        ],
        packaging: HOT_PACKAGING,
      },
    },
  },
  {
    id: "americano",
    name: "아메리카노",
    group: "커피",
    temperatureSupport: "both",
    share: 20,
    hotShare: 0.55,
    variants: {
      hot: {
        enabled: true,
        price: 0,
        cupSizeMl: 240,
        shotCount: 2,
        recipe: [
          { itemId: "coffeeBeans", amount: 18 },
          { itemId: "water", amount: 210 },
        ],
        packaging: HOT_PACKAGING,
      },
      ice: {
        enabled: true,
        price: 0,
        cupSizeMl: 470,
        shotCount: 2,
        recipe: [
          { itemId: "coffeeBeans", amount: 18 },
          { itemId: "water", amount: 150 },
          { itemId: "ice", amount: 160 },
        ],
        packaging: ICE_PACKAGING,
      },
    },
  },
  {
    id: "cafeLatte",
    name: "카페라떼",
    group: "라떼",
    temperatureSupport: "both",
    share: 18,
    hotShare: 0.5,
    variants: {
      hot: {
        enabled: true,
        price: 0,
        cupSizeMl: 320,
        shotCount: 2,
        recipe: [
          { itemId: "coffeeBeans", amount: 18 },
          { itemId: "milk", amount: 190 },
        ],
        packaging: HOT_PACKAGING,
      },
      ice: {
        enabled: true,
        price: 0,
        cupSizeMl: 500,
        shotCount: 2,
        recipe: [
          { itemId: "coffeeBeans", amount: 18 },
          { itemId: "milk", amount: 220 },
          { itemId: "ice", amount: 160 },
        ],
        packaging: ICE_PACKAGING,
      },
    },
  },
  {
    id: "vanillaLatte",
    name: "바닐라라떼",
    group: "라떼",
    temperatureSupport: "both",
    share: 10,
    hotShare: 0.45,
    variants: {
      hot: {
        enabled: true,
        price: 0,
        cupSizeMl: 320,
        shotCount: 2,
        recipe: [
          { itemId: "coffeeBeans", amount: 18 },
          { itemId: "milk", amount: 190 },
          { itemId: "vanillaSyrup", amount: 20 },
        ],
        packaging: HOT_PACKAGING,
      },
      ice: {
        enabled: true,
        price: 0,
        cupSizeMl: 500,
        shotCount: 2,
        recipe: [
          { itemId: "coffeeBeans", amount: 18 },
          { itemId: "milk", amount: 220 },
          { itemId: "vanillaSyrup", amount: 22 },
          { itemId: "ice", amount: 160 },
        ],
        packaging: ICE_PACKAGING,
      },
    },
  },
  {
    id: "caramelMacchiato",
    name: "카라멜 마끼아또",
    group: "시그니처",
    temperatureSupport: "both",
    share: 8,
    hotShare: 0.45,
    variants: {
      hot: {
        enabled: true,
        price: 0,
        cupSizeMl: 320,
        shotCount: 2,
        recipe: [
          { itemId: "coffeeBeans", amount: 18 },
          { itemId: "milk", amount: 190 },
          { itemId: "vanillaSyrup", amount: 10 },
          { itemId: "caramelSyrup", amount: 16 },
        ],
        packaging: HOT_PACKAGING,
      },
      ice: {
        enabled: true,
        price: 0,
        cupSizeMl: 500,
        shotCount: 2,
        recipe: [
          { itemId: "coffeeBeans", amount: 18 },
          { itemId: "milk", amount: 220 },
          { itemId: "vanillaSyrup", amount: 10 },
          { itemId: "caramelSyrup", amount: 18 },
          { itemId: "ice", amount: 160 },
        ],
        packaging: ICE_PACKAGING,
      },
    },
  },
  {
    id: "cafeMocha",
    name: "카페모카",
    group: "시그니처",
    temperatureSupport: "both",
    share: 7,
    hotShare: 0.4,
    variants: {
      hot: {
        enabled: true,
        price: 0,
        cupSizeMl: 320,
        shotCount: 2,
        recipe: [
          { itemId: "coffeeBeans", amount: 18 },
          { itemId: "milk", amount: 180 },
          { itemId: "chocolateSauce", amount: 24 },
          { itemId: "whippingCream", amount: 12 },
        ],
        packaging: HOT_PACKAGING,
      },
      ice: {
        enabled: true,
        price: 0,
        cupSizeMl: 500,
        shotCount: 2,
        recipe: [
          { itemId: "coffeeBeans", amount: 18 },
          { itemId: "milk", amount: 210 },
          { itemId: "chocolateSauce", amount: 26 },
          { itemId: "whippingCream", amount: 14 },
          { itemId: "ice", amount: 160 },
        ],
        packaging: ICE_PACKAGING,
      },
    },
  },
  {
    id: "cappuccino",
    name: "카푸치노",
    group: "라떼",
    temperatureSupport: "hot",
    share: 6,
    hotShare: 1,
    variants: {
      hot: {
        enabled: true,
        price: 0,
        cupSizeMl: 300,
        shotCount: 2,
        recipe: [
          { itemId: "coffeeBeans", amount: 18 },
          { itemId: "milk", amount: 170 },
          { itemId: "toppingPowder", amount: 4 },
        ],
        packaging: HOT_PACKAGING,
      },
    },
  },
  {
    id: "strawberryDrink",
    name: "딸기청 음료",
    group: "청음료",
    temperatureSupport: "ice",
    share: 8,
    hotShare: 0,
    variants: {
      ice: {
        enabled: true,
        price: 0,
        cupSizeMl: 580,
        shotCount: 0,
        recipe: [
          { itemId: "strawberryBase", amount: 110 },
          { itemId: "water", amount: 280 },
          { itemId: "ice", amount: 180 },
        ],
        packaging: ICE_PACKAGING,
      },
    },
  },
  {
    id: "yuzuDrink",
    name: "유자청 음료",
    group: "청음료",
    temperatureSupport: "ice",
    share: 7,
    hotShare: 0,
    variants: {
      ice: {
        enabled: true,
        price: 0,
        cupSizeMl: 580,
        shotCount: 0,
        recipe: [
          { itemId: "yuzuBase", amount: 110 },
          { itemId: "water", amount: 280 },
          { itemId: "ice", amount: 180 },
        ],
        packaging: ICE_PACKAGING,
      },
    },
  },
  {
    id: "greenGrapeDrink",
    name: "청포도청 음료",
    group: "청음료",
    temperatureSupport: "ice",
    share: 6,
    hotShare: 0,
    variants: {
      ice: {
        enabled: true,
        price: 0,
        cupSizeMl: 580,
        shotCount: 0,
        recipe: [
          { itemId: "greenGrapeBase", amount: 110 },
          { itemId: "water", amount: 280 },
          { itemId: "ice", amount: 180 },
        ],
        packaging: ICE_PACKAGING,
      },
    },
  },
  {
    id: "citrusDrink",
    name: "귤 / 청귤 음료",
    group: "청음료",
    temperatureSupport: "ice",
    share: 6,
    hotShare: 0,
    variants: {
      ice: {
        enabled: true,
        price: 0,
        cupSizeMl: 580,
        shotCount: 0,
        recipe: [
          { itemId: "citrusBase", amount: 110 },
          { itemId: "water", amount: 280 },
          { itemId: "ice", amount: 180 },
        ],
        packaging: ICE_PACKAGING,
      },
    },
  },
];

function createCategoryState(key: CategoryKey): CategoryState {
  return {
    enabled: true,
    collapsed: true,
    showAdvanced: false,
    useBundle: key === "labor" || key === "fixedCosts" || key === "loss",
    locked: CATEGORY_META[key].locked,
  };
}

function createBaseStore(): StoreState {
  const categories = Object.fromEntries(
    (Object.keys(CATEGORY_META) as CategoryKey[]).map((key) => [
      key,
      createCategoryState(key),
    ]),
  ) as StoreState["categories"];

  return {
    sales: {
      monthlySales: 36_000_000,
      annualSales: 432_000_000,
      averageTicket: 5_400,
      visitorsPerDay: 250,
      operatingDaysPerMonth: 26,
      cardRatio: 0.88,
      takeoutRatio: 0.58,
    },
    variableCosts: {
      cardFeeRate: 0.024,
      settlementFeeRate: 0.003,
      platformFeeRate: 0.01,
      loyaltyDiscountRate: 0.008,
      orderFixedCost: 45,
    },
    labor: {
      salariedPayroll: 4_700_000,
      partTimeMonthlyPayroll: 3_100_000,
      partTimeHourlyWage: 11_000,
      partTimeShiftCount: 26,
      partTimeHoursPerShift: 10,
      employerInsuranceRate: 0.09,
      retirementReserveRate: 0.083,
      welfareCost: 220_000,
    },
    fixedCosts: {
      monthlyRent: 3_200_000,
      maintenanceFee: 380_000,
      utilitiesBundle: 580_000,
      operationsBundle: 420_000,
      suppliesBundle: 230_000,
      repairCost: 90_000,
      professionalServices: 180_000,
      insuranceFee: 120_000,
      marketingCost: 250_000,
      cleaningWasteLaundry: 160_000,
      telecomMusicCctv: 120_000,
      posKiosk: 140_000,
      equipmentLeaseDepreciation: 420_000,
      waterFilterCleaning: 90_000,
    },
    loss: {
      totalLossRate: 0.035,
      ingredientWasteRate: 0.02,
      packagingLossRate: 0.01,
      remakeRate: 0.012,
      freeDrinkRate: 0.006,
      failureRate: 0.008,
    },
    categories,
    menus: deepClone(BASE_MENUS),
  };
}

function applyIngredientTargetPricing(
  menus: MenuState[],
  ingredients: PriceCatalogItem[],
  targetIngredientRate: number,
) {
  const ingredientMap = new Map(ingredients.map((item) => [item.id, item]));

  return menus.map((menu) => ({
    ...menu,
    variants: Object.fromEntries(
      Object.entries(menu.variants).map(([temperature, variant]) => [
        temperature,
        variant
          ? {
              ...variant,
              price: roundToUnit(
                variant.recipe.reduce((sum, ingredient) => {
                  const item = ingredientMap.get(ingredient.itemId);
                  return sum + ingredient.amount * (item?.pricePerUnit ?? 0);
                }, 0) / Math.max(targetIngredientRate, 0.01),
                10,
              ),
            }
          : variant,
      ]),
    ) as MenuState["variants"],
  }));
}

export function buildInitialState(options?: {
  salesBasis?: WizardState["salesBasis"];
  vatMode?: VatMode;
  templateId?: string;
  completed?: boolean;
  pricingStrategy?: PricingStrategy;
}): AppState {
  const templateId = options?.templateId ?? TEMPLATES[0].id;
  const ingredients = deepClone(BASE_INGREDIENT_CATALOG);
  const packaging = deepClone(BASE_PACKAGING_CATALOG);
  const store = createBaseStore();
  store.menus = applyIngredientTargetPricing(
    store.menus,
    ingredients,
    DEFAULT_TARGET_INGREDIENT_RATE,
  );

  const initialState: AppState = {
    wizard: {
      salesBasis: options?.salesBasis ?? "monthly",
      vatMode: options?.vatMode ?? "inclusive",
      templateId,
      completed: options?.completed ?? false,
    },
    pricingStrategy: options?.pricingStrategy ?? "default",
    ingredientRateMode: "recommended",
    targetMonthlyNetProfit: DEFAULT_TARGET_MONTHLY_NET_PROFIT,
    targetIngredientRate: DEFAULT_TARGET_INGREDIENT_RATE,
    priceCatalog: {
      ingredients,
      packaging,
    },
    store,
  };

  return initialState;
}

export function rebaseStateFromTemplate(
  state: AppState,
  _templateId: string,
  overrides?: Partial<Pick<WizardState, "salesBasis" | "vatMode">>,
) {
  const next = buildInitialState({
    salesBasis: overrides?.salesBasis ?? state.wizard.salesBasis,
    vatMode: overrides?.vatMode ?? state.wizard.vatMode,
    completed: state.wizard.completed,
    pricingStrategy: state.pricingStrategy,
  });

  next.targetMonthlyNetProfit = state.targetMonthlyNetProfit;
  next.ingredientRateMode = state.ingredientRateMode;
  next.targetIngredientRate = state.targetIngredientRate;
  return next;
}
