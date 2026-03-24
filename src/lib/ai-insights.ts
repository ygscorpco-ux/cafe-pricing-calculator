import type { AppCalculationResult, AppState } from "@/lib/types";

export interface AiCostDriverSnapshot {
  label: string;
  amount: number;
}

export interface AiMenuSnapshot {
  name: string;
  sharePercent: number;
  currentAveragePrice: number;
  recommendedAveragePrice: number;
  ingredientRecommendedAveragePrice: number;
  goalRecommendedAveragePrice: number;
  priceGap: number;
  directIngredientRatePercent: number;
  effectiveCostRatePercent: number;
  directCost: number;
  targetIngredientBudget: number;
  ingredientBudgetGap: number;
  contributionMargin: number;
  monthlyContribution: number;
}

export interface AiInsightRequest {
  salesBasis: AppState["wizard"]["salesBasis"];
  vatMode: AppState["wizard"]["vatMode"];
  templateId: string;
  targetMonthlyNetProfit: number;
  targetIngredientRatePercent: number;
  monthlySalesGross: number;
  monthlyNetProfit: number;
  annualNetProfit: number;
  requiredAverageTicket: number;
  targetMonthlyGap: number;
  feasibilityLabel: string;
  topCostDrivers: AiCostDriverSnapshot[];
  menus: AiMenuSnapshot[];
}

export interface AiInsightResponse {
  insights: string[];
  source: "ai" | "fallback";
  model?: string;
  generatedAt: string;
  message?: string;
}

export function buildAiInsightRequest(
  state: AppState,
  result: AppCalculationResult,
): AiInsightRequest {
  return {
    salesBasis: state.wizard.salesBasis,
    vatMode: state.wizard.vatMode,
    templateId: state.wizard.templateId,
    targetMonthlyNetProfit: state.targetMonthlyNetProfit,
    targetIngredientRatePercent: state.targetIngredientRate * 100,
    monthlySalesGross: result.totals.monthlySalesGross,
    monthlyNetProfit: result.totals.monthlyNetProfit,
    annualNetProfit: result.totals.annualNetProfit,
    requiredAverageTicket: result.result.requiredAverageTicket,
    targetMonthlyGap: result.totals.targetMonthlyGap,
    feasibilityLabel: result.feasibility.label,
    topCostDrivers: result.topCostDrivers.slice(0, 4).map((driver) => ({
      label: driver.label,
      amount: driver.amount,
    })),
    menus: result.result.menuResults.map((menu) => ({
      name: menu.name,
      sharePercent: menu.share,
      currentAveragePrice: menu.currentAveragePrice,
      recommendedAveragePrice: menu.recommendedAveragePrice,
      ingredientRecommendedAveragePrice: menu.ingredientRecommendedAveragePrice,
      goalRecommendedAveragePrice: menu.goalRecommendedAveragePrice,
      priceGap: menu.priceGap,
      directIngredientRatePercent: menu.directIngredientRate * 100,
      effectiveCostRatePercent: menu.costRate * 100,
      directCost: menu.directCost,
      targetIngredientBudget: menu.targetIngredientBudget,
      ingredientBudgetGap: menu.ingredientBudgetGap,
      contributionMargin: menu.contributionMargin,
      monthlyContribution: menu.monthlyContribution,
    })),
  };
}
