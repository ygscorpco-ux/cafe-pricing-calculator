"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

import { NumericInput } from "@/components/numeric-input";
import type { AppAction } from "@/lib/app-state";
import type { AppState } from "@/lib/types";
import { cn, percentFromRatio, ratioFromPercentInput } from "@/lib/utils";

interface OnboardingFlowProps {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  onClose: () => void;
}

function StepField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <p className="mb-2 text-sm font-medium text-[#516281]">{label}</p>
      <NumericInput value={value} onChange={onChange} suffix={suffix} className="h-12" />
    </label>
  );
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

export function OnboardingFlow({ state, dispatch, onClose }: OnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = useMemo(
    () => [
      {
        eyebrow: "STEP 1",
        title: "먼저 계산 기준을 맞춰둘게요.",
        description: "처음 한 번만 기준을 정해두면 뒤 결과가 훨씬 덜 헷갈립니다.",
        helperItems: ["월매출 / 연매출 기준", "부가세 포함 여부", "가격 계산 기준 통일"],
      },
      {
        eyebrow: "STEP 2",
        title: "핵심 숫자만 먼저 입력해 주세요.",
        description: "처음부터 모든 항목을 넣을 필요는 없습니다. 매출, 객단가, 월세, 인건비 정도면 결과를 볼 수 있습니다.",
        helperTitle: "이 단계가 중요한 이유",
        helperItems: ["월 순이익 계산 시작값", "권장가의 기본 방향", "목표와 현재 차이 계산"],
      },
      {
        eyebrow: "STEP 3",
        title: "마지막으로 목표를 정할게요.",
        description: "원하는 월 순이익과 원재료비 기준을 잡아두면 메뉴별 권장가가 바로 나옵니다.",
        helperTitle: "결과 화면에서 바로 보이는 것",
        helperItems: ["월 순이익 / 연 순이익", "메뉴별 현재가와 권장가 차이", "먼저 손볼 메뉴와 비용 요인"],
      },
    ],
    [],
  );

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const basisField = state.wizard.salesBasis === "monthly" ? "monthlySales" : "annualSales";
  const basisLabel = state.wizard.salesBasis === "monthly" ? "월매출" : "연매출";
  const basisValue =
    state.wizard.salesBasis === "monthly"
      ? state.store.sales.monthlySales
      : state.store.sales.annualSales;

  const handleSkip = () => {
    dispatch({ type: "completeWizard" });
    onClose();
  };

  const handleNext = () => {
    if (!isLastStep) {
      setStepIndex((current) => current + 1);
      return;
    }

    dispatch({ type: "completeWizard" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(19,35,63,0.28)] px-4 py-6 backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex min-h-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-0 overflow-hidden rounded-[36px] border border-white/70 bg-white shadow-[0_32px_120px_rgba(27,71,151,0.18)] lg:grid-cols-[1.15fr_0.85fr]">
          <section className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#6d82a6]">
                  {currentStep.eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#13233f] sm:text-3xl">
                  {currentStep.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-full bg-[#eef3ff] px-4 py-2 text-sm font-semibold text-[#1b4797]"
              >
                건너뛰기
              </button>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5f6f89] sm:text-base">
              {currentStep.description}
            </p>

            {stepIndex === 0 ? (
              <div className="mt-8 space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ChoiceCard
                    active={state.wizard.salesBasis === "monthly"}
                    title="월매출 기준"
                    description="대부분 처음 가격을 맞출 때 가장 쉽게 생각하는 방식입니다."
                    onClick={() => dispatch({ type: "setSalesBasis", value: "monthly" })}
                  />
                  <ChoiceCard
                    active={state.wizard.salesBasis === "annual"}
                    title="연매출 기준"
                    description="사업계획이나 연간 목표 기준으로 볼 때 더 편합니다."
                    onClick={() => dispatch({ type: "setSalesBasis", value: "annual" })}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ChoiceCard
                    active={state.wizard.vatMode === "inclusive"}
                    title="부가세 포함가"
                    description="메뉴판에 적힌 가격 그대로 넣고 보는 방식입니다."
                    onClick={() => dispatch({ type: "setVatMode", value: "inclusive" })}
                  />
                  <ChoiceCard
                    active={state.wizard.vatMode === "exclusive"}
                    title="부가세 별도가"
                    description="공급가 기준으로 가격 설계를 따로 볼 때 맞습니다."
                    onClick={() => dispatch({ type: "setVatMode", value: "exclusive" })}
                  />
                </div>

              </div>
            ) : null}

            {stepIndex === 1 ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
                  label="정직원 급여"
                  value={state.store.labor.salariedPayroll}
                  suffix="원"
                  onChange={(value) =>
                    dispatch({
                      type: "updateStoreField",
                      section: "labor",
                      field: "salariedPayroll",
                      value,
                    })
                  }
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
              </div>
            ) : null}

            {stepIndex === 2 ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <StepField
                  label="목표 월 순이익"
                  value={state.targetMonthlyNetProfit}
                  suffix="원"
                  onChange={(value) =>
                    dispatch({ type: "setTargetMonthlyNetProfit", value })
                  }
                />
                <StepField
                  label="목표 원재료비율"
                  value={percentFromRatio(state.targetIngredientRate)}
                  suffix="%"
                  onChange={(value) =>
                    dispatch({
                      type: "setTargetIngredientRate",
                      value: ratioFromPercentInput(value),
                    })
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
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-full bg-[#1b4797] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(27,71,151,0.24)]"
              >
                {isLastStep ? "결과 보기" : "다음"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          <aside className="bg-[linear-gradient(180deg,#1b4797_0%,#244f9f_100%)] p-6 text-white sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              Setup First
            </div>

            <h3 className="mt-6 text-xl font-semibold">먼저 기준을 맞추고, 그 다음 결과를 보겠습니다.</h3>
            <p className="mt-3 text-sm leading-7 text-white/80">
              여기서 핵심 숫자만 맞춘 뒤 넘어가면, 다음 화면에서는 권장가와 손익만 집중해서 볼 수 있습니다.
            </p>

            <div className="mt-8 rounded-[28px] border border-white/15 bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                이번 단계에서 끝내는 것
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                {currentStep.helperItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/15 bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                결과 화면 흐름
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                <li>먼저 봐야 할 숫자 요약</li>
                <li>메뉴별 권장가 요약 리스트</li>
                <li>선택한 메뉴 상세 설정</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
