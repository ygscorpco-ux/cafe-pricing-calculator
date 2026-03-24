import { describe, expect, it } from "vitest";

import { calculateAppState } from "@/lib/calculations";
import { buildInitialState } from "@/lib/seeds";

describe("calculateAppState", () => {
  it("월 기준 기본 템플릿에서 월/연 순수익을 계산한다", () => {
    const state = buildInitialState();
    const result = calculateAppState(state);

    expect(result.totals.monthlyNetProfit).toBeGreaterThan(0);
    expect(result.totals.annualNetProfit).toBe(result.totals.monthlyNetProfit * 12);
    expect(result.result.menuResults).toHaveLength(11);
  });

  it("연매출 기준일 때 연매출을 월 기준으로 환산한다", () => {
    const state = buildInitialState({
      salesBasis: "annual",
    });
    state.store.sales.annualSales = 600_000_000;
    state.store.sales.monthlySales = 10_000_000;

    const result = calculateAppState(state);

    expect(result.result.monthlySalesGross).toBe(50_000_000);
  });

  it("고정비를 끄면 월 순이익이 증가한다", () => {
    const state = buildInitialState();
    const baseline = calculateAppState(state);

    state.store.categories.fixedCosts.enabled = false;
    const updated = calculateAppState(state);

    expect(updated.totals.monthlyNetProfit).toBeGreaterThan(baseline.totals.monthlyNetProfit);
  });

  it("목표 순이익이 커지면 권장가가 현재가보다 높아진다", () => {
    const state = buildInitialState();
    state.targetMonthlyNetProfit = 30_000_000;

    const result = calculateAppState(state);
    const americano = result.result.menuResults.find((menu) => menu.menuId === "americano");

    expect(americano).toBeDefined();
    expect((americano?.recommendedAveragePrice ?? 0)).toBeGreaterThan(
      americano?.currentAveragePrice ?? 0,
    );
    expect(result.feasibility.requiredMonthlyGap).toBeGreaterThan(0);
  });

  it("부가세 별도가일 때 공급가와 총액 변환이 다르게 반영된다", () => {
    const inclusive = buildInitialState({ vatMode: "inclusive" });
    const exclusive = buildInitialState({ vatMode: "exclusive" });

    const inclusiveResult = calculateAppState(inclusive);
    const exclusiveResult = calculateAppState(exclusive);

    expect(inclusiveResult.result.monthlySalesSupply).toBeLessThan(
      inclusiveResult.result.monthlySalesGross,
    );
    expect(exclusiveResult.result.monthlySalesSupply).toBe(
      exclusiveResult.result.monthlySalesGross,
    );
  });

  it("기본 템플릿 메뉴는 목표 원재료비율 30%에 가깝게 시작한다", () => {
    const state = buildInitialState();
    state.targetMonthlyNetProfit = 0;

    const result = calculateAppState(state);
    const americano = result.result.menuResults.find((menu) => menu.menuId === "americano");

    expect(americano).toBeDefined();
    expect(americano?.directIngredientRate ?? 0).toBeGreaterThan(0.27);
    expect(americano?.directIngredientRate ?? 0).toBeLessThan(0.33);
    expect(americano?.ingredientRecommendedAveragePrice ?? 0).toBeCloseTo(
      americano?.currentAveragePrice ?? 0,
      -1,
    );
  });
});
