export type SalesBasis = "monthly" | "annual";
export type VatMode = "inclusive" | "exclusive";
export type CategoryKey =
  | "sales"
  | "menuSpec"
  | "ingredients"
  | "packaging"
  | "variableCosts"
  | "labor"
  | "fixedCosts"
  | "loss"
  | "tax";
export type Temperature = "hot" | "ice";
export type InputKind = "currency" | "percent" | "number";
export type GoalStatus = "achievable" | "stretch" | "hard" | "surplus";
export type PricingStrategy = "conservative" | "default" | "aggressive";
export type IngredientRateMode = "recommended" | "manual";

export interface CategoryState {
  enabled: boolean;
  collapsed: boolean;
  showAdvanced: boolean;
  useBundle: boolean;
  locked?: boolean;
}

export interface WizardState {
  salesBasis: SalesBasis;
  vatMode: VatMode;
  templateId: string;
  completed: boolean;
}

export interface PriceCatalogItem {
  id: string;
  label: string;
  unit: string;
  pricePerUnit: number;
  enabled: boolean;
  advanced?: boolean;
  description?: string;
}

export interface IngredientUsage {
  itemId: string;
  amount: number;
}

export interface PackagingUsage {
  itemId: string;
  quantity: number;
}

export interface MenuVariantState {
  enabled: boolean;
  price: number;
  cupSizeMl: number;
  shotCount: number;
  recipe: IngredientUsage[];
  packaging: PackagingUsage[];
}

export interface MenuState {
  id: string;
  name: string;
  group: string;
  temperatureSupport: "hot" | "ice" | "both";
  share: number;
  hotShare: number;
  variants: Partial<Record<Temperature, MenuVariantState>>;
}

export interface SalesInputs {
  monthlySales: number;
  annualSales: number;
  averageTicket: number;
  visitorsPerDay: number;
  operatingDaysPerMonth: number;
  cardRatio: number;
  takeoutRatio: number;
}

export interface VariableCostInputs {
  cardFeeRate: number;
  settlementFeeRate: number;
  platformFeeRate: number;
  loyaltyDiscountRate: number;
  orderFixedCost: number;
}

export interface LaborInputs {
  salariedPayroll: number;
  partTimeMonthlyPayroll: number;
  partTimeHourlyWage: number;
  partTimeShiftCount: number;
  partTimeHoursPerShift: number;
  employerInsuranceRate: number;
  retirementReserveRate: number;
  welfareCost: number;
}

export interface FixedCostInputs {
  monthlyRent: number;
  maintenanceFee: number;
  utilitiesBundle: number;
  operationsBundle: number;
  suppliesBundle: number;
  repairCost: number;
  professionalServices: number;
  insuranceFee: number;
  marketingCost: number;
  cleaningWasteLaundry: number;
  telecomMusicCctv: number;
  posKiosk: number;
  equipmentLeaseDepreciation: number;
  waterFilterCleaning: number;
}

export interface LossInputs {
  totalLossRate: number;
  ingredientWasteRate: number;
  packagingLossRate: number;
  remakeRate: number;
  freeDrinkRate: number;
  failureRate: number;
}

export interface StoreState {
  sales: SalesInputs;
  variableCosts: VariableCostInputs;
  labor: LaborInputs;
  fixedCosts: FixedCostInputs;
  loss: LossInputs;
  categories: Record<CategoryKey, CategoryState>;
  menus: MenuState[];
}

export interface AppState {
  wizard: WizardState;
  pricingStrategy: PricingStrategy;
  ingredientRateMode: IngredientRateMode;
  targetMonthlyNetProfit: number;
  targetIngredientRate: number;
  priceCatalog: {
    ingredients: PriceCatalogItem[];
    packaging: PriceCatalogItem[];
  };
  store: StoreState;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  tone: string;
  description: string;
}

export interface FieldDefinition<T extends string> {
  key: T;
  label: string;
  kind: InputKind;
  description?: string;
  unitLabel?: string;
  advanced?: boolean;
}

export interface CostDriver {
  label: string;
  amount: number;
}

export interface FeasibilityResult {
  status: GoalStatus;
  label: string;
  averageIncreaseRate: number;
  requiredMonthlyGap: number;
}

export interface IngredientBudgetItem {
  itemId: string;
  currentCost: number;
  targetCost: number;
  gap: number;
}

export type MenuStatus = "increase" | "stable" | "strong";

export interface MenuResult {
  menuId: string;
  name: string;
  group: string;
  temperatureSupport: MenuState["temperatureSupport"];
  share: number;
  unitsSold: number;
  currentAveragePrice: number;
  currentPrices: Partial<Record<Temperature, number>>;
  recommendedAveragePrice: number;
  recommendedPrices: Partial<Record<Temperature, number>>;
  priceGap: number;
  priceGapLabel: string;
  status: MenuStatus;
  statusLabel: string;
  hotShare: number;
  directCost: number;
  packagingCost: number;
  variableCost: number;
  lossCost: number;
  directIngredientRate: number;
  costRate: number;
  targetIngredientBudget: number;
  ingredientBudgetGap: number;
  ingredientBudgetItems: IngredientBudgetItem[];
  ingredientRecommendedAveragePrice: number;
  ingredientRecommendedPrices: Partial<Record<Temperature, number>>;
  goalRecommendedAveragePrice: number;
  goalRecommendedPrices: Partial<Record<Temperature, number>>;
  contributionMargin: number;
  monthlyRevenue: number;
  monthlyContribution: number;
}

export interface StoreCalculationResult {
  monthlySalesGross: number;
  monthlySalesSupply: number;
  derivedMonthlySalesGross: number;
  monthlyNetProfit: number;
  annualNetProfit: number;
  monthlyContribution: number;
  monthlyDirectCost: number;
  monthlyPackagingCost: number;
  monthlyVariableCost: number;
  monthlyLossCost: number;
  monthlyLaborCost: number;
  monthlyFixedCost: number;
  requiredAverageTicket: number;
  requiredVisitorsPerDay: number;
  menuResults: MenuResult[];
  topCostDrivers: CostDriver[];
  feasibility: FeasibilityResult;
}

export interface HeadlineSummary {
  monthlyNetProfit: number;
  targetGap: number;
  averagePriceDeltaPerCup: number;
  priorityMenuNames: string[];
}

export interface AppCalculationResult {
  totals: {
    monthlySalesGross: number;
    annualSalesGross: number;
    monthlyNetProfit: number;
    annualNetProfit: number;
    targetMonthlyGap: number;
  };
  appliedIngredientRate: number;
  recommendedIngredientRate: number;
  recommendedIngredientRateRange: {
    min: number;
    max: number;
  };
  requiredVisitorsPerDay: number;
  averagePriceDeltaPerCup: number;
  priorityMenuNames: string[];
  headlineSummary: HeadlineSummary;
  result: StoreCalculationResult;
  topCostDrivers: CostDriver[];
  feasibility: FeasibilityResult;
}

export interface SavedScenario {
  id: string;
  name: string;
  createdAt: string;
  state: AppState;
}
