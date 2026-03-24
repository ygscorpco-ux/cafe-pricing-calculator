"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Lock, Sparkles } from "lucide-react";

import { NumericInput } from "@/components/numeric-input";
import type { AppAction } from "@/lib/app-state";
import { calculateAppState } from "@/lib/calculations";
import { PRICING_STRATEGY_OPTIONS } from "@/lib/constants";
import { formatCompactCurrencyPerMonth, formatPercent, formatVisitorsPerDay } from "@/lib/format";
import type { AppState, PricingStrategy } from "@/lib/types";
import { cn, percentFromRatio, ratioFromPercentInput } from "@/lib/utils";

interface OnboardingFlowProps {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

function ChoiceCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[24px] border px-5 py-4 text-left transition",
        active
          ? "border-[#1b4797] bg-[#eef3ff] shadow-[0_14px_26px_rgba(27,71,151,0.10)]"
          : "border-[#d9e3f6] bg-white hover:border-[#9fb8ea] hover:bg-[#f8fbff]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-[#13233f]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[#62738f]">{description}</p>
        </div>
        <span
          className={cn(
            "mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full border",
            active
              ? "border-[#1b4797] bg-[#1b4797] text-white"
              : "border-[#cfdbf4] bg-white text-transparent",
          )}
        >
          <Check className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}

function StepField({
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
      <p className="mb-2 text-sm font-medium text-[#516281]">{label}</p>
      <NumericInput value={value} onChange={onChange} suffix={suffix} className="h-12" />
    </label>
  );
}

function LockedRecommendation({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#d9e3f6] bg-[#f8fbff] p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6c7fa5]">
        <Lock className="h-3.5 w-3.5" />
        자동 추천
      </div>
      <p className="mt-3 text-sm font-medium text-[#61728f]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#13233f]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#6d7d99]">{hint}</p>
    </div>
  );
}

