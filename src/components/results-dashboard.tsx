"use client";

import { Fragment, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  ChevronDown,
  ChevronUp,
  Goal,
  PiggyBank,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { buildAiInsightRequest, type AiInsightResponse } from "@/lib/ai-insights";
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/lib/format";
import { cn, percentFromRatio, ratioFromPercentInput } from "@/lib/utils";
import type { AppAction } from "@/lib/app-state";
import type {
  AppCalculationResult,
  AppState,
  IngredientBudgetItem,
  MenuResult,
  MenuState,
  Temperature,
} from "@/lib/types";

interface ResultsDashboardProps {
  state: AppState;
  result: AppCalculationResult;
  dispatch: React.Dispatch<AppAction>;
  isInputTrayOpen: boolean;
  onOpenInputTray: () => void;
  onToggleInputTray: () => void;
  inlineInputTray?: React.ReactNode;
}

function NumberInput({
  value,
  onChange,
  suffix,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center rounded-2xl border border-[#d9e3f6] bg-white px-3",
        className,
      )}
    >
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-full bg-transparent text-sm text-[#13233f] outline-none"
      />
      {suffix ? <span className="text-xs text-[#7183a3]">{suffix}</span> : null}
    </div>
  );
}

function SummaryChip({
  label,
  value,
  tone = "blue",
}: {
  label: string;
  value: string;
  tone?: "blue" | "amber" | "rose" | "emerald";
}) {
  const toneClass =
    tone === "amber"
      ? "border-[#f6dfb2] bg-[#fff8e9]"
      : tone === "rose"
        ? "border-[#f4d7dc] bg-[#fff5f6]"
        : tone === "emerald"
          ? "border-[#d6ece4] bg-[#f5fbf8]"
          : "border-[#d9e3f6] bg-white";

  return (
    <div
      className={cn(
        "rounded-[18px] border px-4 py-3 shadow-[0_8px_18px_rgba(27,71,151,0.04)]",
        toneClass,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6c7fa5]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold leading-none text-[#13233f]">{value}</p>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  description,
  accent,
}: {
  label: string;
  value: string;
  description: string;
  accent?: "blue" | "amber" | "rose" | "emerald";
}) {
  const accentClass =
    accent === "amber"
      ? "border-[#f6dfb2] bg-[#fff8e9]"
      : accent === "rose"
        ? "border-[#f4d7dc] bg-[#fff5f6]"
        : accent === "emerald"
          ? "border-[#d6ece4] bg-[#f5fbf8]"
          : "border-[#d9e3f6] bg-white";

  return (
    <article
      className={cn(
        "rounded-[24px] border p-4 shadow-[0_10px_24px_rgba(27,71,151,0.05)]",
        accentClass,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-[#13233f]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#61728f]">{description}</p>
    </article>
  );
}

function MetricBar({
  label,
  amount,
  total,
  tone,
}: {
  label: string;
  amount: number;
  total: number;
  tone: string;
}) {
  const ratio = total > 0 ? Math.min(amount / total, 1) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm text-[#516281]">
        <span>{label}</span>
        <span className="font-semibold text-[#13233f]">{formatCompactCurrency(amount)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#e6edf9]">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

function EditablePriceGroup({
  menu,
  currentPrices,
  onChange,
}: {
  menu: MenuState;
  currentPrices: Partial<Record<Temperature, number>>;
  onChange: (temperature: Temperature, value: number) => void;
}) {
  if (menu.temperatureSupport === "both") {
    return (
      <div className="grid gap-2">
        {(["hot", "ice"] as Temperature[]).map((temperature) => (
          <div key={temperature} className="flex items-center gap-2">
            <span className="w-9 rounded-full bg-[#eef3ff] px-2 py-1 text-[11px] font-semibold text-[#1b4797]">
              {temperature.toUpperCase()}
            </span>
            <NumberInput
              value={currentPrices[temperature] ?? 0}
              onChange={(value) => onChange(temperature, value)}
              suffix="원"
              className="h-10"
            />
          </div>
        ))}
      </div>
    );
  }

  const temperature = menu.temperatureSupport === "hot" ? "hot" : "ice";

  return (
    <NumberInput
      value={currentPrices[temperature] ?? 0}
      onChange={(value) => onChange(temperature, value)}
      suffix="원"
      className="h-10"
    />
  );
}

function RecommendedPriceList({
  prices,
  inverse = false,
}: {
  prices: Partial<Record<Temperature, number>>;
  inverse?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-1 font-semibold",
        inverse ? "text-base text-white" : "text-sm text-[#13233f]",
      )}
    >
      {Object.entries(prices).map(([temperature, price]) => (
        <div key={temperature}>
          {temperature.toUpperCase()} {formatCurrency(price)}
        </div>
      ))}
    </div>
  );
}

function MenuMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "blue" | "amber" | "rose" | "emerald";
}) {
  const accentClass =
    tone === "amber"
      ? "bg-[#fff7e5]"
      : tone === "rose"
        ? "bg-[#fff5f6]"
        : tone === "emerald"
          ? "bg-[#f5fbf8]"
          : "bg-[#f8fbff]";

  return (
    <div className={cn("rounded-2xl p-3", accentClass)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7081a2]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[#13233f]">{value}</p>
    </div>
  );
}

function IngredientBudgetGuide({
  items,
  ingredientLabels,
}: {
  items: IngredientBudgetItem[];
  ingredientLabels: Map<string, string>;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-[#d9e3f6] bg-[#fbfdff] p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">
          재료 예산 가이드
        </p>
        <p className="mt-1 text-sm text-[#61728f]">
          현재 레시피 비중대로 나눠본 잔당 목표 원재료비입니다.
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {items.slice(0, 6).map((item) => {
          const tone =
            item.gap > 0 ? "bg-[#fff3f4] text-[#a04855]" : "bg-[#f3f9f6] text-[#1c7d56]";

          return (
            <div
              key={item.itemId}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-2xl border border-[#e1e9f8] bg-white px-3 py-3 text-sm"
            >
              <span className="font-medium text-[#13233f]">
                {ingredientLabels.get(item.itemId) ?? item.itemId}
              </span>
              <span className="text-[#516281]">현재 {formatCurrency(item.currentCost)}</span>
              <span className="text-[#516281]">목표 {formatCurrency(item.targetCost)}</span>
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", tone)}>
                {item.gap > 0 ? "초과 " : "여유 "}
                {formatCurrency(Math.abs(item.gap))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VariantEditor({
  menu,
  dispatch,
  ingredientLabels,
  packagingLabels,
}: {
  menu: MenuState;
  dispatch: React.Dispatch<AppAction>;
  ingredientLabels: Map<string, string>;
  packagingLabels: Map<string, string>;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {(Object.entries(menu.variants) as [Temperature, MenuState["variants"][Temperature]][]).map(
        ([temperature, variant]) =>
          variant ? (
            <section
              key={temperature}
              className="rounded-[26px] border border-[#d9e3f6] bg-[#f8fbff] p-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[#13233f]">
                  {menu.name} {temperature.toUpperCase()}
                </h4>
                <label className="flex items-center gap-2 text-xs text-[#61728f]">
                  <input
                    type="checkbox"
                    checked={variant.enabled}
                    onChange={(event) =>
                      dispatch({
                        type: "updateMenuVariantField",
                        menuId: menu.id,
                        temperature,
                        field: "enabled",
                        value: event.target.checked,
                      })
                    }
                  />
                  사용
                </label>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-[#61728f]">판매가</p>
                  <NumberInput
                    value={variant.price}
                    onChange={(value) =>
                      dispatch({
                        type: "updateMenuVariantField",
                        menuId: menu.id,
                        temperature,
                        field: "price",
                        value,
                      })
                    }
                    suffix="원"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-[#61728f]">컵 용량</p>
                  <NumberInput
                    value={variant.cupSizeMl}
                    onChange={(value) =>
                      dispatch({
                        type: "updateMenuVariantField",
                        menuId: menu.id,
                        temperature,
                        field: "cupSizeMl",
                        value,
                      })
                    }
                    suffix="ml"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-[#61728f]">샷 수</p>
                  <NumberInput
                    value={variant.shotCount}
                    onChange={(value) =>
                      dispatch({
                        type: "updateMenuVariantField",
                        menuId: menu.id,
                        temperature,
                        field: "shotCount",
                        value,
                      })
                    }
                    suffix="shot"
                  />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">
                  재료 구성
                </p>
                <div className="mt-2 grid gap-2">
                  {variant.recipe.map((usage) => (
                    <label
                      key={usage.itemId}
                      className="grid grid-cols-[1fr_110px] items-center gap-3 rounded-2xl border border-[#e0e8f8] bg-white px-3 py-2"
                    >
                      <span className="text-sm text-[#13233f]">
                        {ingredientLabels.get(usage.itemId) ?? usage.itemId}
                      </span>
                      <NumberInput
                        value={usage.amount}
                        onChange={(value) =>
                          dispatch({
                            type: "updateMenuUsage",
                            menuId: menu.id,
                            temperature,
                            usageKind: "recipe",
                            itemId: usage.itemId,
                            value,
                          })
                        }
                        suffix="unit"
                        className="h-9"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">
                  포장 구성
                </p>
                <div className="mt-2 grid gap-2">
                  {variant.packaging.map((usage) => (
                    <label
                      key={usage.itemId}
                      className="grid grid-cols-[1fr_110px] items-center gap-3 rounded-2xl border border-[#e0e8f8] bg-white px-3 py-2"
                    >
                      <span className="text-sm text-[#13233f]">
                        {packagingLabels.get(usage.itemId) ?? usage.itemId}
                      </span>
                      <NumberInput
                        value={usage.quantity}
                        onChange={(value) =>
                          dispatch({
                            type: "updateMenuUsage",
                            menuId: menu.id,
                            temperature,
                            usageKind: "packaging",
                            itemId: usage.itemId,
                            value,
                          })
                        }
                        suffix="ea"
                        className="h-9"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </section>
          ) : null,
      )}
    </div>
  );
}

function buildInsights({
  result,
  highestRawRateMenu,
  largestIngredientGapMenu,
  strongestMarginMenu,
}: {
  result: AppCalculationResult;
  highestRawRateMenu?: MenuResult;
  largestIngredientGapMenu?: MenuResult;
  strongestMarginMenu?: MenuResult;
}) {
  const insights: string[] = [];
  const biggestDriver = result.topCostDrivers[0];

  if (highestRawRateMenu) {
    insights.push(
      `${highestRawRateMenu.name}의 원재료비율이 ${formatPercent(
        highestRawRateMenu.directIngredientRate,
      )}로 가장 높습니다. 30% 기준 권장가 ${formatCurrency(
        highestRawRateMenu.ingredientRecommendedAveragePrice,
      )}부터 먼저 확인하는 편이 좋습니다.`,
    );
  }

  if (largestIngredientGapMenu && largestIngredientGapMenu.ingredientBudgetGap > 0) {
    insights.push(
      `${largestIngredientGapMenu.name}는 잔당 원재료비가 목표보다 ${formatCurrency(
        largestIngredientGapMenu.ingredientBudgetGap,
      )} 높습니다. 가격 인상이나 핵심 재료 단가 조정 여지가 큽니다.`,
    );
  }

  if (biggestDriver) {
    insights.push(
      `${biggestDriver.label}이 월 ${formatCompactCurrency(
        biggestDriver.amount,
      )} 수준으로 가장 크게 이익을 깎고 있습니다. 이 항목부터 점검하면 체감 개선이 빠릅니다.`,
    );
  }

  if (strongestMarginMenu) {
    insights.push(
      `${strongestMarginMenu.name}는 월 ${formatCompactCurrency(
        strongestMarginMenu.monthlyContribution,
      )}를 벌어주는 핵심 메뉴입니다. 이 메뉴 비중을 조금만 키워도 전체 이익이 빨리 올라갑니다.`,
    );
  }

  return insights.slice(0, 3);
}

export function ResultsDashboard({
  state,
  result,
  dispatch,
  isInputTrayOpen,
  onOpenInputTray,
  onToggleInputTray,
  inlineInputTray,
}: ResultsDashboardProps) {
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiModel, setAiModel] = useState<string | null>(null);
  const [lastAiRequestKey, setLastAiRequestKey] = useState<string | null>(null);
  const store = state.store;
  const calculation = result.result;
  const ingredientLabels = useMemo(
    () => new Map(state.priceCatalog.ingredients.map((item) => [item.id, item.label])),
    [state.priceCatalog.ingredients],
  );
  const packagingLabels = useMemo(
    () => new Map(state.priceCatalog.packaging.map((item) => [item.id, item.label])),
    [state.priceCatalog.packaging],
  );

  const averageIngredientRate =
    calculation.monthlySalesGross > 0
      ? calculation.monthlyDirectCost / calculation.monthlySalesGross
      : 0;
  const averageEffectiveCostRate =
    calculation.monthlySalesSupply > 0
      ? (calculation.monthlyDirectCost +
          calculation.monthlyPackagingCost +
          calculation.monthlyVariableCost +
          calculation.monthlyLossCost) /
        calculation.monthlySalesSupply
      : 0;
  const costBase =
    calculation.monthlyDirectCost +
    calculation.monthlyPackagingCost +
    calculation.monthlyVariableCost +
    calculation.monthlyLossCost +
    calculation.monthlyLaborCost +
    calculation.monthlyFixedCost;
  const highestRawRateMenu = calculation.menuResults
    .slice()
    .sort((left, right) => right.directIngredientRate - left.directIngredientRate)[0];
  const highestEffectiveCostMenu = calculation.menuResults
    .slice()
    .sort((left, right) => right.costRate - left.costRate)[0];
  const strongestMarginMenu = calculation.menuResults
    .slice()
    .sort((left, right) => right.monthlyContribution - left.monthlyContribution)[0];
  const largestIngredientGapMenu = calculation.menuResults
    .slice()
    .sort((left, right) => right.ingredientBudgetGap - left.ingredientBudgetGap)[0];
  const hottestGapMenu = calculation.menuResults
    .slice()
    .sort((left, right) => Math.abs(right.priceGap) - Math.abs(left.priceGap))[0];
  const insights = buildInsights({
    result,
    highestRawRateMenu,
    largestIngredientGapMenu,
    strongestMarginMenu,
  });
  const aiRequest = useMemo(() => buildAiInsightRequest(state, result), [state, result]);
  const aiRequestKey = useMemo(() => JSON.stringify(aiRequest), [aiRequest]);
  const isAiStale = Boolean(lastAiRequestKey && lastAiRequestKey !== aiRequestKey);
  const displayedInsights = aiInsights.length > 0 ? aiInsights : insights;

  const basisValue =
    state.wizard.salesBasis === "monthly" ? store.sales.monthlySales : store.sales.annualSales;

  async function handleRunAiInsights() {
    setAiStatus("loading");
    setAiMessage(null);

    try {
      const response = await fetch("/api/ai-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: aiRequestKey,
      });

      const payload = (await response.json()) as AiInsightResponse | { error?: string };

      if (!response.ok) {
        const nextMessage =
          "message" in payload && typeof payload.message === "string"
            ? payload.message
            : "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "AI 분석을 불러오지 못했습니다.";

        setAiStatus("error");
        setAiMessage(nextMessage);
        return;
      }

      if (!("insights" in payload) || !Array.isArray(payload.insights)) {
        setAiStatus("error");
        setAiMessage("AI 분석 응답 형식이 올바르지 않습니다.");
        return;
      }

      setAiInsights(payload.insights);
      setAiModel(payload.model ?? null);
      setLastAiRequestKey(aiRequestKey);
      setAiStatus("ready");
      setAiMessage(
        payload.message ??
          (payload.source === "ai"
            ? "현재 수치 기준으로 GPT 분석을 다시 읽어왔습니다."
            : "기본 규칙 분석을 사용 중입니다."),
      );
    } catch {
      setAiStatus("error");
      setAiMessage("AI 분석 요청 중 네트워크 오류가 발생했습니다.");
    }
  }

  return (
    <section className="space-y-5">
      <section className="sticky top-3 z-20 rounded-[20px] border border-[#d9e3f6] bg-white/96 px-3 py-3 shadow-[0_10px_22px_rgba(27,71,151,0.08)] backdrop-blur">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6c7fa5]">
              Answer First
            </p>
            <h2 className="mt-1 text-base font-semibold text-[#13233f]">지금 먼저 볼 숫자</h2>
            <p className="mt-1 text-xs text-[#61728f]">
              가격을 바꾸면 아래 숫자가 바로 다시 계산됩니다.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[420px]">
            <div className="rounded-[18px] border border-[#d9e3f6] bg-[#f8fbff] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">
                목표 월 순이익
              </p>
              <NumberInput
                value={state.targetMonthlyNetProfit}
                onChange={(value) => dispatch({ type: "setTargetMonthlyNetProfit", value })}
                suffix="원"
                className="mt-2 h-10"
              />
            </div>
            <div className="rounded-[18px] border border-[#d9e3f6] bg-[#f8fbff] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">
                목표 원재료비율
              </p>
              <NumberInput
                value={percentFromRatio(state.targetIngredientRate)}
                onChange={(value) =>
                  dispatch({
                    type: "setTargetIngredientRate",
                    value: ratioFromPercentInput(value),
                  })
                }
                suffix="%"
                className="mt-2 h-10"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryChip
            label="월 순이익"
            value={formatCompactCurrency(result.totals.monthlyNetProfit)}
            tone={result.totals.monthlyNetProfit >= 0 ? "blue" : "rose"}
          />
          <SummaryChip
            label="평균 원재료비율"
            value={formatPercent(averageIngredientRate)}
            tone={
              averageIngredientRate > state.targetIngredientRate + 0.02
                ? "rose"
                : averageIngredientRate > state.targetIngredientRate
                  ? "amber"
                  : "emerald"
            }
          />
          <SummaryChip
            label="실질 원가율"
            value={formatPercent(averageEffectiveCostRate)}
            tone={
              averageEffectiveCostRate >= 0.45
                ? "rose"
                : averageEffectiveCostRate >= 0.35
                  ? "amber"
                  : "emerald"
            }
          />
          <SummaryChip label="필요 객단가" value={formatCompactCurrency(calculation.requiredAverageTicket)} tone="amber" />
          <SummaryChip label="연 순이익" value={formatCompactCurrency(result.totals.annualNetProfit)} />
        </div>
      </section>

      <section className="rounded-[30px] border border-[#d9e3f6] bg-white p-5 shadow-[0_18px_48px_rgba(27,71,151,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6c7fa5]">
              Step 1
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#13233f]">3초 퀵셋업</h3>
            <p className="mt-2 text-sm leading-6 text-[#61728f]">
              처음에는 핵심 숫자 몇 개만 잡고 결과를 보는 편이 훨씬 빠릅니다.
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleInputTray}
            className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-4 py-2.5 text-sm font-semibold text-[#1b4797]"
          >
            <Sparkles className="h-4 w-4" />
            {isInputTrayOpen ? "상세 설정 접기" : "상세 설정 열기"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <p className="mb-1 text-xs font-medium text-[#61728f]">
              {state.wizard.salesBasis === "monthly" ? "월매출" : "연매출"}
            </p>
            <NumberInput
              value={basisValue}
              onChange={(value) =>
                dispatch({
                  type: "updateStoreField",
                  section: "sales",
                  field: state.wizard.salesBasis === "monthly" ? "monthlySales" : "annualSales",
                  value,
                })
              }
              suffix="원"
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[#61728f]">객단가</p>
            <NumberInput
              value={store.sales.averageTicket}
              onChange={(value) =>
                dispatch({
                  type: "updateStoreField",
                  section: "sales",
                  field: "averageTicket",
                  value,
                })
              }
              suffix="원"
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[#61728f]">월세</p>
            <NumberInput
              value={store.fixedCosts.monthlyRent}
              onChange={(value) =>
                dispatch({
                  type: "updateStoreField",
                  section: "fixedCosts",
                  field: "monthlyRent",
                  value,
                })
              }
              suffix="원"
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[#61728f]">정직원 급여</p>
            <NumberInput
              value={store.labor.salariedPayroll}
              onChange={(value) =>
                dispatch({
                  type: "updateStoreField",
                  section: "labor",
                  field: "salariedPayroll",
                  value,
                })
              }
              suffix="원"
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[#61728f]">카드 비중</p>
            <NumberInput
              value={percentFromRatio(store.sales.cardRatio)}
              onChange={(value) =>
                dispatch({
                  type: "updateStoreField",
                  section: "sales",
                  field: "cardRatio",
                  value: ratioFromPercentInput(value),
                })
              }
              suffix="%"
            />
          </div>
        </div>
      </section>

      {inlineInputTray ? <div className="hidden xl:block">{inlineInputTray}</div> : null}
      <section className="rounded-[30px] border border-[#d9e3f6] bg-white p-5 shadow-[0_18px_48px_rgba(27,71,151,0.08)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6c7fa5]">
              Step 2
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#13233f]">메뉴별 가격과 권장가</h3>
            <p className="mt-2 text-sm leading-6 text-[#61728f]">
              메뉴별로 현재 판매가, 원재료비율 {formatPercent(state.targetIngredientRate)} 기준 적정가,
              목표 순이익 기준 조정가를 함께 봅니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#1b4797]">
            <span className="rounded-full bg-[#eef3ff] px-4 py-2">
              판매 비중 합계 {store.menus.reduce((sum, menu) => sum + menu.share, 0).toFixed(1)}%
            </span>
            {hottestGapMenu ? (
              <span className="rounded-full bg-[#eef3ff] px-4 py-2">
                가장 차이 큰 메뉴 {hottestGapMenu.name}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {calculation.menuResults.map((menuResult) => {
            const menu = store.menus.find((item) => item.id === menuResult.menuId);
            if (!menu) {
              return null;
            }

            const expanded = expandedMenuId === menu.id;
            const rawRateTone =
              menuResult.directIngredientRate > state.targetIngredientRate + 0.02
                ? "rose"
                : menuResult.directIngredientRate > state.targetIngredientRate
                  ? "amber"
                  : "emerald";
            const effectiveTone =
              menuResult.costRate >= 0.45
                ? "rose"
                : menuResult.costRate >= 0.35
                  ? "amber"
                  : "emerald";

            return (
              <Fragment key={menu.id}>
                <article className="rounded-[28px] border border-[#d9e3f6] bg-[#fbfdff] p-4 shadow-[0_12px_30px_rgba(27,71,151,0.05)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold text-[#13233f]">{menuResult.name}</h4>
                        <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-[11px] font-semibold text-[#1b4797]">
                          비중 {menu.share.toFixed(1)}%
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#61728f]">
                        {menuResult.temperatureSupport === "both"
                          ? "HOT / ICE 모두 판매"
                          : `${menuResult.temperatureSupport.toUpperCase()} 전용 메뉴`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedMenuId(expanded ? null : menu.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-3 py-2 text-xs font-semibold text-[#1b4797]"
                    >
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {expanded ? "상세 닫기" : "상세 설정"}
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.05fr]">
                    <div className="rounded-[24px] border border-[#e0e8f8] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">
                        현재 판매가
                      </p>
                      <div className="mt-3">
                        <EditablePriceGroup
                          menu={menu}
                          currentPrices={menuResult.currentPrices}
                          onChange={(temperature, value) =>
                            dispatch({
                              type: "updateMenuVariantField",
                              menuId: menu.id,
                              temperature,
                              field: "price",
                              value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-[#2955a4] bg-[linear-gradient(135deg,#1b4797_0%,#2f62b5_100%)] p-4 text-white shadow-[0_16px_34px_rgba(27,71,151,0.20)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
                            최종 권장 판매가
                          </p>
                          <p className="mt-1 text-xs text-white/70">
                            원재료비율과 목표 순이익을 함께 반영한 가격입니다.
                          </p>
                        </div>
                        <span className="rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold">
                          기준 {percentFromRatio(state.targetIngredientRate)}%
                        </span>
                      </div>

                      <div className="mt-3">
                        <RecommendedPriceList prices={menuResult.recommendedPrices} inverse />
                      </div>

                      <div className="mt-4 grid gap-2 rounded-[18px] bg-white/10 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white/72">원재료비 기준</span>
                          <span className="font-semibold text-white">
                            {formatCurrency(menuResult.ingredientRecommendedAveragePrice)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white/72">목표 순익 기준</span>
                          <span className="font-semibold text-white">
                            {formatCurrency(menuResult.goalRecommendedAveragePrice)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold",
                            menuResult.priceGap >= 0 ? "bg-white/16 text-white" : "bg-white text-[#1b4797]",
                          )}
                        >
                          {menuResult.priceGap >= 0 ? (
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownCircle className="h-3.5 w-3.5" />
                          )}
                          현재가 대비 {menuResult.priceGap >= 0 ? "+" : ""}
                          {formatCurrency(menuResult.priceGap)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <MenuMetric label="잔당 원재료비" value={formatCurrency(menuResult.directCost)} tone="blue" />
                    <MenuMetric label="목표 원재료비" value={formatCurrency(menuResult.targetIngredientBudget)} tone="amber" />
                    <MenuMetric label="원재료비율" value={formatPercent(menuResult.directIngredientRate)} tone={rawRateTone} />
                    <MenuMetric label="실질 원가율" value={formatPercent(menuResult.costRate)} tone={effectiveTone} />
                    <MenuMetric label="잔당 이익" value={formatCurrency(menuResult.contributionMargin)} tone="emerald" />
                  </div>

                  {expanded ? (
                    <div className="mt-4 space-y-4 rounded-[24px] border border-[#d9e3f6] bg-white p-4">
                      <div className="grid gap-3 md:grid-cols-4">
                        <MenuMetric label="월 기여이익" value={formatCompactCurrency(menuResult.monthlyContribution)} tone="blue" />
                        <MenuMetric
                          label="원재료비 초과"
                          value={formatCurrency(Math.abs(menuResult.ingredientBudgetGap))}
                          tone={menuResult.ingredientBudgetGap > 0 ? "rose" : "emerald"}
                        />
                        <MenuMetric
                          label="30% 기준 적정가"
                          value={formatCurrency(menuResult.ingredientRecommendedAveragePrice)}
                          tone="amber"
                        />
                        <MenuMetric
                          label="목표 순익 기준가"
                          value={formatCurrency(menuResult.goalRecommendedAveragePrice)}
                          tone="blue"
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-xs font-medium text-[#61728f]">판매 비중</p>
                          <NumberInput
                            value={menu.share}
                            onChange={(value) =>
                              dispatch({
                                type: "updateMenuField",
                                menuId: menu.id,
                                field: "share",
                                value,
                              })
                            }
                            suffix="%"
                          />
                        </div>
                        {menu.temperatureSupport === "both" ? (
                          <div>
                            <p className="mb-1 text-xs font-medium text-[#61728f]">HOT 비중</p>
                            <NumberInput
                              value={percentFromRatio(menu.hotShare)}
                              onChange={(value) =>
                                dispatch({
                                  type: "updateMenuField",
                                  menuId: menu.id,
                                  field: "hotShare",
                                  value: ratioFromPercentInput(value),
                                })
                              }
                              suffix="%"
                            />
                          </div>
                        ) : null}
                      </div>

                      <IngredientBudgetGuide
                        items={menuResult.ingredientBudgetItems}
                        ingredientLabels={ingredientLabels}
                      />

                      <VariantEditor
                        menu={menu}
                        dispatch={dispatch}
                        ingredientLabels={ingredientLabels}
                        packagingLabels={packagingLabels}
                      />
                    </div>
                  ) : null}
                </article>
              </Fragment>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[30px] border border-[#d9e3f6] bg-white p-5 shadow-[0_18px_48px_rgba(27,71,151,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6c7fa5]">
                Step 3
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[#13233f]">대시보드</h3>
              <p className="mt-2 text-sm leading-6 text-[#61728f]">
                지금 이익 구조와 가격 조정 우선순위를 빠르게 판단하는 영역입니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => dispatch({ type: "setAnalysisMode", mode: "current" })}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  state.analysisMode === "current"
                    ? "bg-[#1b4797] text-white"
                    : "bg-[#eef3ff] text-[#1b4797] hover:bg-[#dde8ff]",
                )}
              >
                현재 기준 분석
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "setAnalysisMode", mode: "target" })}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  state.analysisMode === "target"
                    ? "bg-[#1b4797] text-white"
                    : "bg-[#eef3ff] text-[#1b4797] hover:bg-[#dde8ff]",
                )}
              >
                목표 기준 역산
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <SummaryStat
              label="연 순이익"
              value={formatCompactCurrency(result.totals.annualNetProfit)}
              description="현재 설정을 12개월 유지했을 때 예상 순이익입니다."
              accent="blue"
            />
            <SummaryStat
              label="원재료비율 높은 메뉴"
              value={highestRawRateMenu?.name ?? "계산 대기"}
              description={
                highestRawRateMenu
                  ? `${formatPercent(highestRawRateMenu.directIngredientRate)} / 목표 ${percentFromRatio(
                      state.targetIngredientRate,
                    )}%`
                  : "메뉴별 원재료비율을 계산하면 여기에 표시됩니다."
              }
              accent="amber"
            />
            <SummaryStat
              label="실질 원가율 높은 메뉴"
              value={highestEffectiveCostMenu?.name ?? "계산 대기"}
              description={
                highestEffectiveCostMenu
                  ? `${formatPercent(highestEffectiveCostMenu.costRate)} / 포장·수수료 포함`
                  : "운영 원가 기준으로 가장 무거운 메뉴가 표시됩니다."
              }
              accent="rose"
            />
          </div>

          {state.analysisMode === "target" ? (
            <div className="mt-5 rounded-[26px] border border-[#d9e3f6] bg-[#f8fbff] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#18376c]">
                <Goal className="h-4 w-4" />
                목표 기준 역산
              </div>
              <p className="mt-2 text-sm leading-6 text-[#61728f]">
                목표 월 순이익을 맞추기 위해 필요한 객단가와 메뉴별 가격 차이를 함께 확인합니다.
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <MenuMetric label="현재 월 순이익" value={formatCompactCurrency(result.totals.monthlyNetProfit)} />
                <MenuMetric label="목표까지 차이" value={formatCompactCurrency(result.totals.targetMonthlyGap)} tone="amber" />
                <MenuMetric label="필요 객단가" value={formatCompactCurrency(calculation.requiredAverageTicket)} tone="blue" />
              </div>
            </div>
          ) : null}
        </div>

        <aside className="rounded-[30px] border border-[#d9e3f6] bg-white p-5 shadow-[0_18px_48px_rgba(27,71,151,0.08)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#18376c]">
                <Sparkles className="h-4 w-4" />
                자동 분석
              </div>
              <p className="mt-2 text-sm leading-6 text-[#61728f]">
                기본 규칙 분석 위에 GPT 분석을 덧씌워, 지금 손봐야 할 메뉴와 비용을 바로 읽어줍니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleRunAiInsights()}
              disabled={aiStatus === "loading"}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition",
                aiStatus === "loading"
                  ? "cursor-wait bg-[#dbe6fb] text-[#5d76a9]"
                  : "bg-[#1b4797] text-white hover:bg-[#163d82]",
              )}
            >
              <Sparkles className="h-4 w-4" />
              {aiStatus === "loading"
                ? "GPT 분석 불러오는 중"
                : aiInsights.length > 0
                  ? "GPT 분석 다시 보기"
                  : "GPT 분석 보기"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#eef3ff] px-3 py-1.5 text-xs font-semibold text-[#1b4797]">
              {aiInsights.length > 0 ? "GPT 분석 사용 가능" : "기본 규칙 분석"}
            </span>
            {aiModel ? (
              <span className="rounded-full bg-[#f8fbff] px-3 py-1.5 text-xs font-semibold text-[#61728f]">
                모델 {aiModel}
              </span>
            ) : null}
            {isAiStale ? (
              <span className="rounded-full bg-[#fff4dc] px-3 py-1.5 text-xs font-semibold text-[#9b6300]">
                설정이 바뀌어 AI 분석이 예전 기준입니다
              </span>
            ) : null}
          </div>

          {aiMessage ? (
            <div
              className={cn(
                "mt-4 rounded-[18px] border px-4 py-3 text-sm leading-6",
                aiStatus === "error"
                  ? "border-[#f4d7dc] bg-[#fff5f6] text-[#8f4152]"
                  : "border-[#d9e3f6] bg-[#f8fbff] text-[#5a6d8f]",
              )}
            >
              {aiMessage}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {displayedInsights.map((insight) => (
              <div
                key={insight}
                className="rounded-[22px] bg-[#f8fbff] p-4 text-sm leading-7 text-[#425673]"
              >
                {insight}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenInputTray}
              className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-4 py-2.5 text-sm font-semibold text-[#1b4797]"
            >
              <WalletCards className="h-4 w-4" />
              세부 비용 더 조정하기
            </button>
          </div>
        </aside>
      </section>

      <section className="rounded-[30px] border border-[#d9e3f6] bg-white p-5 shadow-[0_18px_48px_rgba(27,71,151,0.08)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#18376c]">
          <Calculator className="h-4 w-4" />
          전체 순익 구조
        </div>
        <p className="mt-2 text-sm leading-6 text-[#61728f]">
          어떤 항목이 손익을 가장 많이 차지하는지 막대 형태로 비교합니다.
        </p>

        <div className="mt-5 grid gap-3">
          <MetricBar label="직접 원재료비" amount={calculation.monthlyDirectCost} total={costBase} tone="bg-[#1b4797]" />
          <MetricBar label="포장재" amount={calculation.monthlyPackagingCost} total={costBase} tone="bg-[#3a6cc5]" />
          <MetricBar label="변동비" amount={calculation.monthlyVariableCost} total={costBase} tone="bg-[#f0b650]" />
          <MetricBar label="로스 / 폐기" amount={calculation.monthlyLossCost} total={costBase} tone="bg-[#f6ca75]" />
          <MetricBar label="인건비" amount={calculation.monthlyLaborCost} total={costBase} tone="bg-[#d86a76]" />
          <MetricBar label="고정비" amount={calculation.monthlyFixedCost} total={costBase} tone="bg-[#7f91b4]" />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-[24px] bg-[#f8fbff] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#18376c]">
              <PiggyBank className="h-4 w-4" />
              총 공헌이익
            </div>
            <p className="mt-3 text-xl font-semibold text-[#13233f]">
              {formatCompactCurrency(calculation.monthlyContribution)}
            </p>
          </div>
          <div className="rounded-[24px] bg-[#f8fbff] p-4">
            <p className="text-sm font-semibold text-[#18376c]">월 총매출</p>
            <p className="mt-3 text-xl font-semibold text-[#13233f]">
              {formatCompactCurrency(result.totals.monthlySalesGross)}
            </p>
          </div>
          <div className="rounded-[24px] bg-[#f8fbff] p-4">
            <p className="text-sm font-semibold text-[#18376c]">목표 달성 상태</p>
            <p className="mt-3 text-xl font-semibold text-[#13233f]">{result.feasibility.label}</p>
          </div>
        </div>
      </section>
    </section>
  );
}
