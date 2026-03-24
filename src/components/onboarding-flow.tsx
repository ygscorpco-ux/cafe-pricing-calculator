"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

import type { AppAction } from "@/lib/app-state";
import { TEMPLATES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AppState } from "@/lib/types";

interface OnboardingFlowProps {
  wizard: AppState["wizard"];
  dispatch: React.Dispatch<AppAction>;
  onClose: () => void;
}

export function OnboardingFlow({
  wizard,
  dispatch,
  onClose,
}: OnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = useMemo(
    () => [
      {
        id: "sales-basis",
        eyebrow: "STEP 1",
        title: "먼저 매출 기준을 정해볼게요.",
        description:
          "월 기준으로 생각하는지, 연 기준으로 생각하는지부터 정하면 뒤 숫자가 자연스럽게 맞춰집니다.",
        helperTitle: "왜 먼저 정하나요?",
        helperBody:
          "이 기준은 계산 방식이 아니라 입력 편의의 기준입니다. 나중에 바꿔도 손익 계산은 자동으로 다시 맞춰집니다.",
        options: [
          {
            value: "monthly",
            label: "월매출 기준",
            description: "대부분 초보 사장님이 가장 익숙하게 느끼는 방식입니다.",
          },
          {
            value: "annual",
            label: "연매출 기준",
            description: "연간 목표나 사업계획서 기준으로 잡을 때 편합니다.",
          },
        ],
        value: wizard.salesBasis,
        onSelect: (value: string) =>
          dispatch({
            type: "setSalesBasis",
            value: value as AppState["wizard"]["salesBasis"],
          }),
      },
      {
        id: "vat-mode",
        eyebrow: "STEP 2",
        title: "판매가에 부가세가 들어가 있나요?",
        description:
          "이 선택 하나로 공급가, 원가율, 목표 권장가 계산이 달라집니다. 헷갈리면 보통 카페 메뉴판 가격은 포함가로 보면 됩니다.",
        helperTitle: "쉽게 보면",
        helperBody:
          "메뉴판에 적는 가격 그대로 계산하려면 포함가, 세금 별도 기준으로 내부 계산만 따로 보고 싶다면 별도가 더 편합니다.",
        options: [
          {
            value: "inclusive",
            label: "부가세 포함가",
            description: "메뉴판 가격 그대로 입력하고 싶을 때",
          },
          {
            value: "exclusive",
            label: "부가세 별도가",
            description: "공급가 기준으로 손익을 보고 싶을 때",
          },
        ],
        value: wizard.vatMode,
        onSelect: (value: string) =>
          dispatch({
            type: "setVatMode",
            value: value as AppState["wizard"]["vatMode"],
          }),
      },
      {
        id: "template",
        eyebrow: "STEP 3",
        title: "가까운 운영 스타일을 골라주세요.",
        description:
          "처음에는 완벽하게 맞추려 하기보다, 가장 비슷한 템플릿을 골라놓고 결과를 본 뒤 조금씩 손보는 편이 훨씬 빠릅니다.",
        helperTitle: "추천 방식",
        helperBody:
          "초기값은 템플릿으로 잡고, 실제 월세·인건비·카드비중만 빠르게 바꾸면 1차 손익은 바로 볼 수 있습니다.",
        options: TEMPLATES.map((template) => ({
          value: template.id,
          label: template.name,
          description: template.description,
        })),
        value: wizard.templateId,
        onSelect: (value: string) =>
          dispatch({
            type: "applyTemplate",
            templateId: value,
          }),
      },
    ],
    [dispatch, wizard.salesBasis, wizard.templateId, wizard.vatMode],
  );

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setStepIndex((current) => current + 1);
      return;
    }

    dispatch({ type: "completeWizard" });
    onClose();
  };

  const handleSkip = () => {
    dispatch({ type: "completeWizard" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(19,35,63,0.18)] px-4 py-6 backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex min-h-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-4 rounded-[36px] border border-white/70 bg-white shadow-[0_32px_120px_rgba(27,71,151,0.18)] lg:grid-cols-[1.15fr_0.85fr]">
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

            <div className="mt-8 grid gap-3">
              {currentStep.options.map((option) => {
                const active = currentStep.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => currentStep.onSelect(option.value)}
                    className={cn(
                      "rounded-[26px] border px-5 py-4 text-left transition",
                      active
                        ? "border-[#1b4797] bg-[#eef3ff] shadow-[0_16px_30px_rgba(27,71,151,0.12)]"
                        : "border-[#d9e3f6] bg-white hover:border-[#9fb8ea] hover:bg-[#f8fbff]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[#13233f]">{option.label}</p>
                        <p className="mt-1 text-sm leading-6 text-[#62738f]">
                          {option.description}
                        </p>
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
              })}
            </div>

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
                {isLastStep ? "시작하기" : "다음"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          <aside className="rounded-b-[36px] rounded-r-[36px] bg-[linear-gradient(180deg,#1b4797_0%,#244f9f_100%)] p-6 text-white sm:p-8 lg:rounded-b-none lg:rounded-r-[36px] lg:rounded-l-none">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              빠르게 끝내는 시작 설정
            </div>

            <h3 className="mt-6 text-xl font-semibold">답은 먼저 보여드리고, 설정은 나중에 만집니다.</h3>
            <p className="mt-3 text-sm leading-7 text-white/80">
              설정을 다 채우고 내려가는 방식이 아니라, 시작값만 고른 뒤 바로 결과 화면으로
              들어가게 바꿨습니다. 이후에는 메뉴별 권장가와 월 순이익을 보면서 필요한 항목만
              펼쳐서 손보면 됩니다.
            </p>

            <div className="mt-8 rounded-[28px] border border-white/15 bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                이번 단계에서 정하는 것
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                <li>매출 입력 기준</li>
                <li>부가세 포함 여부</li>
                <li>가까운 템플릿</li>
              </ul>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/15 bg-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                다음 화면에서 바로 보이는 것
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                <li>월 순이익, 연 순이익, 목표까지 차이</li>
                <li>메뉴별 현재가와 30% 기준 권장가</li>
                <li>원가율이 높은 메뉴와 가장 큰 비용 요인</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
