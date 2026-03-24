"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Lock,
  Settings2,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { NumericInput } from "@/components/numeric-input";
import { buildAiInsightRequest, type AiInsightResponse } from "@/lib/ai-insights";
import type { AppAction } from "@/lib/app-state";
import {
  formatCompactCurrencyPerMonth,
  formatCompactCurrencyPerYear,
  formatCurrency,
  formatCurrencyPerCup,
  formatPercent,
  formatVisitorsPerDay,
} from "@/lib/format";
import type {
  AppCalculationResult,
  AppState,
  MenuResult,
  MenuState,
  PriceCatalogItem,
  Temperature,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface ResultsDashboardProps {
  state: AppState;
  result: AppCalculationResult;
  dispatch: React.Dispatch<AppAction>;
  onOpenSettings: () => void;
}

type DetailTab = "spec" | "ingredients" | "packaging";

const INTERACTIVE_CLASS =
  "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(27,71,151,0.12)] active:translate-y-0 active:scale-[0.995]";

function SummaryMetric({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "blue" | "amber";
}) {
  return (
    <div
      className={cn(
        "rounded-[22px] border px-4 py-4",
        tone === "blue"
          ? "border-[#d3e0fa] bg-[#f5f8ff]"
          : tone === "amber"
            ? "border-[#f4dfb3] bg-[#fff9ee]"
            : "border-[#e4ebf8] bg-white",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7081a2]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-[#13233f]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#6d7d99]">{hint}</p>
    </div>
  );
}

function LockedInfoCard({
  label,
  value,
  hint,
  emphasis = "auto",
}: {
  label: string;
  value: string;
  hint: string;
  emphasis?: "auto" | "recommended";
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border px-4 py-4",
        emphasis === "recommended"
          ? "border-[#d3e0fa] bg-[#f5f8ff]"
          : "border-[#e4ebf8] bg-[#f8fbff]",
      )}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7081a2]">
        {emphasis === "recommended" ? (
          <Sparkles className="h-3.5 w-3.5" />
        ) : (
          <Lock className="h-3.5 w-3.5" />
        )}
        {emphasis === "recommended" ? "추천" : "자동 계산"}
      </div>
      <p className="mt-3 text-sm font-medium text-[#60718f]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#13233f]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#6d7d99]">{hint}</p>
    </div>
  );
}

function StatusBadge({ status, label }: { status: MenuResult["status"]; label: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-[11px] font-semibold",
        status === "increase"
          ? "bg-[#fff0cf] text-[#a87106]"
          : status === "strong"
            ? "bg-[#e8f6ef] text-[#1f7a56]"
            : "bg-[#eef3ff] text-[#1b4797]",
      )}
    >
      {label}
    </span>
  );
}

function VariantPriceEditor({
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
            <span className="w-10 rounded-full bg-[#eef3ff] px-2 py-1 text-[11px] font-semibold text-[#1b4797]">
              {temperature.toUpperCase()}
            </span>
            <NumericInput
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
    <NumericInput
      value={currentPrices[temperature] ?? 0}
      onChange={(value) => onChange(temperature, value)}
      suffix="원"
      className="h-10"
    />
  );
}

function EditableField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7081a2]">
        {label}
      </p>
      <NumericInput value={value} onChange={onChange} suffix={suffix} className="h-10" />
    </label>
  );
}

