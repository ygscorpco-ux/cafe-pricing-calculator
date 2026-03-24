import {
  GOAL_THRESHOLDS,
  RECOMMENDED_INGREDIENT_RATE_RANGE,
  VAT_RATE,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { clamp, roundToUnit } from "@/lib/utils";
import type {
  AppCalculationResult,
  AppState,
  CostDriver,
  FeasibilityResult,
  IngredientBudgetItem,
  MenuResult,
  MenuState,
  Temperature,
} from "@/lib/types";

type CostMap = Map<string, number>;

interface MenuInternal {
  result: MenuResult;
  effectiveVariableRate: number;
}

interface StoreBaseResult {
  result: AppCalculationResult["result"];
  menuInternals: MenuInternal[];
}

function toArrayMap(items: CostMap): CostDriver[] {
  return [...items.entries()]
    .map(([label, amount]) => ({ label, amount }))
    .filter((item) => item.amount > 0)
    .sort((left, right) => right.amount - left.amount);
}

function addCost(costs: CostMap, label: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return;
  }

  costs.set(label, (costs.get(label) ?? 0) + amount);
}

function grossToSupply(price: number, vatMode: AppState["wizard"]["vatMode"]) {
  return vatMode === "inclusive" ? price / (1 + VAT_RATE) : price;
}

function supplyToGross(price: number, vatMode: AppState["wizard"]["vatMode"]) {
  return vatMode === "inclusive" ? price * (1 + VAT_RATE) : price;
}

function pickMonthlySales(store: AppState["store"], wizard: AppState["wizard"]) {
  const derived =
    store.sales.averageTicket *
    store.sales.visitorsPerDay *
    store.sales.operatingDaysPerMonth;

  if (wizard.salesBasis === "annual" && store.sales.annualSales > 0) {
    return store.sales.annualSales / 12;
  }

  if (wizard.salesBasis === "monthly" && store.sales.monthlySales > 0) {
    return store.sales.monthlySales;
  }

  if (store.sales.monthlySales > 0) {
    return store.sales.monthlySales;
  }

  if (store.sales.annualSales > 0) {
    return store.sales.annualSales / 12;
  }

  return derived;
}

function normalizeShares(menus: MenuState[]) {
  const total = menus.reduce((sum, menu) => sum + menu.share, 0);

  if (total <= 0) {
    return menus.map(() => 1 / Math.max(menus.length, 1));
  }

  return menus.map((menu) => menu.share / total);
}

function calculateFeasibility(
  requiredMonthlyGap: number,
  currentPrices: number[],
  goalRecommendedPrices: number[],
): FeasibilityResult {
  if (requiredMonthlyGap <= 0) {
    return {
      status: "surplus",
      label: "목표 초과",
      averageIncreaseRate: 0,
      requiredMonthlyGap,
    };
  }

  const currentAverage =
    currentPrices.reduce((sum, price) => sum + price, 0) / Math.max(currentPrices.length, 1);
  const recommendedAverage =
    goalRecommendedPrices.reduce((sum, price) => sum + price, 0) /
    Math.max(goalRecommendedPrices.length, 1);
  const increaseRate =
    currentAverage > 0 ? (recommendedAverage - currentAverage) / currentAverage : 0;

  if (increaseRate <= GOAL_THRESHOLDS.achievable) {
    return {
      status: "achievable",
      label: "달성 가능",
      averageIncreaseRate: increaseRate,
      requiredMonthlyGap,
    };
  }

  if (increaseRate <= GOAL_THRESHOLDS.stretch) {
    return {
      status: "stretch",
      label: "조정 필요",
      averageIncreaseRate: increaseRate,
      requiredMonthlyGap,
    };
  }

  return {
    status: "hard",
    label: "조정 폭 큼",
    averageIncreaseRate: increaseRate,
    requiredMonthlyGap,
  };
}