export function OnboardingFlow({ state, dispatch }: OnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [showOptionalStep2, setShowOptionalStep2] = useState(false);
  const calculation = useMemo(() => calculateAppState(state), [state]);

  const steps = [
    {
      eyebrow: "STEP 1",
      title: "먼저 매출 기준을 정해볼게요.",
      description: "한 번만 정하면 뒤 숫자가 자연스럽게 맞춰집니다.",
      helperItems: ["월 기준인지 연 기준인지", "부가세 포함 가격인지", "결과를 어떤 기준으로 볼지"],
      previewItems: ["현재 월 순이익", "목표 대비 부족 금액", "메뉴별 권장가 차이", "먼저 손볼 메뉴"],
    },
    {
      eyebrow: "STEP 2",
      title: "필수 숫자 4개만 먼저 넣어주세요.",
      description: "처음에는 월매출, 월세, 총 인건비, 카드 비중만으로도 결과를 볼 수 있습니다.",
      helperItems: ["월매출 또는 연매출", "월세", "총 인건비", "카드 비중"],
      previewItems: ["현재 순이익", "평균 얼마 올려야 하는지", "메뉴별 현재가와 권장가", "고급 설정은 나중에"],
    },
    {
      eyebrow: "STEP 3",
      title: "마지막으로 목표만 정해볼게요.",
      description: "원재료율은 앱이 추천하고, 사용자는 목표와 가격 성향만 고르면 됩니다.",
      helperItems: ["목표 월 순이익", "월 영업일수", "가격 전략 성향"],
      previewItems: ["예상 권장 원재료율", "현재 구조 기준 필요 방문객", "평균 조정 필요액", "우선 조정 메뉴 TOP 3"],
    },
  ];

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const basisField = state.wizard.salesBasis === "monthly" ? "monthlySales" : "annualSales";
  const basisLabel = state.wizard.salesBasis === "monthly" ? "월매출" : "연매출";
  const basisValue =
    state.wizard.salesBasis === "monthly"
      ? state.store.sales.monthlySales
      : state.store.sales.annualSales;

  const completeWizard = () => {
    dispatch({ type: "setIngredientRateMode", value: "recommended" });
    dispatch({ type: "completeWizard" });
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <div className="mx-auto max-w-[1520px]">
        <div className="grid overflow-hidden rounded-[36px] border border-white/70 bg-white shadow-[0_32px_120px_rgba(27,71,151,0.18)] lg:grid-cols-[1.15fr_0.85fr]">
          <section className="p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#6d82a6]">
              {currentStep.eyebrow}
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#13233f] sm:text-3xl">
              {currentStep.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5f6f89] sm:text-base">
              {currentStep.description}
            </p>

            {stepIndex === 0 ? (
              <div className="mt-8 space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ChoiceCard
                    active={state.wizard.salesBasis === "monthly"}
                    title="월매출 기준"
                    description="대부분 초보 사장님이 가장 익숙하게 보는 방식입니다."
                    onClick={() => dispatch({ type: "setSalesBasis", value: "monthly" })}
                  />
                  <ChoiceCard
                    active={state.wizard.salesBasis === "annual"}
                    title="연매출 기준"
                    description="연 목표나 사업계획서 기준으로 생각할 때 편합니다."
                    onClick={() => dispatch({ type: "setSalesBasis", value: "annual" })}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ChoiceCard
                    active={state.wizard.vatMode === "inclusive"}
                    title="부가세 포함가"
                    description="메뉴판에 적힌 가격 그대로 계산할 때 씁니다."
                    onClick={() => dispatch({ type: "setVatMode", value: "inclusive" })}
                  />
                  <ChoiceCard
                    active={state.wizard.vatMode === "exclusive"}
                    title="부가세 별도가"
                    description="공급가 기준으로 가격을 볼 때 씁니다."
                    onClick={() => dispatch({ type: "setVatMode", value: "exclusive" })}
                  />
                </div>
              </div>
            ) : null}

            {stepIndex === 1 ? (
              <div className="mt-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <StepField
                    label={basisLabel}
                    value={basisValue}
                    suffix="원"
                    onChange={(value) =>
                      dispatch({
                        type: "updateStoreField",
                        section: "sales",
                        field: basisField,
                        value,
                      })
                    }
                  />
                  <StepField
                    label="월세"
                    value={state.store.fixedCosts.monthlyRent}
                    suffix="원"
                    onChange={(value) =>
                      dispatch({
                        type: "updateStoreField",
                        section: "fixedCosts",
                        field: "monthlyRent",
                        value,
                      })
                    }
                  />
                  <StepField
                    label="총 인건비"
                    value={
                      state.store.labor.salariedPayroll +
                      state.store.labor.partTimeMonthlyPayroll
                    }
                    suffix="원"
                    onChange={(value) => {
                      const salaried = state.store.labor.salariedPayroll;
                      dispatch({
                        type: "updateStoreField",
                        section: "labor",
                        field: "partTimeMonthlyPayroll",
                        value: Math.max(0, value - salaried),
                      });
                    }}
                  />
                  <StepField
                    label="카드 비중"
                    value={percentFromRatio(state.store.sales.cardRatio)}
                    suffix="%"
                    onChange={(value) =>
                      dispatch({
                        type: "updateStoreField",
                        section: "sales",
                        field: "cardRatio",
                        value: ratioFromPercentInput(value),
                      })
                    }
                  />
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setShowOptionalStep2((current) => !current)}
                    className="rounded-full bg-[#eef3ff] px-4 py-2.5 text-sm font-semibold text-[#1b4797]"
                  >
                    {showOptionalStep2 ? "선택 입력 접기" : "선택 입력 더 보기"}
                  </button>
                </div>

                {showOptionalStep2 ? (
                  <div className="mt-4 grid gap-4 rounded-[28px] border border-[#d9e3f6] bg-[#f8fbff] p-4 sm:grid-cols-2">
                    <StepField
                      label="객단가"
                      value={state.store.sales.averageTicket}
                      suffix="원"
                      onChange={(value) =>
                        dispatch({
                          type: "updateStoreField",
                          section: "sales",
                          field: "averageTicket",
                          value,
                        })
                      }
                    />
                    <StepField
                      label="포장 비중"
                      value={percentFromRatio(state.store.sales.takeoutRatio)}
                      suffix="%"
                      onChange={(value) =>
                        dispatch({
                          type: "updateStoreField",
                          section: "sales",
                          field: "takeoutRatio",
                          value: ratioFromPercentInput(value),
                        })
                      }
                    />
                    <StepField
                      label="일평균 방문객"
                      value={state.store.sales.visitorsPerDay}
                      suffix="명"
                      onChange={(value) =>
                        dispatch({
                          type: "updateStoreField",
                          section: "sales",
                          field: "visitorsPerDay",
                          value,
                        })
                      }
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {stepIndex === 2 ? (
              <div className="mt-8 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <StepField
                    label="목표 월 순이익"
                    value={state.targetMonthlyNetProfit}
                    suffix="원"
                    onChange={(value) =>
                      dispatch({ type: "setTargetMonthlyNetProfit", value })
                    }
                  />
                  <StepField
                    label="월 영업일수"
                    value={state.store.sales.operatingDaysPerMonth}
                    suffix="일"
                    onChange={(value) =>
                      dispatch({
                        type: "updateStoreField",
                        section: "sales",
                        field: "operatingDaysPerMonth",
                        value,
                      })
                    }
                  />
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-[#516281]">가격 전략 성향</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {PRICING_STRATEGY_OPTIONS.map((option) => (
                      <ChoiceCard
                        key={option.value}
                        active={state.pricingStrategy === option.value}
                        title={option.label}
                        description={option.description}
                        onClick={() =>
                          dispatch({
                            type: "setPricingStrategy",
                            value: option.value as PricingStrategy,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <LockedRecommendation
                    label="예상 권장 원재료율"
                    value={formatPercent(calculation.recommendedIngredientRate)}
                    hint="현재 구조 기준 추천값입니다. 직접 수정은 고급 설정에서 가능합니다."
                  />
                  <LockedRecommendation
                    label="현재 구조 기준 필요 방문객"
                    value={formatVisitorsPerDay(calculation.requiredVisitorsPerDay)}
                    hint="지금 객단가와 메뉴 구성을 유지할 때 필요한 방문객 수입니다."
                  />
                  <LockedRecommendation
                    label="평균 조정 필요액"
                    value={formatCompactCurrencyPerMonth(calculation.totals.targetMonthlyGap)}
                    hint={`우선 조정 메뉴: ${calculation.priorityMenuNames.join(", ") || "계산 중"}`}
                  />
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                disabled={stepIndex === 0}
                className="inline-flex items-center gap-2 rounded-full border border-[#d9e3f6] px-4 py-2.5 text-sm font-semibold text-[#46618d] disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
                이전
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={completeWizard}
                  className="rounded-full bg-[#eef3ff] px-4 py-2.5 text-sm font-semibold text-[#1b4797]"
                >
                  기본값으로 시작
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isLastStep) {
                      completeWizard();
                      return;
                    }

                    setStepIndex((current) => current + 1);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1b4797] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(27,71,151,0.24)]"
                >
                  {isLastStep ? "결과 보기" : "다음"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          <aside className="bg-[linear-gradient(180deg,#1b4797_0%,#244f9f_100%)] p-6 text-white sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              Setup First
            </div>

            <h2 className="mt-6 text-xl font-semibold">답은 결과 화면에서 먼저 보여드립니다.</h2>
            <p className="mt-3 text-sm leading-7 text-white/80">
              지금은 필수 기준만 빠르게 맞추고, 자세한 비용 조정은 결과 화면에서 나중에 만집니다.
            </p>

            <div className="mt-8 rounded-[28px] border border-white/15 bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                이 단계에서 정하는 것
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                {currentStep.helperItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/15 bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                다음 화면에서 바로 보이는 것
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                {currentStep.previewItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/15 bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                현재 목표 기준
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                <p>목표 월 순이익 {formatCompactCurrencyPerMonth(state.targetMonthlyNetProfit)}</p>
                <p>추천 원재료율 {formatPercent(calculation.recommendedIngredientRate)}</p>
                <p>우선 조정 메뉴 {calculation.priorityMenuNames.join(", ") || "계산 중"}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
