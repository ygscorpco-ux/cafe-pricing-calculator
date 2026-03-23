import { describe, expect, it } from "vitest";

import { calculateAppState } from "@/lib/calculations";
import { buildInitialState } from "@/lib/seeds";

describe("calculateAppState", () => {
  it("월 기준 기본 템플릿에서 월/연 순수익을 계산한다", () => {
    const state = buildInitialState();
    const result = calculateAppState(state);

    expect(result.totals.monthlyNetProfit).toBeGreaterThan(0);
    expect(result.totals.annualNetProfit).toBe(result.totals.monthlyNetProfit * 12);
    expect(result.storeResults[0].menuResults).toHaveLength(11);
  });

  it("연매출 기준일 때 연매출을 월 기준으로 환산한다", () => {
    const state = buildInitialState({
      salesBasis: "annual",
    });
    state.stores[0].sales.annualSales = 600_000_000;
    state.stores[0].sales.monthlySales = 10_000_000;

    const result = calculateAppState(state);

    expect(result.storeResults[0].monthlySalesGross).toBe(50_000_000);
  });

  it("카테고리 OFF가 순이익과 경고에 반영된다", () => {
    const state = buildInitialState();
    const baseline = calculateAppState(state);

    state.stores[0].categories.fixedCosts.enabled = false;
    const updated = calculateAppState(state);

    expect(updated.totals.monthlyNetProfit).toBeGreaterThan(baseline.totals.monthlyNetProfit);
    expect(updated.coverage.warnings).toContain("고정비 OFF");
  });

  it("목표 순이익이 커지면 권장가가 현재가보다 높아진다", () => {
    const state = buildInitialState();
    state.targetMonthlyNetProfit = 30_000_000;

    const result = calculateAppState(state);
    const americano = result.storeResults[0].menuResults.find(
      (menu) => menu.menuId === "americano",
    );

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

    expect(inclusiveResult.storeResults[0].monthlySalesSupply).toBeLessThan(
      inclusiveResult.storeResults[0].monthlySalesGross,
    );
    expect(exclusiveResult.storeResults[0].monthlySalesSupply).toBe(
      exclusiveResult.storeResults[0].monthlySalesGross,
    );
  });
});