function calculateLaborCost(store: AppState["store"], costs: CostMap) {
  if (!store.categories.labor.enabled) {
    return 0;
  }

  const partTimePayroll =
    !store.categories.labor.useBundle &&
    store.labor.partTimeHourlyWage > 0 &&
    store.labor.partTimeShiftCount > 0 &&
    store.labor.partTimeHoursPerShift > 0
      ? store.labor.partTimeHourlyWage *
        store.labor.partTimeShiftCount *
        store.labor.partTimeHoursPerShift
      : store.labor.partTimeMonthlyPayroll;

  const payrollBase = store.labor.salariedPayroll + partTimePayroll;
  const insurance = payrollBase * store.labor.employerInsuranceRate;
  const retirement = payrollBase * store.labor.retirementReserveRate;
  const total = payrollBase + insurance + retirement + store.labor.welfareCost;

  addCost(costs, "정직원 급여", store.labor.salariedPayroll);
  addCost(costs, "알바 인건비", partTimePayroll);
  addCost(costs, "4대보험", insurance);
  addCost(costs, "퇴직충당금", retirement);
  addCost(costs, "복리후생", store.labor.welfareCost);

  return total;
}

function calculateFixedCost(store: AppState["store"], costs: CostMap) {
  if (!store.categories.fixedCosts.enabled) {
    return 0;
  }

  if (store.categories.fixedCosts.useBundle) {
    addCost(costs, "월세", store.fixedCosts.monthlyRent);
    addCost(costs, "관리비", store.fixedCosts.maintenanceFee);
    addCost(costs, "공과금 묶음", store.fixedCosts.utilitiesBundle);
    addCost(costs, "기타 운영비 묶음", store.fixedCosts.operationsBundle);
    addCost(costs, "기타 소모품 묶음", store.fixedCosts.suppliesBundle);

    return (
      store.fixedCosts.monthlyRent +
      store.fixedCosts.maintenanceFee +
      store.fixedCosts.utilitiesBundle +
      store.fixedCosts.operationsBundle +
      store.fixedCosts.suppliesBundle
    );
  }

  const detailed = [
    ["월세", store.fixedCosts.monthlyRent],
    ["관리비", store.fixedCosts.maintenanceFee],
    ["공과금 묶음", store.fixedCosts.utilitiesBundle],
    ["수선비", store.fixedCosts.repairCost],
    ["세무 / 법무 / 노무", store.fixedCosts.professionalServices],
    ["보험료", store.fixedCosts.insuranceFee],
    ["마케팅비", store.fixedCosts.marketingCost],
    ["청소 / 방역 / 세탁 / 쓰레기 처리", store.fixedCosts.cleaningWasteLaundry],
    ["인터넷 / 전화 / CCTV / 음원 사용료", store.fixedCosts.telecomMusicCctv],
    ["POS / 키오스크", store.fixedCosts.posKiosk],
    ["장비 감가상각 / 리스", store.fixedCosts.equipmentLeaseDepreciation],
    ["정수필터 / 세정제 / 연수기", store.fixedCosts.waterFilterCleaning],
    ["기타 소모품 묶음", store.fixedCosts.suppliesBundle],
  ] as const;

  detailed.forEach(([label, amount]) => addCost(costs, label, amount));
  return detailed.reduce((sum, [, amount]) => sum + amount, 0);
}

function getTemperatureWeight(menu: MenuResult, temperature: Temperature) {
  if (menu.temperatureSupport === "both") {
    return temperature === "hot" ? menu.hotShare : 1 - menu.hotShare;
  }

  if (menu.temperatureSupport === "hot") {
    return temperature === "hot" ? 1 : 0;
  }

  return temperature === "ice" ? 1 : 0;
}

