"use client";

import { Fragment, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  ChevronDown,
  ChevronUp,
  Goal,
} from "lucide-react";

import { formatCompactCurrency, formatCurrency, formatPercent, statusTone } from "@/lib/format";
import { cn, percentFromRatio, ratioFromPercentInput } from "@/lib/utils";
import type { AppAction } from "@/lib/app-state";
import type { AppCalculationResult, AppState, MenuState, Temperature } from "@/lib/types";

interface ResultsDashboardProps {
  state: AppState;
  result: AppCalculationResult;
  dispatch: React.Dispatch<AppAction>;
}

function KpiCard({
  title,
  value,
  description,
  accent,
}: {
  title: string;
  value: string;
  description: string;
  accent: "teal" | "amber" | "rose" | "sky";
}) {
  const accentMap = {
    teal: "from-[#dff6ef] to-[#f7fffb] text-[#16342e]",
    amber: "from-[#fff1d6] to-[#fffaf2] text-[#5f430f]",
    rose: "from-[#ffe2df] to-[#fff8f7] text-[#6a2420]",
    sky: "from-[#dff3ff] to-[#f7fcff] text-[#133d5e]",
  } as const;

  return (
    <article
      className={cn(
        "rounded-[28px] border border-white/70 bg-gradient-to-br p-4 shadow-[0_14px_40px_rgba(22,52,46,0.08)]",
        accentMap[accent],
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">{title}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-xs leading-5 opacity-75">{description}</p>
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
      <div className="mb-1 flex items-center justify-between text-sm text-[#35534d]">
        <span>{label}</span>
        <span className="font-semibold text-[#16342e]">{formatCompactCurrency(amount)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e4ece8]">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
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
        "flex items-center rounded-2xl border border-[#d2dbd6] bg-white px-3",
        className,
      )}
    >
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-full bg-transparent text-sm text-[#173a33] outline-none"
      />
      {suffix ? <span className="text-xs text-[#6c8781]">{suffix}</span> : null}
    </div>
  );
}

function TemperaturePriceCell({
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
            <span className="w-8 rounded-full bg-[#eef5f2] px-2 py-1 text-[11px] font-semibold text-[#36534d]">
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
              className="rounded-3xl border border-[#d8e0dc] bg-[#f8fbfa] p-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[#173a33]">
                  {menu.name} {temperature.toUpperCase()}
                </h4>
                <label className="flex items-center gap-2 text-xs text-[#57746e]">
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
                  <p className="mb-1 text-xs font-medium text-[#62807a]">판매가</p>
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
                  <p className="mb-1 text-xs font-medium text-[#62807a]">컵 용량</p>
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
                  <p className="mb-1 text-xs font-medium text-[#62807a]">샷 수</p>
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
                    suffix="샷"
                  />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b8881]">
                  재료 구성
                </p>
                <div className="mt-2 grid gap-2">
                  {variant.recipe.map((usage) => (
                    <label
                      key={usage.itemId}
                      className="grid grid-cols-[1fr_110px] items-center gap-3 rounded-2xl border border-[#dce4e0] bg-white px-3 py-2"
                    >
                      <span className="text-sm text-[#284843]">
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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b8881]">
                  포장 구성
                </p>
                <div className="mt-2 grid gap-2">
                  {variant.packaging.map((usage) => (
                    <label
                      key={usage.itemId}
                      className="grid grid-cols-[1fr_110px] items-center gap-3 rounded-2xl border border-[#dce4e0] bg-white px-3 py-2"
                    >
                      <span className="text-sm text-[#284843]">
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

export function ResultsDashboard({ state, result, dispatch }: ResultsDashboardProps) {
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  const store = state.store;
  const calculation = result.result;
  const tone = statusTone(result.feasibility.status);
  const ingredientLabels = useMemo(
    () => new Map(state.priceCatalog.ingredients.map((item) => [item.id, item.label])),
    [state.priceCatalog.ingredients],
  );
  const packagingLabels = useMemo(
    () => new Map(state.priceCatalog.packaging.map((item) => [item.id, item.label])),
    [state.priceCatalog.packaging],
  );
  const recommendedSummary = calculation.menuResults
    .slice()
    .sort((left, right) => Math.abs(right.priceGap) - Math.abs(left.priceGap))
    .slice(0, 2);
  const biggestDriver = result.topCostDrivers[0];
  const costBase =
    calculation.monthlyDirectCost +
    calculation.monthlyPackagingCost +
    calculation.monthlyVariableCost +
    calculation.monthlyLossCost +
    calculation.monthlyLaborCost +
    calculation.monthlyFixedCost;

  return (
    <section className="space-y-5">
      <div className="rounded-[28px] border border-[#d5ddd9] bg-white/95 p-5 shadow-[0_16px_48px_rgba(22,52,46,0.06)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b7b74]">
              입력 다음 단계
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#16342e]">메뉴별 가격과 권장가</h2>
            <p className="mt-1 text-sm text-[#607d76]">
              입력값을 넣은 뒤 가장 먼저 보는 영역입니다. 가격을 바꾸면 아래 대시보드도 즉시
              다시 계산됩니다.
            </p>
          </div>
          <div className="rounded-full bg-[#eef4f2] px-4 py-2 text-xs font-semibold text-[#44635d]">
            판매 비중 합계 {store.menus.reduce((sum, menu) => sum + menu.share, 0).toFixed(1)}%
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[1120px] w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-[#6a8780]">
                <th className="pb-2">메뉴</th>
                <th className="pb-2">비중</th>
                <th className="pb-2">HOT 비중</th>
                <th className="pb-2">현재 판매가</th>
                <th className="pb-2">직접원가</th>
                <th className="pb-2">포장원가</th>
                <th className="pb-2">변동비</th>
                <th className="pb-2">원가율</th>
                <th className="pb-2">공헌이익</th>
                <th className="pb-2">권장가</th>
                <th className="pb-2">차이</th>
              </tr>
            </thead>
            <tbody>
              {calculation.menuResults.map((menuResult) => {
                const menu = store.menus.find((item) => item.id === menuResult.menuId);
                if (!menu) {
                  return null;
                }

                const expanded = expandedMenuId === menu.id;

                return (
                  <Fragment key={menu.id}>
                    <tr className="rounded-3xl bg-[#f8fbfa] text-sm text-[#203d37] shadow-[0_10px_24px_rgba(22,52,46,0.04)]">
                      <td className="rounded-l-3xl px-4 py-4">
                        <button
                          type="button"
                          onClick={() => setExpandedMenuId(expanded ? null : menu.id)}
                          className="flex items-center gap-2 font-semibold"
                        >
                          {expanded ? (
                            <ChevronUp className="h-4 w-4 text-[#66827c]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[#66827c]" />
                          )}
                          {menuResult.name}
                        </button>
                        <p className="mt-1 text-xs text-[#6a8780]">
                          {menuResult.temperatureSupport === "both"
                            ? "HOT/ICE"
                            : menuResult.temperatureSupport.toUpperCase()}
                        </p>
                      </td>
                      <td className="px-3 py-4">
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
                      </td>
                      <td className="px-3 py-4">
                        {menu.temperatureSupport === "both" ? (
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
                        ) : (
                          <span className="text-xs font-semibold text-[#5f7a74]">
                            {menu.temperatureSupport === "hot" ? "100%" : "0%"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <TemperaturePriceCell
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
                      </td>
                      <td className="px-3 py-4 font-medium">
                        {formatCurrency(menuResult.directCost)}
                      </td>
                      <td className="px-3 py-4 font-medium">
                        {formatCurrency(menuResult.packagingCost)}
                      </td>
                      <td className="px-3 py-4 font-medium">
                        {formatCurrency(menuResult.variableCost)}
                      </td>
                      <td className="px-3 py-4 font-medium">
                        {formatPercent(menuResult.costRate)}
                      </td>
                      <td className="px-3 py-4 font-semibold text-[#173a33]">
                        {formatCurrency(menuResult.contributionMargin)}
                      </td>
                      <td className="px-3 py-4">
                        <div className="grid gap-1 text-sm font-semibold text-[#173a33]">
                          {Object.entries(menuResult.recommendedPrices).map(
                            ([temperature, price]) => (
                              <span key={temperature}>
                                {temperature.toUpperCase()} {formatCurrency(price)}
                              </span>
                            ),
                          )}
                        </div>
                      </td>
                      <td className="rounded-r-3xl px-3 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                            menuResult.priceGap >= 0
                              ? "bg-[#fff1d6] text-[#855813]"
                              : "bg-[#e4f3ff] text-[#21587a]",
                          )}
                        >
                          {menuResult.priceGap >= 0 ? (
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownCircle className="h-3.5 w-3.5" />
                          )}
                          {menuResult.priceGap >= 0 ? "+" : ""}
                          {formatCurrency(menuResult.priceGap)}
                        </span>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr>
                        <td colSpan={11} className="px-2 pb-2 pt-1">
                          <VariantEditor
                            menu={menu}
                            dispatch={dispatch}
                            ingredientLabels={ingredientLabels}
                            packagingLabels={packagingLabels}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[32px] border border-[#d5ddd9] bg-white/95 p-5 shadow-[0_18px_60px_rgba(22,52,46,0.08)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5b7b74]">
              대시보드
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#16342e]">
              지금 가격으로 얼마나 남는지 한눈에 확인
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5f7f78]">
              메뉴 가격을 조정한 뒤 바로 확인하는 요약 영역입니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: "setAnalysisMode", mode: "current" })}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                state.analysisMode === "current"
                  ? "bg-[#16342e] text-white"
                  : "bg-[#eef3f1] text-[#35534d] hover:bg-[#e0ebe7]",
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
                  ? "bg-[#16342e] text-white"
                  : "bg-[#eef3f1] text-[#35534d] hover:bg-[#e0ebe7]",
              )}
            >
              목표 기준 역산
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            title="월 순수익"
            value={formatCompactCurrency(result.totals.monthlyNetProfit)}
            description="현재 가격과 비용 구조를 기준으로 계산한 월 순수익입니다."
            accent="teal"
          />
          <KpiCard
            title="연 순수익"
            value={formatCompactCurrency(result.totals.annualNetProfit)}
            description="월 순수익을 12개월 기준으로 환산한 값입니다."
            accent="sky"
          />
          <KpiCard
            title="권장 판매가"
            value={
              recommendedSummary[0]
                ? `${recommendedSummary[0].name} ${formatCurrency(recommendedSummary[0].recommendedAveragePrice)}`
                : "계산 대기"
            }
            description={
              recommendedSummary.length > 1
                ? `${recommendedSummary[1].name} ${formatCurrency(recommendedSummary[1].recommendedAveragePrice)}`
                : "판매량 비중을 기준으로 메뉴별 추천가를 계산합니다."
            }
            accent="amber"
          />
          <KpiCard
            title="현재가 대비 차이"
            value={
              recommendedSummary[0]
                ? `${recommendedSummary[0].priceGap >= 0 ? "+" : ""}${formatCurrency(recommendedSummary[0].priceGap)}`
                : "0원"
            }
            description="가장 변동 폭이 큰 메뉴 기준입니다."
            accent={
              recommendedSummary[0]?.priceGap && recommendedSummary[0].priceGap < 0
                ? "sky"
                : "amber"
            }
          />
          <KpiCard
            title="목표 달성 가능 여부"
            value={result.feasibility.label}
            description={`평균 권장 인상률 ${formatPercent(result.feasibility.averageIncreaseRate)}`}
            accent={tone === "rose" ? "rose" : tone === "amber" ? "amber" : "teal"}
          />
          <KpiCard
            title="수익을 가장 깎는 항목"
            value={biggestDriver ? biggestDriver.label : "데이터 없음"}
            description={
              biggestDriver
                ? `${formatCompactCurrency(biggestDriver.amount)} 수준으로 손익을 깎고 있습니다.`
                : "계산 결과가 준비되면 비용 요인이 표시됩니다."
            }
            accent="rose"
          />
        </div>
      </div>

      {state.analysisMode === "target" ? (
        <div className="rounded-[28px] border border-[#d5ddd9] bg-white/95 p-5 shadow-[0_16px_48px_rgba(22,52,46,0.06)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#173a33]">
                <Goal className="h-4 w-4" />
                목표 기준 역산
              </div>
              <p className="mt-2 text-sm text-[#607d76]">
                목표 월 순이익을 넣으면 현재 판매 비중을 기준으로 메뉴별 권장가를 자동 제안합니다.
              </p>
            </div>

            <div className="w-full max-w-xs">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#68857f]">
                목표 월 순이익
              </p>
              <NumberInput
                value={state.targetMonthlyNetProfit}
                onChange={(value) => dispatch({ type: "setTargetMonthlyNetProfit", value })}
                suffix="원"
              />
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-[#f5f9f7] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b8882]">
                현재 월 순수익
              </p>
              <p className="mt-2 text-xl font-semibold text-[#173a33]">
                {formatCompactCurrency(result.totals.monthlyNetProfit)}
              </p>
            </div>
            <div className="rounded-3xl bg-[#fff7eb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a692d]">
                목표까지 남은 금액
              </p>
              <p className="mt-2 text-xl font-semibold text-[#5f430f]">
                {formatCompactCurrency(result.totals.targetMonthlyGap)}
              </p>
            </div>
            <div className="rounded-3xl bg-[#eef5ff] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5e7891]">
                필요 객단가
              </p>
              <p className="mt-2 text-xl font-semibold text-[#16314e]">
                {formatCompactCurrency(calculation.requiredAverageTicket)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-[28px] border border-[#d5ddd9] bg-white/95 p-5 shadow-[0_16px_48px_rgba(22,52,46,0.06)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#173a33]">
          <Calculator className="h-4 w-4" />
          전체 순익 구조
        </div>
        <div className="mt-4 grid gap-3">
          <MetricBar
            label="직접 원재료비"
            amount={calculation.monthlyDirectCost}
            total={costBase}
            tone="bg-[#2c8d78]"
          />
          <MetricBar
            label="포장재"
            amount={calculation.monthlyPackagingCost}
            total={costBase}
            tone="bg-[#49a78a]"
          />
          <MetricBar
            label="변동비"
            amount={calculation.monthlyVariableCost}
            total={costBase}
            tone="bg-[#e29b35]"
          />
          <MetricBar
            label="로스/폐기"
            amount={calculation.monthlyLossCost}
            total={costBase}
            tone="bg-[#efb94f]"
          />
          <MetricBar
            label="인건비"
            amount={calculation.monthlyLaborCost}
            total={costBase}
            tone="bg-[#d96552]"
          />
          <MetricBar
            label="고정비"
            amount={calculation.monthlyFixedCost}
            total={costBase}
            tone="bg-[#9a5e54]"
          />
        </div>
      </div>
    </section>
  );
}
