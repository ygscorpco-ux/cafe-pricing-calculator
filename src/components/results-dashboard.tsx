"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  Goal,
  PiggyBank,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { NumericInput } from "@/components/numeric-input";
import { buildAiInsightRequest, type AiInsightResponse } from "@/lib/ai-insights";
import type { AppAction } from "@/lib/app-state";
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/lib/format";
import type { AppCalculationResult, AppState, MenuResult, MenuState, Temperature } from "@/lib/types";
import { cn, percentFromRatio, ratioFromPercentInput } from "@/lib/utils";

interface ResultsDashboardProps {
  state: AppState;
  result: AppCalculationResult;
  dispatch: React.Dispatch<AppAction>;
  isInputTrayOpen: boolean;
  onOpenInputTray: () => void;
  onToggleInputTray: () => void;
  inlineInputTray?: React.ReactNode;
}

function NumberInput({ value, onChange, suffix, className }: { value: number; onChange: (value: number) => void; suffix?: string; className?: string; }) {
  return <NumericInput value={value} onChange={onChange} suffix={suffix} className={className} />;
}

function SummaryPill({ label, value, tone = "blue" }: { label: string; value: string; tone?: "blue" | "amber" | "rose" | "emerald"; }) {
  const toneClass = tone === "amber" ? "border-[#f6dfb2] bg-[#fff8e9]" : tone === "rose" ? "border-[#f4d7dc] bg-[#fff5f6]" : tone === "emerald" ? "border-[#d6ece4] bg-[#f5fbf8]" : "border-[#d9e3f6] bg-white";
  return (
    <div className={cn("rounded-[18px] border px-4 py-3", toneClass)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#13233f]">{value}</p>
    </div>
  );
}

function SummaryStat({ label, value, description, accent }: { label: string; value: string; description: string; accent?: "blue" | "amber" | "rose"; }) {
  const toneClass = accent === "amber" ? "border-[#f6dfb2] bg-[#fff8e9]" : accent === "rose" ? "border-[#f4d7dc] bg-[#fff5f6]" : "border-[#d9e3f6] bg-white";
  return (
    <article className={cn("rounded-[24px] border p-4", toneClass)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[#13233f]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#61728f]">{description}</p>
    </article>
  );
}

function MetricBar({ label, amount, total, tone }: { label: string; amount: number; total: number; tone: string; }) {
  const ratio = total > 0 ? Math.min(amount / total, 1) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm text-[#516281]">
        <span>{label}</span>
        <span className="font-semibold text-[#13233f]">{formatCompactCurrency(amount)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#e6edf9]"><div className={cn("h-full rounded-full", tone)} style={{ width: `${ratio * 100}%` }} /></div>
    </div>
  );
}

function MenuMetric({ label, value, tone = "blue" }: { label: string; value: string; tone?: "blue" | "amber" | "rose" | "emerald"; }) {
  const toneClass = tone === "amber" ? "bg-[#fff7e5]" : tone === "rose" ? "bg-[#fff5f6]" : tone === "emerald" ? "bg-[#f5fbf8]" : "bg-[#f8fbff]";
  return (
    <div className={cn("rounded-2xl p-3", toneClass)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7081a2]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#13233f]">{value}</p>
    </div>
  );
}

function EditablePriceGroup({ menu, currentPrices, onChange }: { menu: MenuState; currentPrices: Partial<Record<Temperature, number>>; onChange: (temperature: Temperature, value: number) => void; }) {
  if (menu.temperatureSupport === "both") {
    return (
      <div className="grid gap-2">
        {(["hot", "ice"] as Temperature[]).map((temperature) => (
          <div key={temperature} className="flex items-center gap-2">
            <span className="w-9 rounded-full bg-[#eef3ff] px-2 py-1 text-[11px] font-semibold text-[#1b4797]">{temperature.toUpperCase()}</span>
            <NumberInput value={currentPrices[temperature] ?? 0} onChange={(value) => onChange(temperature, value)} suffix="원" className="h-10" />
          </div>
        ))}
      </div>
    );
  }

  const temperature = menu.temperatureSupport === "hot" ? "hot" : "ice";
  return <NumberInput value={currentPrices[temperature] ?? 0} onChange={(value) => onChange(temperature, value)} suffix="원" className="h-10" />;
}

function RecommendedPriceList({ prices }: { prices: Partial<Record<Temperature, number>> }) {
  return (
    <div className="space-y-1 text-xl font-semibold text-white">
      {Object.entries(prices).map(([temperature, price]) => (
        <div key={temperature}>{temperature.toUpperCase()} {formatCurrency(price)}</div>
      ))}
    </div>
  );
}

function getMenuStatus(menuResult: MenuResult, targetIngredientRate: number) {
  if (Math.abs(menuResult.priceGap) >= 1500) return { label: "조정 큼", tone: "rose" as const };
  if (menuResult.directIngredientRate > targetIngredientRate || menuResult.costRate >= 0.4) return { label: "조정 필요", tone: "amber" as const };
  return { label: "양호", tone: "emerald" as const };
}

function buildInsights({ result, highestRawRateMenu, largestIngredientGapMenu, strongestMarginMenu }: { result: AppCalculationResult; highestRawRateMenu?: MenuResult; largestIngredientGapMenu?: MenuResult; strongestMarginMenu?: MenuResult; }) {
  const insights: string[] = [];
  const biggestDriver = result.topCostDrivers[0];
  if (highestRawRateMenu) insights.push(`${highestRawRateMenu.name}의 원재료비율이 ${formatPercent(highestRawRateMenu.directIngredientRate)}로 가장 높습니다. 권장가부터 먼저 확인하는 편이 좋습니다.`);
  if (largestIngredientGapMenu && largestIngredientGapMenu.ingredientBudgetGap > 0) insights.push(`${largestIngredientGapMenu.name}는 목표 원재료비보다 ${formatCurrency(largestIngredientGapMenu.ingredientBudgetGap)} 초과되어 있습니다.`);
  if (biggestDriver) insights.push(`${biggestDriver.label}가 월 ${formatCompactCurrency(biggestDriver.amount)} 수준으로 가장 큰 비용입니다.`);
  if (strongestMarginMenu) insights.push(`${strongestMarginMenu.name}가 월 ${formatCompactCurrency(strongestMarginMenu.monthlyContribution)}의 공헌이익을 내는 핵심 메뉴입니다.`);
  return insights.slice(0, 3);
}

export function ResultsDashboard({ state, result, dispatch, isInputTrayOpen, onOpenInputTray, onToggleInputTray, inlineInputTray }: ResultsDashboardProps) {
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [showSelectedSettings, setShowSelectedSettings] = useState(false);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiModel, setAiModel] = useState<string | null>(null);
  const [lastAiRequestKey, setLastAiRequestKey] = useState<string | null>(null);
  const store = state.store;
  const calculation = result.result;
  const averageIngredientRate = calculation.monthlySalesGross > 0 ? calculation.monthlyDirectCost / calculation.monthlySalesGross : 0;
  const averageEffectiveCostRate = calculation.monthlySalesSupply > 0 ? (calculation.monthlyDirectCost + calculation.monthlyPackagingCost + calculation.monthlyVariableCost + calculation.monthlyLossCost) / calculation.monthlySalesSupply : 0;
  const costBase = calculation.monthlyDirectCost + calculation.monthlyPackagingCost + calculation.monthlyVariableCost + calculation.monthlyLossCost + calculation.monthlyLaborCost + calculation.monthlyFixedCost;
  const highestRawRateMenu = calculation.menuResults.slice().sort((a, b) => b.directIngredientRate - a.directIngredientRate)[0];
  const highestEffectiveCostMenu = calculation.menuResults.slice().sort((a, b) => b.costRate - a.costRate)[0];
  const strongestMarginMenu = calculation.menuResults.slice().sort((a, b) => b.monthlyContribution - a.monthlyContribution)[0];
  const largestIngredientGapMenu = calculation.menuResults.slice().sort((a, b) => b.ingredientBudgetGap - a.ingredientBudgetGap)[0];
  const hottestGapMenu = calculation.menuResults.slice().sort((a, b) => Math.abs(b.priceGap) - Math.abs(a.priceGap))[0];
  const sortedMenus = useMemo(() => calculation.menuResults.slice().sort((a, b) => Math.abs(b.priceGap) - Math.abs(a.priceGap)), [calculation.menuResults]);
  const aiRequest = useMemo(() => buildAiInsightRequest(state, result), [state, result]);
  const aiRequestKey = useMemo(() => JSON.stringify(aiRequest), [aiRequest]);
  const isAiStale = Boolean(lastAiRequestKey && lastAiRequestKey !== aiRequestKey);
  const displayedInsights = aiInsights.length > 0 ? aiInsights : buildInsights({ result, highestRawRateMenu, largestIngredientGapMenu, strongestMarginMenu });

  const defaultSelectedMenuId = hottestGapMenu?.menuId ?? sortedMenus[0]?.menuId ?? null;
  const activeSelectedMenuId =
    selectedMenuId && sortedMenus.some((menu) => menu.menuId === selectedMenuId)
      ? selectedMenuId
      : defaultSelectedMenuId;
  const selectedMenuResult =
    sortedMenus.find((menu) => menu.menuId === activeSelectedMenuId) ?? sortedMenus[0] ?? null;
  const selectedMenu = store.menus.find((item) => item.id === selectedMenuResult?.menuId) ?? null;
  const priorityCards = [
    hottestGapMenu ? { key: "gap", label: "가격 차이 가장 큼", name: hottestGapMenu.name, value: `${hottestGapMenu.priceGap >= 0 ? "+" : ""}${formatCurrency(hottestGapMenu.priceGap)}`, tone: "blue" as const, menuId: hottestGapMenu.menuId } : null,
    highestRawRateMenu ? { key: "ingredient", label: "원재료비율 가장 높음", name: highestRawRateMenu.name, value: formatPercent(highestRawRateMenu.directIngredientRate), tone: "amber" as const, menuId: highestRawRateMenu.menuId } : null,
    highestEffectiveCostMenu ? { key: "effective", label: "운영 원가 가장 무거움", name: highestEffectiveCostMenu.name, value: formatPercent(highestEffectiveCostMenu.costRate), tone: "rose" as const, menuId: highestEffectiveCostMenu.menuId } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; name: string; value: string; tone: "blue" | "amber" | "rose"; menuId: string }>;

  async function handleRunAiInsights() {
    setAiStatus("loading");
    setAiMessage(null);
    try {
      const response = await fetch("/api/ai-insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: aiRequestKey });
      const payload = (await response.json()) as AiInsightResponse | { error?: string };
      if (!response.ok) {
        const nextMessage = "message" in payload && typeof payload.message === "string" ? payload.message : "error" in payload && typeof payload.error === "string" ? payload.error : "AI 분석을 불러오지 못했습니다.";
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
      setAiMessage(payload.source === "ai" ? "AI 분석을 다시 읽어왔습니다." : "기본 분석을 보여주고 있습니다.");
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
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6c7fa5]">Summary</p>
            <h2 className="mt-1 text-base font-semibold text-[#13233f]">먼저 볼 숫자</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[420px]">
            <div className="rounded-[18px] border border-[#d9e3f6] bg-[#f8fbff] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">목표 월 순이익</p>
              <NumberInput value={state.targetMonthlyNetProfit} onChange={(value) => dispatch({ type: "setTargetMonthlyNetProfit", value })} suffix="원" className="mt-2 h-10" />
            </div>
            <div className="rounded-[18px] border border-[#d9e3f6] bg-[#f8fbff] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">목표 원재료비율</p>
              <NumberInput value={percentFromRatio(state.targetIngredientRate)} onChange={(value) => dispatch({ type: "setTargetIngredientRate", value: ratioFromPercentInput(value) })} suffix="%" className="mt-2 h-10" />
            </div>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryPill label="월 순이익" value={formatCompactCurrency(result.totals.monthlyNetProfit)} tone={result.totals.monthlyNetProfit >= 0 ? "blue" : "rose"} />
          <SummaryPill label="권장 객단가" value={formatCompactCurrency(calculation.requiredAverageTicket)} tone="amber" />
          <SummaryPill label="원재료비율" value={formatPercent(averageIngredientRate)} tone={averageIngredientRate > state.targetIngredientRate ? "amber" : "emerald"} />
          <SummaryPill label="운영 원가율" value={formatPercent(averageEffectiveCostRate)} tone={averageEffectiveCostRate >= 0.45 ? "rose" : averageEffectiveCostRate >= 0.35 ? "amber" : "emerald"} />
          <SummaryPill label="연 순이익" value={formatCompactCurrency(result.totals.annualNetProfit)} />
        </div>
      </section>

      {inlineInputTray ? <div className="hidden xl:block">{inlineInputTray}</div> : null}

      <section className="rounded-[30px] border border-[#d9e3f6] bg-white p-5 shadow-[0_18px_48px_rgba(27,71,151,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6c7fa5]">Menu Focus</p>
            <h3 className="mt-2 text-xl font-semibold text-[#13233f]">먼저 손볼 메뉴</h3>
            <p className="mt-2 text-sm leading-6 text-[#61728f]">모든 메뉴를 한 번에 보지 말고, 우선순위 높은 메뉴부터 확인하세요.</p>
          </div>
          <button type="button" onClick={onToggleInputTray} className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-4 py-2.5 text-sm font-semibold text-[#1b4797]">
            <Sparkles className="h-4 w-4" />
            {isInputTrayOpen ? "상세 설정 닫기" : "상세 설정 열기"}
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {priorityCards.map((card) => (
            <button key={card.key} type="button" onClick={() => { setSelectedMenuId(card.menuId); setShowSelectedSettings(false); }} className={cn("rounded-[24px] border px-4 py-4 text-left transition", card.tone === "amber" ? "border-[#f6dfb2] bg-[#fff8e9]" : card.tone === "rose" ? "border-[#f4d7dc] bg-[#fff5f6]" : "border-[#d9e3f6] bg-[#f8fbff]")}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">{card.label}</p>
              <p className="mt-3 text-xl font-semibold text-[#13233f]">{card.name}</p>
              <p className="mt-2 text-sm font-medium text-[#425673]">{card.value}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[30px] border border-[#d9e3f6] bg-white p-5 shadow-[0_18px_48px_rgba(27,71,151,0.08)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6c7fa5]">Menu Pricing</p>
            <h3 className="mt-2 text-xl font-semibold text-[#13233f]">메뉴별 권장가</h3>
            <p className="mt-2 text-sm leading-6 text-[#61728f]">왼쪽에서 메뉴를 고르고, 오른쪽에서 선택한 메뉴만 깊게 봅니다.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#1b4797]">
            <span className="rounded-full bg-[#eef3ff] px-4 py-2">차이 큰 순으로 정렬</span>
            <span className="rounded-full bg-[#eef3ff] px-4 py-2">메뉴 {sortedMenus.length}개</span>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[28px] border border-[#d9e3f6] bg-[#fbfdff] p-3">
            <div className="space-y-2">
              {sortedMenus.map((menuResult) => {
                const status = getMenuStatus(menuResult, state.targetIngredientRate);
                const active = menuResult.menuId === selectedMenuResult?.menuId;
                return (
                  <button key={menuResult.menuId} type="button" onClick={() => { setSelectedMenuId(menuResult.menuId); setShowSelectedSettings(false); }} className={cn("flex w-full items-center justify-between gap-3 rounded-[22px] border px-4 py-4 text-left transition", active ? "border-[#1b4797] bg-[#eef3ff] shadow-[0_14px_26px_rgba(27,71,151,0.10)]" : "border-[#e3ebf9] bg-white hover:border-[#a9bfe8] hover:bg-[#f8fbff]")}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-base font-semibold text-[#13233f]">{menuResult.name}</p>
                        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", status.tone === "rose" ? "bg-[#ffe5e8] text-[#a33f4c]" : status.tone === "amber" ? "bg-[#fff0cf] text-[#a87106]" : "bg-[#e7f6ef] text-[#1f7a56]")}>{status.label}</span>
                      </div>
                      <p className="mt-2 text-sm text-[#61728f]">현재 {formatCurrency(menuResult.currentAveragePrice)} · 권장 {formatCurrency(menuResult.recommendedAveragePrice)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-semibold text-[#13233f]">{menuResult.priceGap >= 0 ? "+" : ""}{formatCurrency(menuResult.priceGap)}</p>
                      <p className="mt-1 text-xs text-[#61728f]">현재가 대비</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedMenu && selectedMenuResult ? (
            <section className="rounded-[28px] border border-[#d9e3f6] bg-[#fbfdff] p-5 shadow-[0_12px_30px_rgba(27,71,151,0.05)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-2xl font-semibold text-[#13233f]">{selectedMenuResult.name}</h4>
                    <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-xs font-semibold text-[#1b4797]">비중 {selectedMenu.share.toFixed(1)}%</span>
                  </div>
                  <p className="mt-2 text-sm text-[#61728f]">{selectedMenuResult.temperatureSupport === "both" ? "HOT / ICE 모두 판매" : `${selectedMenuResult.temperatureSupport.toUpperCase()} 전용 메뉴`}</p>
                </div>
                <button type="button" onClick={() => setShowSelectedSettings((current) => !current)} className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-4 py-2.5 text-sm font-semibold text-[#1b4797]">
                  {showSelectedSettings ? "세부 수치 닫기" : "세부 수치 열기"}
                </button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-[24px] border border-[#e0e8f8] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">현재 판매가</p>
                  <div className="mt-3"><EditablePriceGroup menu={selectedMenu} currentPrices={selectedMenuResult.currentPrices} onChange={(temperature, value) => dispatch({ type: "updateMenuVariantField", menuId: selectedMenu.id, temperature, field: "price", value })} /></div>
                </div>

                <div className="rounded-[24px] border border-[#2955a4] bg-[linear-gradient(135deg,#1b4797_0%,#2f62b5_100%)] p-5 text-white shadow-[0_16px_34px_rgba(27,71,151,0.20)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/72">최종 권장 판매가</p>
                      <p className="mt-1 text-sm text-white/80">30% 기준과 목표 순익 기준 중 더 높은 값을 씁니다.</p>
                    </div>
                    <span className="rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold">기준 {percentFromRatio(state.targetIngredientRate)}%</span>
                  </div>
                  <div className="mt-5"><RecommendedPriceList prices={selectedMenuResult.recommendedPrices} /></div>
                  <div className="mt-4">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold", selectedMenuResult.priceGap >= 0 ? "bg-white/16 text-white" : "bg-white text-[#1b4797]")}>
                      {selectedMenuResult.priceGap >= 0 ? <ArrowUpCircle className="h-3.5 w-3.5" /> : <ArrowDownCircle className="h-3.5 w-3.5" />}
                      현재가보다 {selectedMenuResult.priceGap >= 0 ? "+" : ""}{formatCurrency(selectedMenuResult.priceGap)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <MenuMetric label="현재 원재료비" value={formatCurrency(selectedMenuResult.directCost)} tone="blue" />
                <MenuMetric label="30% 허용 원재료비" value={formatCurrency(selectedMenuResult.targetIngredientBudget)} tone="amber" />
                <MenuMetric label="현재 원재료비율" value={formatPercent(selectedMenuResult.directIngredientRate)} tone={selectedMenuResult.directIngredientRate > state.targetIngredientRate ? "amber" : "emerald"} />
                <MenuMetric label="운영 원가율" value={formatPercent(selectedMenuResult.costRate)} tone={selectedMenuResult.costRate >= 0.45 ? "rose" : "amber"} />
                <MenuMetric label="잔당 공헌이익" value={formatCurrency(selectedMenuResult.contributionMargin)} tone="emerald" />
              </div>

              {showSelectedSettings ? (
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <MenuMetric label="월 공헌이익" value={formatCompactCurrency(selectedMenuResult.monthlyContribution)} tone="blue" />
                  <MenuMetric label="30% 기준가" value={formatCurrency(selectedMenuResult.ingredientRecommendedAveragePrice)} tone="amber" />
                  <MenuMetric label="목표 순익 기준가" value={formatCurrency(selectedMenuResult.goalRecommendedAveragePrice)} tone="blue" />
                  <button type="button" onClick={onOpenInputTray} className="rounded-2xl bg-[#eef3ff] px-4 py-3 text-sm font-semibold text-[#1b4797]">세부 비용 패널 열기</button>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[30px] border border-[#d9e3f6] bg-white p-5 shadow-[0_18px_48px_rgba(27,71,151,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6c7fa5]">Profit Diagnosis</p>
              <h3 className="mt-2 text-xl font-semibold text-[#13233f]">손익 진단</h3>
              <p className="mt-2 text-sm leading-6 text-[#61728f]">메뉴와 비용 중 어디를 먼저 손봐야 하는지 빠르게 보는 영역입니다.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => dispatch({ type: "setAnalysisMode", mode: "current" })} className={cn("rounded-full px-4 py-2 text-sm font-semibold transition", state.analysisMode === "current" ? "bg-[#1b4797] text-white" : "bg-[#eef3ff] text-[#1b4797] hover:bg-[#dde8ff]")}>현재 기준 분석</button>
              <button type="button" onClick={() => dispatch({ type: "setAnalysisMode", mode: "target" })} className={cn("rounded-full px-4 py-2 text-sm font-semibold transition", state.analysisMode === "target" ? "bg-[#1b4797] text-white" : "bg-[#eef3ff] text-[#1b4797] hover:bg-[#dde8ff]")}>목표 기준 역산</button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <SummaryStat label="1년 기준 순이익" value={formatCompactCurrency(result.totals.annualNetProfit)} description="현재 가격과 비용 구조를 12개월 유지했을 때의 예상 순이익입니다." accent="blue" />
            <SummaryStat label="먼저 손볼 메뉴" value={highestRawRateMenu?.name ?? "계산 대기"} description={highestRawRateMenu ? `원재료비율 ${formatPercent(highestRawRateMenu.directIngredientRate)}` : "목표 원재료비율을 가장 크게 넘는 메뉴가 표시됩니다."} accent="amber" />
            <SummaryStat label="운영비가 무거운 메뉴" value={highestEffectiveCostMenu?.name ?? "계산 대기"} description={highestEffectiveCostMenu ? `운영 원가율 ${formatPercent(highestEffectiveCostMenu.costRate)}` : "포장재와 수수료까지 넣었을 때 가장 무거운 메뉴가 표시됩니다."} accent="rose" />
          </div>
          {state.analysisMode === "target" ? (
            <div className="mt-5 rounded-[26px] border border-[#d9e3f6] bg-[#f8fbff] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#18376c]"><Goal className="h-4 w-4" />목표 기준 역산</div>
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
              <div className="flex items-center gap-2 text-sm font-semibold text-[#18376c]"><Sparkles className="h-4 w-4" />AI 분석</div>
              <p className="mt-2 text-sm leading-6 text-[#61728f]">지금 손봐야 할 메뉴와 비용을 짧게 읽어주는 보조 분석입니다.</p>
            </div>
            <button type="button" onClick={() => void handleRunAiInsights()} disabled={aiStatus === "loading"} className={cn("inline-flex min-w-[110px] items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition", aiStatus === "loading" ? "cursor-wait bg-[#dbe6fb] text-[#5d76a9]" : "bg-[#1b4797] text-white hover:bg-[#163d82]")}>
              <Sparkles className="h-4 w-4" />{aiStatus === "loading" ? "AI 분석 중" : "AI 분석"}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#eef3ff] px-3 py-1.5 text-xs font-semibold text-[#1b4797]">{aiInsights.length > 0 ? "GPT 분석 사용 가능" : "기본 규칙 분석"}</span>
            {aiModel ? <span className="rounded-full bg-[#f8fbff] px-3 py-1.5 text-xs font-semibold text-[#61728f]">모델 {aiModel}</span> : null}
            {isAiStale ? <span className="rounded-full bg-[#fff4dc] px-3 py-1.5 text-xs font-semibold text-[#9b6300]">설정이 바뀌어 AI 분석이 이전 기준입니다.</span> : null}
          </div>
          {aiMessage ? <div className={cn("mt-4 rounded-[18px] border px-4 py-3 text-sm leading-6", aiStatus === "error" ? "border-[#f4d7dc] bg-[#fff5f6] text-[#8f4152]" : "border-[#d9e3f6] bg-[#f8fbff] text-[#5a6d8f]")}>{aiMessage}</div> : null}
          <div className="mt-4 space-y-3">{displayedInsights.map((insight) => <div key={insight} className="rounded-[22px] bg-[#f8fbff] p-4 text-sm leading-7 text-[#425673]">{insight}</div>)}</div>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={onOpenInputTray} className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-4 py-2.5 text-sm font-semibold text-[#1b4797]"><WalletCards className="h-4 w-4" />세부 비용 더 조정하기</button></div>
        </aside>
      </section>

      <section className="rounded-[30px] border border-[#d9e3f6] bg-white p-5 shadow-[0_18px_48px_rgba(27,71,151,0.08)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#18376c]"><Calculator className="h-4 w-4" />전체 손익 구조</div>
        <p className="mt-2 text-sm leading-6 text-[#61728f]">원재료비, 포장재, 수수료, 인건비, 고정비 중 어디가 가장 무거운지 비교합니다.</p>
        <div className="mt-5 grid gap-3">
          <MetricBar label="직접 원재료비" amount={calculation.monthlyDirectCost} total={costBase} tone="bg-[#1b4797]" />
          <MetricBar label="포장재" amount={calculation.monthlyPackagingCost} total={costBase} tone="bg-[#3a6cc5]" />
          <MetricBar label="변동비" amount={calculation.monthlyVariableCost} total={costBase} tone="bg-[#f0b650]" />
          <MetricBar label="로스 / 폐기" amount={calculation.monthlyLossCost} total={costBase} tone="bg-[#f6ca75]" />
          <MetricBar label="인건비" amount={calculation.monthlyLaborCost} total={costBase} tone="bg-[#d86a76]" />
          <MetricBar label="고정비" amount={calculation.monthlyFixedCost} total={costBase} tone="bg-[#7f91b4]" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-[24px] bg-[#f8fbff] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[#18376c]"><PiggyBank className="h-4 w-4" />총 공헌이익</div><p className="mt-3 text-xl font-semibold text-[#13233f]">{formatCompactCurrency(calculation.monthlyContribution)}</p></div>
          <div className="rounded-[24px] bg-[#f8fbff] p-4"><p className="text-sm font-semibold text-[#18376c]">월 총매출</p><p className="mt-3 text-xl font-semibold text-[#13233f]">{formatCompactCurrency(result.totals.monthlySalesGross)}</p></div>
          <div className="rounded-[24px] bg-[#f8fbff] p-4"><p className="text-sm font-semibold text-[#18376c]">목표 달성 상태</p><p className="mt-3 text-xl font-semibold text-[#13233f]">{result.feasibility.label}</p></div>
        </div>
      </section>
    </section>
  );
}


