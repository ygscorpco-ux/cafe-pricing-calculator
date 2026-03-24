"use client";

import Image from "next/image";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  FolderOpen,
  LayoutPanelLeft,
  PanelsTopLeft,
  RotateCcw,
  Save,
  Sparkles,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import { InputTray } from "@/components/input-tray";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { ResultsDashboard } from "@/components/results-dashboard";
import { appReducer, createInitialAppState } from "@/lib/app-state";
import { calculateAppState } from "@/lib/calculations";
import { TEMPLATES } from "@/lib/constants";
import { formatCompactCurrency } from "@/lib/format";
import {
  loadStoredScenarios,
  loadStoredState,
  saveStoredScenarios,
  saveStoredState,
} from "@/lib/storage";
import { getTemplateById } from "@/lib/seeds";
import { cn, createId, deepClone } from "@/lib/utils";
import type { SavedScenario } from "@/lib/types";

type MobilePanel = "settings" | "results";

function RailSegment({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[28px] border border-[#d9e3f6] bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">
        {label}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-3 py-2 text-xs font-semibold transition",
              value === option.value
                ? "bg-[#1b4797] text-white"
                : "bg-[#eef3ff] text-[#1b4797] hover:bg-[#dde8ff]",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CafePricingApp() {
  const [state, dispatch] = useReducer(appReducer, undefined, () => {
    if (typeof window === "undefined") {
      return createInitialAppState();
    }

    return loadStoredState() ?? createInitialAppState();
  });
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    return loadStoredScenarios();
  });
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("results");
  const [isInputTrayOpen, setIsInputTrayOpen] = useState(false);
  const [isOnboardingReopened, setIsOnboardingReopened] = useState(false);
  const inlineInputTrayRef = useRef<HTMLDivElement | null>(null);
  const skipStatePersist = useRef(true);
  const skipScenarioPersist = useRef(true);

  useEffect(() => {
    if (skipStatePersist.current) {
      skipStatePersist.current = false;
      return;
    }

    saveStoredState(state);
  }, [state]);

  useEffect(() => {
    if (skipScenarioPersist.current) {
      skipScenarioPersist.current = false;
      return;
    }

    saveStoredScenarios(savedScenarios);
  }, [savedScenarios]);

  useEffect(() => {
    if (!isInputTrayOpen || typeof window === "undefined") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inlineInputTrayRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isInputTrayOpen]);

  const result = useMemo(() => calculateAppState(state), [state]);
  const activeTemplate = getTemplateById(state.wizard.templateId);
  const showOnboarding = !state.wizard.completed || isOnboardingReopened;
  const effectiveSelectedScenarioId = savedScenarios.some(
    (scenario) => scenario.id === selectedScenarioId,
  )
    ? selectedScenarioId
    : savedScenarios[0]?.id ?? "";
  const selectedScenario = savedScenarios.find(
    (scenario) => scenario.id === effectiveSelectedScenarioId,
  );

  const handleSaveScenario = () => {
    const name = window.prompt("저장할 설정 이름을 입력해 주세요.", activeTemplate.name);
    if (!name) {
      return;
    }

    const scenario: SavedScenario = {
      id: createId("scenario"),
      name,
      createdAt: new Date().toISOString(),
      state: deepClone(state),
    };

    setSavedScenarios((current) => [scenario, ...current]);
    setSelectedScenarioId(scenario.id);
  };

  const handleLoadSelectedScenario = () => {
    if (!selectedScenario) {
      return;
    }

    dispatch({ type: "hydrate", state: deepClone(selectedScenario.state) });
  };

  const handleDeleteSelectedScenario = () => {
    if (!selectedScenario) {
      return;
    }

    const confirmed = window.confirm(`"${selectedScenario.name}" 설정을 삭제할까요?`);
    if (!confirmed) {
      return;
    }

    setSavedScenarios((current) =>
      current.filter((scenario) => scenario.id !== selectedScenario.id),
    );
  };

  return (
    <div className="min-h-screen px-4 py-4 text-[#13233f] sm:px-6 sm:py-6 xl:px-8">
      <div className="mx-auto max-w-[1660px]">
        <header className="rounded-[34px] border border-white/80 bg-white/90 px-5 py-5 shadow-[0_30px_80px_rgba(27,71,151,0.10)] backdrop-blur sm:px-6 xl:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="rounded-[28px] border border-[#dbe5f9] bg-[#f8fbff] px-4 py-3 shadow-[0_16px_34px_rgba(27,71,151,0.08)]">
                  <Image
                    src="/branding/cafe.png"
                    alt="얼만교 로고"
                    width={220}
                    height={52}
                    className="h-auto w-[170px] sm:w-[220px]"
                    priority
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6c7fa5]">
                    Cafe Pricing Workbench
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#13233f] sm:text-4xl">
                    아따 얼만교?
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#61728f] sm:text-base">
                카페 사장님이 가장 먼저 봐야 하는 답은 간단합니다. 지금 가격으로 얼마나 남는지,
                목표만큼 벌려면 얼마를 받아야 하는지. 이 화면은 그 답을 먼저 보여주고, 설정은
                필요한 만큼만 아래에서 만지게 만든 가격 설계 작업판입니다.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[26px] border border-[#d9e3f6] bg-[#f8fbff] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">
                  현재 템플릿
                </p>
                <p className="mt-2 text-sm font-semibold text-[#18376c]">{activeTemplate.name}</p>
                <p className="mt-1 text-xs leading-5 text-[#61728f]">{activeTemplate.description}</p>
              </div>
              <div className="rounded-[26px] border border-[#d9e3f6] bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">
                  지금 남는 금액
                </p>
                <p className="mt-2 text-sm font-semibold text-[#13233f]">
                  {formatCompactCurrency(result.totals.monthlyNetProfit)}
                </p>
                <p className="mt-1 text-xs text-[#61728f]">
                  목표까지 차이 {formatCompactCurrency(result.totals.targetMonthlyGap)}
                </p>
              </div>
              <div className="rounded-[26px] border border-[#d9e3f6] bg-[#1b4797] px-4 py-3 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  사용 방식
                </p>
                <p className="mt-2 text-sm font-semibold">답 먼저, 설정 나중</p>
                <p className="mt-1 text-xs leading-5 text-white/75">
                  메뉴 권장가와 순이익을 먼저 보고, 필요한 비용만 펼쳐서 손보세요.
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-4 flex gap-2 xl:hidden">
          <button
            type="button"
            onClick={() => setMobilePanel("results")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold",
              mobilePanel === "results"
                ? "bg-[#1b4797] text-white"
                : "bg-white text-[#4f6285]",
            )}
          >
            <PanelsTopLeft className="h-4 w-4" />
            결과
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel("settings")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold",
              mobilePanel === "settings"
                ? "bg-[#1b4797] text-white"
                : "bg-white text-[#4f6285]",
            )}
          >
            <LayoutPanelLeft className="h-4 w-4" />
            상세 설정
          </button>
        </div>

        <div className="mt-5 rounded-[30px] border border-[#d9e3f6] bg-white/90 p-4 shadow-[0_22px_70px_rgba(27,71,151,0.08)] sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6c7fa5]">
                Control Rail
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[#13233f]">
                자주 쓰는 설정만 위로 올렸습니다.
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#61728f]">
                시작 기준, 템플릿, 저장/불러오기, 리셋만 상단에 두고 나머지 세부 항목은 아래
                상세 설정에 접어두었습니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsOnboardingReopened(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-4 py-2.5 text-sm font-semibold text-[#1b4797]"
              >
                <Sparkles className="h-4 w-4" />
                처음 안내 다시 보기
              </button>
              <button
                type="button"
                onClick={() => setIsInputTrayOpen((current) => !current)}
                className="hidden xl:inline-flex items-center gap-2 rounded-full bg-[#1b4797] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {isInputTrayOpen ? "상세 설정 닫기" : "상세 설정 열기"}
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "resetState" })}
                className="inline-flex items-center gap-2 rounded-full bg-[#f3f6fb] px-4 py-2.5 text-sm font-semibold text-[#4f6285]"
              >
                <RotateCcw className="h-4 w-4" />
                기본값 리셋
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr_1.1fr_1.2fr]">
            <RailSegment
              label="매출 기준"
              value={state.wizard.salesBasis}
              options={[
                { value: "monthly", label: "월매출 기준" },
                { value: "annual", label: "연매출 기준" },
              ]}
              onChange={(value) =>
                dispatch({
                  type: "setSalesBasis",
                  value: value as typeof state.wizard.salesBasis,
                })
              }
            />

            <RailSegment
              label="부가세 기준"
              value={state.wizard.vatMode}
              options={[
                { value: "inclusive", label: "부가세 포함가" },
                { value: "exclusive", label: "부가세 별도가" },
              ]}
              onChange={(value) =>
                dispatch({
                  type: "setVatMode",
                  value: value as typeof state.wizard.vatMode,
                })
              }
            />

            <div className="rounded-[28px] border border-[#d9e3f6] bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">
                템플릿
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => dispatch({ type: "applyTemplate", templateId: template.id })}
                    className={cn(
                      "rounded-full px-3 py-2 text-xs font-semibold transition",
                      state.wizard.templateId === template.id
                        ? "bg-[#1b4797] text-white"
                        : "bg-[#eef3ff] text-[#1b4797] hover:bg-[#dde8ff]",
                    )}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-[#61728f]">{activeTemplate.description}</p>
            </div>

            <div className="rounded-[28px] border border-[#d9e3f6] bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">
                  저장 / 불러오기
                </p>
                <button
                  type="button"
                  onClick={handleSaveScenario}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1b4797] px-3 py-2 text-xs font-semibold text-white"
                >
                  <Save className="h-3.5 w-3.5" />
                  현재 설정 저장
                </button>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <div className="flex-1 rounded-2xl border border-[#d9e3f6] bg-[#f8fbff] px-3">
                  <select
                    value={effectiveSelectedScenarioId}
                    onChange={(event) => setSelectedScenarioId(event.target.value)}
                    className="h-10 w-full bg-transparent text-sm text-[#18376c] outline-none"
                  >
                    <option value="">저장된 설정 선택</option>
                    {savedScenarios.map((scenario) => (
                      <option key={scenario.id} value={scenario.id}>
                        {scenario.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSelectedScenario}
                    disabled={!selectedScenario}
                    className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-3 py-2 text-xs font-semibold text-[#1b4797] disabled:opacity-50"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    불러오기
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelectedScenario}
                    disabled={!selectedScenario}
                    className="inline-flex items-center gap-2 rounded-full bg-[#fff1f1] px-3 py-2 text-xs font-semibold text-[#a33f4c] disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="mt-5 space-y-5">
          <div className={cn(mobilePanel === "settings" && "hidden xl:block")}>
            <ResultsDashboard
              state={state}
              result={result}
              dispatch={dispatch}
              isInputTrayOpen={isInputTrayOpen}
              onOpenInputTray={() => setIsInputTrayOpen(true)}
              onToggleInputTray={() => setIsInputTrayOpen((current) => !current)}
              inlineInputTray={
                isInputTrayOpen ? (
                  <div ref={inlineInputTrayRef}>
                    <InputTray
                      state={state}
                      store={state.store}
                      dispatch={dispatch}
                      onClose={() => setIsInputTrayOpen(false)}
                    />
                  </div>
                ) : null
              }
            />
          </div>

          {mobilePanel === "settings" && (
            <div className="xl:hidden">
              <InputTray
                state={state}
                store={state.store}
                dispatch={dispatch}
                onClose={() => setIsInputTrayOpen(false)}
              />
            </div>
          )}
        </main>

        <footer className="mt-6 flex flex-wrap items-center gap-3 rounded-[26px] border border-white/80 bg-white/80 px-5 py-4 text-xs text-[#61728f] shadow-[0_16px_40px_rgba(27,71,151,0.06)]">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-3 py-2 font-semibold text-[#1b4797]">
            <Save className="h-3.5 w-3.5" />
            현재 상태 자동 저장 중
          </span>
          <span>원재료 기본값은 시드 데이터 기준이며, 실제 매입가에 맞게 바로 수정할 수 있습니다.</span>
          <span>AI 분석은 추후 서버 API만 연결하면 이 화면 위에 자연스럽게 얹을 수 있게 구조를 유지했습니다.</span>
        </footer>
      </div>

      {showOnboarding ? (
        <OnboardingFlow
          wizard={state.wizard}
          dispatch={dispatch}
          onClose={() => setIsOnboardingReopened(false)}
        />
      ) : null}
    </div>
  );
}