function mergeRecommendedPrices(
  menu: MenuResult,
  ingredientRecommendedPrices: Partial<Record<Temperature, number>>,
  goalRecommendedPrices: Partial<Record<Temperature, number>>,
) {
  const temperatures = new Set<Temperature>([
    ...Object.keys(menu.currentPrices),
    ...Object.keys(ingredientRecommendedPrices),
    ...Object.keys(goalRecommendedPrices),
  ] as Temperature[]);

  const recommendedPrices: Partial<Record<Temperature, number>> = {};

  temperatures.forEach((temperature) => {
    const ingredientPrice = ingredientRecommendedPrices[temperature] ?? 0;
    const goalPrice = goalRecommendedPrices[temperature] ?? 0;
    recommendedPrices[temperature] = roundToUnit(Math.max(ingredientPrice, goalPrice), 10);
  });

  const recommendedAveragePrice = [...temperatures].reduce((sum, temperature) => {
    const weight = getTemperatureWeight(menu, temperature);
    return sum + (recommendedPrices[temperature] ?? 0) * weight;
  }, 0);

  return {
    recommendedPrices,
    recommendedAveragePrice,
  };
}

function calculateRecommendedIngredientRate(state: AppState, store: AppState["store"]) {
  const monthlySalesGross = pickMonthlySales(store, state.wizard);
  const monthlySalesSupply = grossToSupply(monthlySalesGross, state.wizard.vatMode);
  const fixedPressure =
    monthlySalesSupply > 0
      ? (store.labor.salariedPayroll +
          store.labor.partTimeMonthlyPayroll +
          store.fixedCosts.monthlyRent +
          store.fixedCosts.utilitiesBundle +
          store.fixedCosts.operationsBundle +
          store.fixedCosts.suppliesBundle) /
        monthlySalesSupply
      : 0;

  let base =
    state.pricingStrategy === "conservative"
      ? 0.32
      : state.pricingStrategy === "aggressive"
        ? 0.28
        : 0.3;

  if (fixedPressure > 0.28) {
    base -= 0.005;
  }

  if (store.sales.takeoutRatio >= 0.65 || store.sales.cardRatio >= 0.9) {
    base -= 0.005;
  }

  if (store.sales.averageTicket >= 6500 && fixedPressure < 0.2) {
    base += 0.005;
  }

  return clamp(
    Math.round(base * 1000) / 1000,
    RECOMMENDED_INGREDIENT_RATE_RANGE.min,
    RECOMMENDED_INGREDIENT_RATE_RANGE.max,
  );
}

function getAppliedIngredientRate(state: AppState, recommendedIngredientRate: number) {
  return state.ingredientRateMode === "manual"
    ? state.targetIngredientRate
    : recommendedIngredientRate;
}

function getMenuStatus(
  priceGap: number,
  directIngredientRate: number,
  appliedIngredientRate: number,
  costRate: number,
) {
  if (priceGap > 120 || directIngredientRate > appliedIngredientRate + 0.015 || costRate > 0.42) {
    return { status: "increase" as const, label: "가격 인상 필요" };
  }

  if (priceGap < -120 && costRate < 0.34) {
    return { status: "strong" as const, label: "수익성 우수" };
  }

  return { status: "stable" as const, label: "유지 가능" };
}