function UsageList({
  title,
  items,
  catalog,
  unitKey,
  onChange,
}: {
  title: string;
  items: Array<{ itemId: string; amount?: number; quantity?: number }>;
  catalog: Record<string, PriceCatalogItem>;
  unitKey: "amount" | "quantity";
  onChange: (itemId: string, value: number) => void;
}) {
  return (
    <div className="rounded-[22px] border border-[#d9e3f6] bg-white p-4">
      <p className="text-sm font-semibold text-[#13233f]">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => {
          const catalogItem = catalog[item.itemId];
          const value = unitKey === "amount" ? item.amount ?? 0 : item.quantity ?? 0;
          return (
            <div
              key={item.itemId}
              className="grid grid-cols-[1fr_116px] items-center gap-3 rounded-2xl border border-[#edf2fb] bg-[#f8fbff] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#13233f]">
                  {catalogItem?.label ?? item.itemId}
                </p>
                <p className="text-[11px] text-[#7183a3]">
                  {unitKey === "amount" ? "사용량" : "수량"} / {catalogItem?.unit ?? ""}
                </p>
              </div>
              <NumericInput
                value={value}
                onChange={(nextValue) => onChange(item.itemId, nextValue)}
                suffix={catalogItem?.unit ?? ""}
                className="h-10"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MenuSpecPanel({
  menu,
  ingredientCatalog,
  packagingCatalog,
  activeTab,
  onChangeTab,
  dispatch,
}: {
  menu: MenuState;
  ingredientCatalog: Record<string, PriceCatalogItem>;
  packagingCatalog: Record<string, PriceCatalogItem>;
  activeTab: DetailTab;
  onChangeTab: (tab: DetailTab) => void;
  dispatch: React.Dispatch<AppAction>;
}) {
  const visibleVariants = (["hot", "ice"] as Temperature[]).filter(
    (temperature) => menu.variants[temperature],
  );

  return (
    <section className="rounded-[26px] border border-[#d9e3f6] bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7081a2]">
            Menu Spec
          </p>
          <h4 className="mt-1 text-lg font-semibold text-[#13233f]">메뉴 스펙</h4>
          <p className="mt-1 text-sm text-[#61728f]">
            수정 가능한 값만 여기에 두고, 자동 계산값은 위 카드에서 따로 보여줍니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["spec", "ingredients", "packaging"] as DetailTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onChangeTab(tab)}
              className={cn(
                "rounded-full px-3 py-2 text-xs font-semibold transition",
                activeTab === tab ? "bg-[#1b4797] text-white" : "bg-[#eef3ff] text-[#1b4797]",
              )}
            >
              {tab === "spec" ? "기본 스펙" : tab === "ingredients" ? "원재료" : "포장재"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <EditableField
          label="판매 비중"
          value={menu.share}
          suffix="%"
          onChange={(value) =>
            dispatch({ type: "updateMenuField", menuId: menu.id, field: "share", value })
          }
        />
        {menu.temperatureSupport === "both" ? (
          <EditableField
            label="HOT 비중"
            value={menu.hotShare}
            suffix="%"
            onChange={(value) =>
              dispatch({ type: "updateMenuField", menuId: menu.id, field: "hotShare", value })
            }
          />
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        {visibleVariants.map((temperature) => {
          const variant = menu.variants[temperature];
          if (!variant) {
            return null;
          }

          return (
            <div key={temperature} className="rounded-[24px] border border-[#d9e3f6] bg-[#f8fbff] p-4">
              <div className="flex items-center justify-between gap-3">
                <h5 className="text-sm font-semibold text-[#13233f]">
                  {temperature.toUpperCase()} 메뉴
                </h5>
                <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-[11px] font-semibold text-[#1b4797]">
                  {variant.enabled ? "사용 중" : "OFF"}
                </span>
              </div>

              {activeTab === "spec" ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <EditableField
                    label="컵 용량(ml)"
                    value={variant.cupSizeMl}
                    suffix="ml"
                    onChange={(value) =>
                      dispatch({
                        type: "updateMenuVariantField",
                        menuId: menu.id,
                        temperature,
                        field: "cupSizeMl",
                        value,
                      })
                    }
                  />
                  <EditableField
                    label="에스프레소 샷 수"
                    value={variant.shotCount}
                    suffix="샷"
                    onChange={(value) =>
                      dispatch({
                        type: "updateMenuVariantField",
                        menuId: menu.id,
                        temperature,
                        field: "shotCount",
                        value,
                      })
                    }
                  />
                </div>
              ) : null}

              {activeTab === "ingredients" ? (
                <div className="mt-4">
                  <UsageList
                    title="원재료 구성"
                    items={variant.recipe}
                    catalog={ingredientCatalog}
                    unitKey="amount"
                    onChange={(itemId, value) =>
                      dispatch({
                        type: "updateMenuUsage",
                        menuId: menu.id,
                        temperature,
                        usageKind: "recipe",
                        itemId,
                        value,
                      })
                    }
                  />
                </div>
              ) : null}

              {activeTab === "packaging" ? (
                <div className="mt-4">
                  <UsageList
                    title="포장재 구성"
                    items={variant.packaging}
                    catalog={packagingCatalog}
                    unitKey="quantity"
                    onChange={(itemId, value) =>
                      dispatch({
                        type: "updateMenuUsage",
                        menuId: menu.id,
                        temperature,
                        usageKind: "packaging",
                        itemId,
                        value,
                      })
                    }
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CostBar({
  label,
  amount,
  ratio,
  colorClass,
}: {
  label: string;
  amount: number;
  ratio: number;
  colorClass: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-[#243655]">{label}</span>
        <span className="font-semibold text-[#13233f]">{formatCompactCurrencyPerMonth(amount)}</span>
      </div>
      <div className="h-2 rounded-full bg-[#edf2fb]">
        <div
          className={cn("h-2 rounded-full", colorClass)}
          style={{ width: `${Math.max(6, ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

function buildRuleInsights({
  result,
  selectedMenu,
}: {
  result: AppCalculationResult;
  selectedMenu?: MenuResult | null;
}) {
  const firstDriver = result.topCostDrivers[0];
  const insights: string[] = [];

  insights.push(`현재 기준 월 순이익은 ${formatCompactCurrencyPerMonth(result.totals.monthlyNetProfit)}입니다.`);
  insights.push(
    `목표까지 ${formatCompactCurrencyPerMonth(result.totals.targetMonthlyGap)} 차이가 있습니다.`,
  );

  if (selectedMenu) {
    insights.push(
      `${selectedMenu.name}는 권장가까지 ${selectedMenu.priceGapLabel} 조정이 필요합니다.`,
    );
  } else if (firstDriver) {
    insights.push(
      `${firstDriver.label}가 현재 가장 큰 비용 요인으로 ${formatCompactCurrencyPerMonth(firstDriver.amount)} 수준입니다.`,
    );
  }

  return insights.slice(0, 3);
}

function renderRecommendedPrices(menuResult: MenuResult) {
  if (menuResult.temperatureSupport === "both") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-white/80">HOT 권장가</span>
          <span className="text-lg font-semibold text-white">
            {formatCurrency(menuResult.recommendedPrices.hot ?? 0)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-white/80">ICE 권장가</span>
          <span className="text-lg font-semibold text-white">
            {formatCurrency(menuResult.recommendedPrices.ice ?? 0)}
          </span>
        </div>
      </div>
    );
  }

  const temperature = menuResult.temperatureSupport === "hot" ? "HOT" : "ICE";
  const price =
    menuResult.recommendedPrices[menuResult.temperatureSupport === "hot" ? "hot" : "ice"] ?? 0;

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-white/80">{temperature} 권장가</span>
      <span className="text-xl font-semibold text-white">{formatCurrency(price)}</span>
    </div>
  );
}

export function ResultsDashboard({
  state,
  result,
  dispatch,
  onOpenSettings,
}: ResultsDashboardProps) {
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("spec");
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const ingredientCatalog = useMemo(
    () =>
      Object.fromEntries(state.priceCatalog.ingredients.map((item) => [item.id, item])),
    [state.priceCatalog.ingredients],
  );
  const packagingCatalog = useMemo(
    () =>
      Object.fromEntries(state.priceCatalog.packaging.map((item) => [item.id, item])),
    [state.priceCatalog.packaging],
  );

  const sortedMenus = useMemo(
    () =>
      result.result.menuResults
        .slice()
        .sort((left, right) => {
          const rank = { increase: 0, stable: 1, strong: 2 };
          return rank[left.status] - rank[right.status] || Math.abs(right.priceGap) - Math.abs(left.priceGap);
        }),
    [result.result.menuResults],
  );

  const activeMenuId =
    selectedMenuId && sortedMenus.some((menu) => menu.menuId === selectedMenuId)
      ? selectedMenuId
      : sortedMenus[0]?.menuId ?? null;

  const selectedMenuResult =
    sortedMenus.find((menu) => menu.menuId === activeMenuId) ?? null;
  const selectedMenu =
    state.store.menus.find((menu) => menu.id === selectedMenuResult?.menuId) ?? null;

  const aiRequest = useMemo(() => buildAiInsightRequest(state, result), [state, result]);
  const fallbackInsights = buildRuleInsights({ result, selectedMenu: selectedMenuResult });
  const displayedInsights = aiStatus === "ready" && aiInsights.length > 0 ? aiInsights : fallbackInsights;

  const costBreakdown = [
    { label: "원재료비", amount: result.result.monthlyDirectCost, colorClass: "bg-[#1b4797]" },
    { label: "포장재", amount: result.result.monthlyPackagingCost, colorClass: "bg-[#4f79c7]" },
    { label: "변동비", amount: result.result.monthlyVariableCost, colorClass: "bg-[#7f9fe0]" },
    { label: "로스/폐기", amount: result.result.monthlyLossCost, colorClass: "bg-[#d5a23a]" },
    { label: "인건비", amount: result.result.monthlyLaborCost, colorClass: "bg-[#2f845d]" },
    { label: "고정비", amount: result.result.monthlyFixedCost, colorClass: "bg-[#935b65]" },
  ];

  const largestBreakdown = Math.max(...costBreakdown.map((item) => item.amount), 1);

  async function handleRunAiInsights() {
    setAiStatus("loading");
    setAiMessage(null);

    try {
      const response = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiRequest),
      });

      const payload = (await response.json()) as AiInsightResponse | { error?: string; message?: string };

      if (!response.ok) {
        setAiStatus("error");
        setAiMessage(
          "message" in payload && typeof payload.message === "string"
            ? payload.message
            : "AI 분석을 불러오지 못했습니다.",
        );
        return;
      }

      if (!("insights" in payload) || !Array.isArray(payload.insights)) {
        setAiStatus("error");
        setAiMessage("AI 분석 응답 형식이 올바르지 않습니다.");
        return;
      }

      setAiInsights(payload.insights);
      setAiStatus("ready");
      setAiMessage(
        payload.source === "ai"
          ? "AI 기준으로 인사이트를 다시 정리했습니다."
          : "기본 분석 결과를 보여주고 있습니다.",
      );
    } catch {
      setAiStatus("error");
      setAiMessage("AI 분석 요청 중 네트워크 오류가 발생했습니다.");
    }
  }

  return (
    <section className="space-y-5">
      <section className="sticky top-3 z-20 rounded-[26px] border border-[#d9e3f6] bg-white/96 p-4 shadow-[0_12px_28px_rgba(27,71,151,0.08)] backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6c7fa5]">
              Answer First
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#13233f]">
              현재 기준 월 순이익은 {formatCompactCurrencyPerMonth(result.headlineSummary.monthlyNetProfit)}입니다.
            </h2>
            <div className="mt-3 space-y-2 text-sm leading-6 text-[#516281]">
              <p>
                목표 {formatCompactCurrencyPerMonth(state.targetMonthlyNetProfit)}까지{" "}
                {formatCompactCurrencyPerMonth(result.headlineSummary.targetGap)}{" "}
                {result.headlineSummary.targetGap > 0 ? "부족합니다." : "초과했습니다."}
              </p>
              <p>평균 메뉴가를 {formatCurrencyPerCup(result.headlineSummary.averagePriceDeltaPerCup)} 조정해야 합니다.</p>
              <p>우선 조정 메뉴: {result.headlineSummary.priorityMenuNames.join(", ") || "계산 중"}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className={cn(
              "inline-flex items-center gap-2 rounded-full bg-[#1b4797] px-4 py-2.5 text-sm font-semibold text-white",
              INTERACTIVE_CLASS,
            )}
          >
            <Settings2 className="h-4 w-4" />
            고급 설정 열기
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric
            label="현재 월 순이익"
            value={formatCompactCurrencyPerMonth(result.totals.monthlyNetProfit)}
            hint="현재 입력값 기준으로 남는 금액입니다."
            tone="blue"
          />
          <SummaryMetric
            label="목표 대비 차이"
            value={formatCompactCurrencyPerMonth(result.totals.targetMonthlyGap)}
            hint="목표 기준으로 아직 얼마나 부족한지 보여줍니다."
            tone={result.totals.targetMonthlyGap > 0 ? "amber" : "blue"}
          />
          <SummaryMetric
            label="평균 조정 필요액"
            value={formatCurrencyPerCup(result.averagePriceDeltaPerCup)}
            hint="모든 메뉴를 평균적으로 얼마나 조정해야 하는지입니다."
            tone="amber"
          />
          <SummaryMetric
            label="우선 조정 메뉴"
            value={result.priorityMenuNames.join(", ") || "계산 중"}
            hint="먼저 손봐야 하는 메뉴 TOP 3입니다."
          />
        </div>
      </section>

      <section className="rounded-[30px] border border-[#d9e3f6] bg-white p-5 shadow-[0_18px_48px_rgba(27,71,151,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6c7fa5]">
              Menu Pricing
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#13233f]">메뉴별 현재가와 권장가</h3>
            <p className="mt-2 text-sm leading-6 text-[#61728f]">
              메뉴명, 현재가, 권장가, 차이, 상태만 먼저 보고 하나를 고르면 상세를 볼 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#1b4797]">
            <span className="rounded-full bg-[#eef3ff] px-4 py-2">메뉴 {sortedMenus.length}개</span>
            <span className="rounded-full bg-[#eef3ff] px-4 py-2">차이 큰 메뉴 우선</span>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[0.76fr_1.24fr]">
          <div className="rounded-[26px] border border-[#d9e3f6] bg-[#fbfdff] p-3">
            <div className="space-y-2">
              {sortedMenus.map((menu) => (
                <button
                  key={menu.menuId}
                  type="button"
                  onClick={() => {
                    setSelectedMenuId(menu.menuId);
                    setDetailTab("spec");
                  }}
                  className={cn(
                    "grid w-full grid-cols-[minmax(0,1.45fr)_0.9fr_0.9fr_0.8fr_auto] items-center gap-3 rounded-[22px] border px-4 py-4 text-left",
                    INTERACTIVE_CLASS,
                    menu.menuId === activeMenuId
                      ? "border-[#1b4797] bg-[#eef3ff]"
                      : "border-[#e3ebf9] bg-white hover:border-[#a9bfe8] hover:bg-[#f8fbff]",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[#13233f]">{menu.name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7b8baa]">현재가</p>
                    <p className="mt-1 text-sm font-semibold text-[#13233f]">{formatCurrency(menu.currentAveragePrice)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7b8baa]">권장가</p>
                    <p className="mt-1 text-sm font-semibold text-[#13233f]">{formatCurrency(menu.recommendedAveragePrice)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7b8baa]">차이</p>
                    <p className="mt-1 text-sm font-semibold text-[#13233f]">{menu.priceGapLabel}</p>
                  </div>
                  <div className="justify-self-end">
                    <StatusBadge status={menu.status} label={menu.statusLabel} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {selectedMenuResult && selectedMenu ? (
              <>
                <section className="rounded-[28px] border border-[#d9e3f6] bg-white p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-2xl font-semibold text-[#13233f]">{selectedMenuResult.name}</h4>
                        <StatusBadge
                          status={selectedMenuResult.status}
                          label={selectedMenuResult.statusLabel}
                        />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#61728f]">
                        현재가와 권장가 차이를 먼저 확인하고, 필요하면 아래 메뉴 스펙에서 값만 수정하세요.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-4 py-2.5 text-sm font-semibold text-[#1b4797]",
                        INTERACTIVE_CLASS,
                      )}
                    >
                      <ArrowRight className="h-4 w-4" />
                      고급 설정으로 더 조정
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-[26px] border border-[#d9e3f6] bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7081a2]">
                        수정 가능
                      </p>
                      <h5 className="mt-2 text-lg font-semibold text-[#13233f]">현재 판매가</h5>
                      <p className="mt-1 text-sm leading-6 text-[#61728f]">
                        이 가격을 바꾸면 바로 아래 결과가 다시 계산됩니다.
                      </p>
                      <div className="mt-4">
                        <VariantPriceEditor
                          menu={selectedMenu}
                          currentPrices={selectedMenuResult.currentPrices}
                          onChange={(temperature, value) =>
                            dispatch({
                              type: "updateMenuVariantField",
                              menuId: selectedMenu.id,
                              temperature,
                              field: "price",
                              value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="rounded-[26px] border border-[#2958b5] bg-[linear-gradient(180deg,#2a5db8_0%,#1f4d9e_100%)] p-4 text-white shadow-[0_18px_32px_rgba(27,71,151,0.22)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                            추천
                          </p>
                          <h5 className="mt-2 text-lg font-semibold text-white">최종 권장 판매가</h5>
                          <p className="mt-1 text-sm leading-6 text-white/80">
                            30% 기준과 목표 순익 기준을 함께 반영한 추천가입니다.
                          </p>
                        </div>
                        <span className="rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold text-white">
                          {state.ingredientRateMode === "manual" ? "수동 기준" : "추천 기준"}
                        </span>
                      </div>

                      <div className="mt-4">{renderRecommendedPrices(selectedMenuResult)}</div>

                      <div className="mt-4 rounded-[22px] bg-white/10 px-4 py-3">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-white/80">권장가까지 차이</span>
                          <span className="font-semibold text-white">
                            {selectedMenuResult.priceGapLabel}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                          <span className="text-white/80">30% 기준가</span>
                          <span className="font-semibold text-white">
                            {formatCurrency(selectedMenuResult.ingredientRecommendedAveragePrice)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                          <span className="text-white/80">목표 순익 기준가</span>
                          <span className="font-semibold text-white">
                            {formatCurrency(selectedMenuResult.goalRecommendedAveragePrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <LockedInfoCard
                      label="현재 원재료비율"
                      value={formatPercent(selectedMenuResult.directIngredientRate)}
                      hint="사용자가 입력한 가격과 레시피 기준 자동 계산"
                    />
                    <LockedInfoCard
                      label="실질 원가율"
                      value={formatPercent(selectedMenuResult.costRate)}
                      hint="포장재, 변동비, 로스까지 포함한 운영 기준"
                    />
                    <LockedInfoCard
                      label="월 공헌이익"
                      value={formatCompactCurrencyPerMonth(selectedMenuResult.monthlyContribution)}
                      hint="이 메뉴가 한 달에 남기는 기여 이익"
                    />
                    <LockedInfoCard
                      label="적용 원재료 기준"
                      value={formatPercent(result.appliedIngredientRate)}
                      hint="현재 추천값 또는 수동값으로 적용 중인 기준"
                      emphasis="recommended"
                    />
                  </div>
                </section>

                <MenuSpecPanel
                  menu={selectedMenu}
                  ingredientCatalog={ingredientCatalog}
                  packagingCatalog={packagingCatalog}
                  activeTab={detailTab}
                  onChangeTab={setDetailTab}
                  dispatch={dispatch}
                />
              </>
            ) : (
              <section className="rounded-[28px] border border-dashed border-[#d9e3f6] bg-[#fbfdff] p-8 text-center text-[#61728f]">
                메뉴를 하나 선택하면 현재가, 권장가, 메뉴 스펙을 여기서 볼 수 있습니다.
              </section>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <section className="rounded-[30px] border border-[#d9e3f6] bg-white p-5 shadow-[0_18px_48px_rgba(27,71,151,0.08)]">
          <div className="flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-[#1b4797]" />
            <h3 className="text-lg font-semibold text-[#13233f]">손익 진단과 목표 기준 역산</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#61728f]">
            지금 얼마가 남는지, 목표까지 얼마나 부족한지, 평균 얼마를 조정해야 하는지 한 번에 보여줍니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <LockedInfoCard
              label="현재 연 순이익"
              value={formatCompactCurrencyPerYear(result.totals.annualNetProfit)}
              hint="현재 입력값을 12개월 유지했을 때 예상되는 값"
            />
            <LockedInfoCard
              label="필요 방문객"
              value={formatVisitorsPerDay(result.requiredVisitorsPerDay)}
              hint="현재 구조를 유지하면서 목표를 맞추려면 필요한 방문객 수"
            />
            <LockedInfoCard
              label="필요 객단가"
              value={formatCurrency(result.result.requiredAverageTicket)}
              hint="현재 방문객 수 기준으로 목표를 맞추기 위한 평균 객단가"
              emphasis="recommended"
            />
            <LockedInfoCard
              label="추천 원재료율"
              value={formatPercent(result.recommendedIngredientRate)}
              hint={`권장 범위 ${formatPercent(result.recommendedIngredientRateRange.min)} ~ ${formatPercent(result.recommendedIngredientRateRange.max)}`}
              emphasis="recommended"
            />
          </div>

          <div className="mt-5 rounded-[24px] border border-[#d9e3f6] bg-[#f8fbff] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7081a2]">
              결론
            </p>
            <div className="mt-3 space-y-2 text-sm leading-6 text-[#516281]">
              <p>현재 기준 월 순이익은 {formatCompactCurrencyPerMonth(result.totals.monthlyNetProfit)}입니다.</p>
              <p>
                목표 {formatCompactCurrencyPerMonth(state.targetMonthlyNetProfit)}까지{" "}
                {formatCompactCurrencyPerMonth(result.totals.targetMonthlyGap)}{" "}
                {result.totals.targetMonthlyGap > 0 ? "부족합니다." : "초과했습니다."}
              </p>
              <p>평균 메뉴가를 {formatCurrencyPerCup(result.averagePriceDeltaPerCup)} 조정해야 합니다.</p>
              <p>우선 조정 메뉴: {result.priorityMenuNames.join(", ") || "계산 중"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-[#d9e3f6] bg-white p-5 shadow-[0_18px_48px_rgba(27,71,151,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#1b4797]" />
              <h3 className="text-lg font-semibold text-[#13233f]">AI 분석</h3>
            </div>
            <button
              type="button"
              onClick={handleRunAiInsights}
              disabled={aiStatus === "loading"}
              className={cn(
                "inline-flex items-center gap-2 rounded-full bg-[#1b4797] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60",
                INTERACTIVE_CLASS,
              )}
            >
              <Sparkles className="h-4 w-4" />
              {aiStatus === "loading" ? "AI 분석 중" : "AI 분석"}
            </button>
          </div>

          <p className="mt-2 text-sm leading-6 text-[#61728f]">
            초보자도 바로 이해할 수 있게, 지금 손봐야 할 메뉴와 비용 요인을 짧게 정리합니다.
          </p>

          <div className="mt-5 space-y-3">
            {displayedInsights.map((insight, index) => (
              <div
                key={`${insight}-${index}`}
                className="rounded-[22px] border border-[#d9e3f6] bg-[#f8fbff] px-4 py-4"
              >
                <p className="text-sm leading-6 text-[#243655]">{insight}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[20px] border border-dashed border-[#d9e3f6] bg-white px-4 py-3">
            <p className="text-xs leading-6 text-[#61728f]">
              {aiMessage ?? "기본 분석은 항상 보이고, AI 분석을 누르면 더 자연스러운 문장으로 다시 정리합니다."}
            </p>
          </div>
        </section>
      </section>

      <section className="rounded-[30px] border border-[#d9e3f6] bg-white p-5 shadow-[0_18px_48px_rgba(27,71,151,0.08)]">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#1b4797]" />
          <h3 className="text-lg font-semibold text-[#13233f]">전체 손익 구조</h3>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#61728f]">
          현재 매출 안에서 어떤 비용이 얼마나 큰지, 월 단위 기준으로 바로 비교할 수 있습니다.
        </p>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-4">
            {costBreakdown.map((item) => (
              <CostBar
                key={item.label}
                label={item.label}
                amount={item.amount}
                ratio={item.amount / largestBreakdown}
                colorClass={item.colorClass}
              />
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-[#d9e3f6] bg-[#f8fbff] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7081a2]">
                가장 큰 비용 요인
              </p>
              <div className="mt-3 space-y-3">
                {result.topCostDrivers.slice(0, 5).map((driver) => (
                  <div key={driver.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[#243655]">{driver.label}</span>
                    <span className="font-semibold text-[#13233f]">
                      {formatCompactCurrencyPerMonth(driver.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#d9e3f6] bg-[#f8fbff] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7081a2]">
                운영 기준
              </p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-[#516281]">
                <p>월 매출: {formatCompactCurrencyPerMonth(result.totals.monthlySalesGross)}</p>
                <p>월 공헌이익: {formatCompactCurrencyPerMonth(result.result.monthlyContribution)}</p>
                <p>현재 적용 원재료율: {formatPercent(result.appliedIngredientRate)}</p>
                <p>
                  실질 평균 원가율:{" "}
                  {formatPercent(
                    result.result.menuResults.reduce((sum, menu) => sum + menu.costRate, 0) /
                      Math.max(result.result.menuResults.length, 1),
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
