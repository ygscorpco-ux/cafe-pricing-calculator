"use client";

import { AlertTriangle, CheckCircle2, Layers3, ReceiptText, Wallet } from "lucide-react";

import { formatCompactCurrency, formatPercent, statusTone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppCalculationResult, StoreCalculationResult } from "@/lib/types";

interface CoveragePanelProps {
  result: AppCalculationResult;
  selectedStoreResult: StoreCalculationResult;
}

const toneClass: Record<string, string> = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  zinc: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-[#d6ddd9] bg-white px-2.5 py-1 text-[11px] font-medium text-[#35534d]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function CoveragePanel({
  result,
  selectedStoreResult,
}: CoveragePanelProps) {
  const tone = statusTone(result.feasibility.status);
  const topDriver = result.topCostDrivers[0];

  return (
    <aside className="space-y-4 xl:sticky xl:top-6">
      <section className="rounded-[28px] border border-[#d4ddd9] bg-white/95 p-5 shadow-[0_14px_50px_rgba(22,52,46,0.08)] backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5f7f78]">
              상시 반영 패널
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#16342e]">
              지금 가격에 어떤 요소가 들어갔는지
            </h2>
          </div>
          <div
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              toneClass[tone],
            )}
          >
            {result.feasibility.label}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl bg-[#f5f9f7] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#24453f]">
              <Layers3 className="h-4 w-4" />
              현재 반영 카테고리
            </div>
            <p className="mt-2 text-xs leading-6 text-[#56706a]">
              {result.coverage.includedCategories.join(" · ")}
            </p>
            <p className="mt-3 text-xs font-medium text-[#6f8a84]">
              ON 상태 비용 항목 {result.coverage.activeItemCount}개
            </p>
          </div>

          <div className="rounded-2xl bg-[#fff7eb] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#7a5516]">
              <Wallet className="h-4 w-4" />
              가장 큰 비용 요인
            </div>
            <p className="mt-2 text-sm font-semibold text-[#50370d]">
              {topDriver ? `${topDriver.label} · ${formatCompactCurrency(topDriver.amount)}` : "계산 대기"}
            </p>
            <p className="mt-2 text-xs text-[#8c6b35]">
              목표가 기준 평균 인상률 {formatPercent(result.feasibility.averageIncreaseRate)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#d4ddd9] bg-white/90 p-5 shadow-[0_14px_40px_rgba(22,52,46,0.06)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#183a33]">
          <ReceiptText className="h-4 w-4" />
          현재 판매가에 반영된 요소
        </div>
        <div className="mt-3">
          <TagList items={result.coverage.priceFactors} />
        </div>

        <div className="mt-5 grid gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65847d]">
              원가율 계산 포함 요소
            </p>
            <div className="mt-2">
              <TagList items={result.coverage.costRateFactors} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65847d]">
              순이익 계산 포함 요소
            </p>
            <div className="mt-2">
              <TagList items={result.coverage.netProfitFactors} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#d4ddd9] bg-white/90 p-5 shadow-[0_14px_40px_rgba(22,52,46,0.06)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#183a33]">
          <CheckCircle2 className="h-4 w-4" />
          선택한 매장 핵심 상태
        </div>
        <dl className="mt-4 grid gap-3 text-sm text-[#35534d]">
          <div className="flex items-center justify-between">
            <dt>{selectedStoreResult.name} 월 순수익</dt>
            <dd className="font-semibold text-[#173a33]">
              {formatCompactCurrency(selectedStoreResult.monthlyNetProfit)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>필요 객단가</dt>
            <dd className="font-semibold text-[#173a33]">
              {formatCompactCurrency(selectedStoreResult.requiredAverageTicket)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>직접원가 + 포장원가</dt>
            <dd className="font-semibold text-[#173a33]">
              {formatCompactCurrency(
                selectedStoreResult.monthlyDirectCost +
                  selectedStoreResult.monthlyPackagingCost,
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[28px] border border-[#eadbc4] bg-[#fffaf2] p-5 shadow-[0_14px_40px_rgba(130,98,32,0.08)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#6b4a18]">
          <AlertTriangle className="h-4 w-4" />
          빠진 항목 경고
        </div>
        <ul className="mt-3 space-y-2 text-sm text-[#7b5d2a]">
          {result.coverage.warnings.length > 0 ? (
            result.coverage.warnings.map((warning) => <li key={warning}>• {warning}</li>)
          ) : (
            <li>• 현재 설정에서 큰 누락 경고는 없습니다.</li>
          )}
        </ul>
      </section>
    </aside>
  );
}