function calculateMenuResults(
  state: AppState,
  store: AppState["store"],
  costs: CostMap,
  appliedIngredientRate: number,
) {
  const monthlySalesGross = pickMonthlySales(store, state.wizard);
  const shareRatios = normalizeShares(store.menus);
  const ingredientMap = new Map(state.priceCatalog.ingredients.map((item) => [item.id, item]));
  const packagingMap = new Map(state.priceCatalog.packaging.map((item) => [item.id, item]));

  const menuResults: MenuResult[] = [];
  const internals: MenuInternal[] = [];
  let monthlyContribution = 0;
  let monthlyDirectCost = 0;
  let monthlyPackagingCost = 0;
  let monthlyVariableCost = 0;
  let monthlyLossCost = 0;

  store.menus.forEach((menu, index) => {
    const menuRevenueGross = monthlySalesGross * shareRatios[index];
    const temperatureRatios: Partial<Record<Temperature, number>> = {};

    if (menu.temperatureSupport === "both") {
      temperatureRatios.hot = menu.hotShare;
      temperatureRatios.ice = 1 - menu.hotShare;
    } else if (menu.temperatureSupport === "hot") {
      temperatureRatios.hot = 1;
    } else {
      temperatureRatios.ice = 1;
    }

    let unitsSold = 0;
    let currentAveragePrice = 0;
    let currentAverageSupplyPrice = 0;
    let directCost = 0;
    let packagingCost = 0;
    let variableCost = 0;
    let lossCost = 0;
    let contributionMargin = 0;
    let effectiveVariableRate = 0;
    let ingredientRecommendedAveragePrice = 0;
    const currentPrices: Partial<Record<Temperature, number>> = {};
    const ingredientRecommendedPrices: Partial<Record<Temperature, number>> = {};
    const ingredientBudgetMap = new Map<string, number>();

    (Object.entries(menu.variants) as [Temperature, MenuState["variants"][Temperature]][]).forEach(
      ([temperature, variant]) => {
        if (!variant?.enabled) {
          return;
        }

        const temperatureShare = temperatureRatios[temperature] ?? 0;
        const grossPrice = variant.price;
        const supplyPrice = grossToSupply(grossPrice, state.wizard.vatMode);
        const variantRevenue = menuRevenueGross * temperatureShare;
        const variantUnits = grossPrice > 0 ? variantRevenue / grossPrice : 0;

        const recipeCost = store.categories.ingredients.enabled
          ? variant.recipe.reduce((sum, ingredient) => {
              const item = ingredientMap.get(ingredient.itemId);
              if (!item?.enabled) {
                return sum;
              }

              const itemCost = ingredient.amount * item.pricePerUnit;
              ingredientBudgetMap.set(
                ingredient.itemId,
                (ingredientBudgetMap.get(ingredient.itemId) ?? 0) + itemCost * temperatureShare,
              );
              addCost(costs, item.label, itemCost * variantUnits);
              return sum + itemCost;
            }, 0)
          : 0;

        const packagingBaseCost = store.categories.packaging.enabled
          ? variant.packaging.reduce((sum, item) => {
              const packagingItem = packagingMap.get(item.itemId);
              if (!packagingItem?.enabled) {
                return sum;
              }

              const itemCost = item.quantity * packagingItem.pricePerUnit;
              addCost(
                costs,
                packagingItem.label,
                itemCost * variantUnits * store.sales.takeoutRatio,
              );
              return sum + itemCost;
            }, 0)
          : 0;

        const packagingUnitCost = packagingBaseCost * store.sales.takeoutRatio;
        const variableRate = store.categories.variableCosts.enabled
          ? store.sales.cardRatio *
              (store.variableCosts.cardFeeRate + store.variableCosts.settlementFeeRate) +
            store.sales.takeoutRatio * store.variableCosts.platformFeeRate +
            store.variableCosts.loyaltyDiscountRate
          : 0;
        const variableFixed = store.categories.variableCosts.enabled
          ? store.variableCosts.orderFixedCost * store.sales.takeoutRatio
          : 0;
        const variableUnitCost = supplyPrice * variableRate + variableFixed;

        const lossUnitCost = !store.categories.loss.enabled
          ? 0
          : store.categories.loss.useBundle
            ? (recipeCost + packagingUnitCost + variableUnitCost) * store.loss.totalLossRate
            : recipeCost * (store.loss.ingredientWasteRate + store.loss.failureRate) +
              packagingUnitCost * store.loss.packagingLossRate +
              (recipeCost + packagingUnitCost) * store.loss.remakeRate +
              (recipeCost + packagingUnitCost + variableUnitCost) * store.loss.freeDrinkRate;

        const ingredientRecommendedPrice =
          recipeCost > 0 && appliedIngredientRate > 0
            ? roundToUnit(recipeCost / appliedIngredientRate, 10)
            : grossPrice;

        const unitContribution =
          supplyPrice - recipeCost - packagingUnitCost - variableUnitCost - lossUnitCost;

        unitsSold += variantUnits;
        currentAveragePrice += grossPrice * temperatureShare;
        currentAverageSupplyPrice += supplyPrice * temperatureShare;
        directCost += recipeCost * temperatureShare;
        packagingCost += packagingUnitCost * temperatureShare;
        variableCost += variableUnitCost * temperatureShare;
        lossCost += lossUnitCost * temperatureShare;
        contributionMargin += unitContribution * temperatureShare;
        effectiveVariableRate += variableRate * temperatureShare;
        ingredientRecommendedAveragePrice += ingredientRecommendedPrice * temperatureShare;
        currentPrices[temperature] = grossPrice;
        ingredientRecommendedPrices[temperature] = ingredientRecommendedPrice;

        if (store.categories.variableCosts.enabled) {
          addCost(
            costs,
            "카드 수수료",
            supplyPrice * variantUnits * store.sales.cardRatio * store.variableCosts.cardFeeRate,
          );
          addCost(
            costs,
            "PG / VAN / 정산 비용",
            supplyPrice *
              variantUnits *
              store.sales.cardRatio *
              store.variableCosts.settlementFeeRate,
          );
          addCost(
            costs,
            "플랫폼 수수료",
            supplyPrice *
              variantUnits *
              store.sales.takeoutRatio *
              store.variableCosts.platformFeeRate,
          );
          addCost(
            costs,
            "할인 / 적립 비용",
            supplyPrice * variantUnits * store.variableCosts.loyaltyDiscountRate,
          );
        }

        if (store.categories.loss.enabled) {
          addCost(costs, "로스 / 폐기", lossUnitCost * variantUnits);
        }
      },
    );

    const monthlyMenuContribution = contributionMargin * unitsSold;
    const monthlyMenuDirectCost = directCost * unitsSold;
    const monthlyMenuPackagingCost = packagingCost * unitsSold;
    const monthlyMenuVariableCost = variableCost * unitsSold;
    const monthlyMenuLossCost = lossCost * unitsSold;
    const costRate =
      currentAverageSupplyPrice > 0
        ? (directCost + packagingCost + variableCost + lossCost) / currentAverageSupplyPrice
        : 0;
    const directIngredientRate =
      currentAveragePrice > 0 ? directCost / currentAveragePrice : 0;
    const targetIngredientBudget = currentAveragePrice * appliedIngredientRate;
    const ingredientBudgetItems: IngredientBudgetItem[] =
      directCost > 0
        ? [...ingredientBudgetMap.entries()]
            .map(([itemId, currentCost]) => {
              const targetCost = targetIngredientBudget * (currentCost / directCost);
              return {
                itemId,
                currentCost,
                targetCost,
                gap: currentCost - targetCost,
              };
            })
            .sort((left, right) => right.currentCost - left.currentCost)
        : [];

    monthlyContribution += monthlyMenuContribution;
    monthlyDirectCost += monthlyMenuDirectCost;
    monthlyPackagingCost += monthlyMenuPackagingCost;
    monthlyVariableCost += monthlyMenuVariableCost;
    monthlyLossCost += monthlyMenuLossCost;

    const priceGap = ingredientRecommendedAveragePrice - currentAveragePrice;
    const menuStatus = getMenuStatus(
      priceGap,
      directIngredientRate,
      appliedIngredientRate,
      costRate,
    );

    const menuResult: MenuResult = {
      menuId: menu.id,
      name: menu.name,
      group: menu.group,
      temperatureSupport: menu.temperatureSupport,
      share: menu.share,
      unitsSold,
      currentAveragePrice,
      currentPrices,
      recommendedAveragePrice: ingredientRecommendedAveragePrice,
      recommendedPrices: ingredientRecommendedPrices,
      priceGap,
      priceGapLabel: `${priceGap >= 0 ? "+" : ""}${formatCurrency(priceGap)}/잔`,
      status: menuStatus.status,
      statusLabel: menuStatus.label,
      hotShare: menu.hotShare,
      directCost,
      packagingCost,
      variableCost,
      lossCost,
      directIngredientRate,
      costRate,
      targetIngredientBudget,
      ingredientBudgetGap: directCost - targetIngredientBudget,
      ingredientBudgetItems,
      ingredientRecommendedAveragePrice,
      ingredientRecommendedPrices,
      goalRecommendedAveragePrice: currentAveragePrice,
      goalRecommendedPrices: currentPrices,
      contributionMargin,
      monthlyRevenue: menuRevenueGross,
      monthlyContribution: monthlyMenuContribution,
    };

    menuResults.push(menuResult);
    internals.push({
      result: menuResult,
      effectiveVariableRate,
    });
  });

  return {
    menuResults,
    internals,
    monthlyContribution,
    monthlyDirectCost,
    monthlyPackagingCost,
    monthlyVariableCost,
    monthlyLossCost,
  };
}

function calculateStoreBaseResult(
  state: AppState,
  appliedIngredientRate: number,
): StoreBaseResult {
  const store = state.store;
  const costs = new Map<string, number>();
  const monthlySalesGross = pickMonthlySales(store, state.wizard);
  const monthlySalesSupply = grossToSupply(monthlySalesGross, state.wizard.vatMode);
  const derivedMonthlySalesGross =
    store.sales.averageTicket *
    store.sales.visitorsPerDay *
    store.sales.operatingDaysPerMonth;
  const monthlyCustomers = store.sales.visitorsPerDay * store.sales.operatingDaysPerMonth;
  const menuComputation = calculateMenuResults(state, store, costs, appliedIngredientRate);
  const monthlyLaborCost = calculateLaborCost(store, costs);
  const monthlyFixedCost = calculateFixedCost(store, costs);
  const monthlyNetProfit =
    menuComputation.monthlyContribution - monthlyLaborCost - monthlyFixedCost;
  const requiredAverageTicket =
    monthlyCustomers > 0
      ? (state.targetMonthlyNetProfit - monthlyNetProfit) / monthlyCustomers +
        store.sales.averageTicket
      : store.sales.averageTicket;
  const currentPrices = menuComputation.menuResults.map(
    (menuResult) => menuResult.currentAveragePrice,
  );
  const contributionPerCustomer =
    monthlyCustomers > 0 ? menuComputation.monthlyContribution / monthlyCustomers : 0;
  const requiredVisitorsPerDay =
    contributionPerCustomer > 0 && store.sales.operatingDaysPerMonth > 0
      ? Math.ceil(
          (monthlyLaborCost + monthlyFixedCost + state.targetMonthlyNetProfit) /
            contributionPerCustomer /
            store.sales.operatingDaysPerMonth,
        )
      : store.sales.visitorsPerDay;

  const result = {
    monthlySalesGross,
    monthlySalesSupply,
    derivedMonthlySalesGross,
    monthlyNetProfit,
    annualNetProfit: monthlyNetProfit * 12,
    monthlyContribution: menuComputation.monthlyContribution,
    monthlyDirectCost: menuComputation.monthlyDirectCost,
    monthlyPackagingCost: menuComputation.monthlyPackagingCost,
    monthlyVariableCost: menuComputation.monthlyVariableCost,
    monthlyLossCost: menuComputation.monthlyLossCost,
    monthlyLaborCost,
    monthlyFixedCost,
    requiredAverageTicket,
    requiredVisitorsPerDay,
    menuResults: menuComputation.menuResults,
    topCostDrivers: toArrayMap(costs).slice(0, 6),
    feasibility: calculateFeasibility(0, currentPrices, currentPrices),
  };

  return {
    result,
    menuInternals: menuComputation.internals,
  };
}

function applyTargetRecommendations(
  base: StoreBaseResult,
  targetGap: number,
  vatMode: AppState["wizard"]["vatMode"],
): AppCalculationResult["result"] {
  const menuResults = base.menuInternals.map((internal) => {
    const menuGap =
      base.result.monthlySalesGross <= 0
        ? 0
        : targetGap * (internal.result.monthlyRevenue / base.result.monthlySalesGross);
    const deltaProfitPerUnit =
      internal.result.unitsSold > 0 ? menuGap / internal.result.unitsSold : 0;
    const retentionRate = Math.max(0.25, 1 - internal.effectiveVariableRate);
    const supplyDelta = deltaProfitPerUnit / retentionRate;
    const grossDelta = roundToUnit(supplyToGross(supplyDelta, vatMode), 10);
    const goalRecommendedAveragePrice = roundToUnit(
      internal.result.currentAveragePrice + grossDelta,
      10,
    );
    const goalRecommendedPrices = Object.fromEntries(
      Object.entries(internal.result.currentPrices).map(([temperature, price]) => [
        temperature,
        roundToUnit(price + grossDelta, 10),
      ]),
    ) as MenuResult["goalRecommendedPrices"];

    const mergedRecommendation = mergeRecommendedPrices(
      internal.result,
      internal.result.ingredientRecommendedPrices,
      goalRecommendedPrices,
    );
    const priceGap = mergedRecommendation.recommendedAveragePrice - internal.result.currentAveragePrice;

    return {
      ...internal.result,
      goalRecommendedAveragePrice,
      goalRecommendedPrices,
      recommendedAveragePrice: mergedRecommendation.recommendedAveragePrice,
      recommendedPrices: mergedRecommendation.recommendedPrices,
      priceGap,
      priceGapLabel: `${priceGap >= 0 ? "+" : ""}${formatCurrency(priceGap)}/잔`,
    };
  });

  const currentPrices = menuResults.map((menuResult) => menuResult.currentAveragePrice);
  const goalRecommendedPrices = menuResults.map(
    (menuResult) => menuResult.goalRecommendedAveragePrice,
  );

  return {
    ...base.result,
    menuResults,
    requiredAverageTicket: Math.max(base.result.requiredAverageTicket, 0),
    feasibility: calculateFeasibility(targetGap, currentPrices, goalRecommendedPrices),
  };
}

function getPriorityMenus(menuResults: MenuResult[]) {
  return menuResults
    .slice()
    .sort((left, right) => {
      const leftScore =
        Math.max(left.priceGap, 0) + left.directIngredientRate * 1000 + left.costRate * 600;
      const rightScore =
        Math.max(right.priceGap, 0) + right.directIngredientRate * 1000 + right.costRate * 600;
      return rightScore - leftScore;
    })
    .slice(0, 3);
}

export function calculateAppState(state: AppState): AppCalculationResult {
  const recommendedIngredientRate = calculateRecommendedIngredientRate(state, state.store);
  const appliedIngredientRate = getAppliedIngredientRate(state, recommendedIngredientRate);
  const base = calculateStoreBaseResult(state, appliedIngredientRate);
  const targetGap = state.targetMonthlyNetProfit - base.result.monthlyNetProfit;
  const result = applyTargetRecommendations(base, targetGap, state.wizard.vatMode);
  const totalUnits = result.menuResults.reduce((sum, menuResult) => sum + menuResult.unitsSold, 0);
  const priorityMenus = getPriorityMenus(result.menuResults);
  const averagePriceDeltaPerCup =
    totalUnits > 0
      ? result.menuResults.reduce(
          (sum, menuResult) => sum + menuResult.priceGap * menuResult.unitsSold,
          0,
        ) / totalUnits
      : 0;

  return {
    totals: {
      monthlySalesGross: result.monthlySalesGross,
      annualSalesGross: result.monthlySalesGross * 12,
      monthlyNetProfit: result.monthlyNetProfit,
      annualNetProfit: result.annualNetProfit,
      targetMonthlyGap: targetGap,
    },
    appliedIngredientRate,
    recommendedIngredientRate,
    recommendedIngredientRateRange: RECOMMENDED_INGREDIENT_RATE_RANGE,
    requiredVisitorsPerDay: result.requiredVisitorsPerDay,
    averagePriceDeltaPerCup,
    priorityMenuNames: priorityMenus.map((menu) => menu.name),
    headlineSummary: {
      monthlyNetProfit: result.monthlyNetProfit,
      targetGap,
      averagePriceDeltaPerCup,
      priorityMenuNames: priorityMenus.map((menu) => menu.name),
    },
    result,
    topCostDrivers: result.topCostDrivers,
    feasibility: result.feasibility,
  };
}
