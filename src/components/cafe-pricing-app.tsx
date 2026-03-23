"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  FolderOpen,
  LayoutPanelLeft,
  PanelsTopLeft,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import { InputTray } from "@/components/input-tray";
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
import { createId, deepClone, cn } from "@/lib/utils";
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
    <div className="rounded-3xl border border-[#d8e0dc] bg-[#fbfdfc] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#68857f]">
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
                ? "bg-[#16342e] text-white"
                : "bg-[#eef4f2] text-[#4d6963] hover:bg-[#e0ebe7]",
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

  const result = useMemo(() => calculateAppState(state), [state]);
  const activeTemplate = getTemplateById(state.wizard.templateId);
  const effectiveSelectedScenarioId = savedScenarios.some(
    (scenario) => scenario.id === selectedScenarioId,
  )
    ? selectedScenarioId
    : savedScenarios[0]?.id ?? "";
  const selectedScenario = savedScenarios.find(
    (scenario) => scenario.id === effectiveSelectedScenarioId,
  );
  const shouldShowInputArea = mobilePanel === "settings" || isInputTrayOpen;

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

    const confirmed = window.confirm(`"${selectedScenario.name}" 저장본을 삭제할까요?`);
    if (!confirmed) {
      return;
    }

    setSavedScenarios((current) =>
      current.filter((scenario) => scenario.id !== selectedScenario.id),
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,243,221,0.9),_transparent_28%),linear-gradient(180deg,#f4f0e8_0%,#eef6f3_40%,#edf2f0_100%)] px-4 py-6 text-[#16342e] sm:px-6 xl:px-8">
      <div className="mx-auto max-w-[1680px]">
        <header className="rounded-[34px] border border-white/70 bg-white/80 px-6 py-5 shadow-[0_20px_70px_rgba(22,52,46,0.08)] backdrop-blur">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6a8780]">
                Cafe Pricing Calculator
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#16342e] sm:text-4xl">
                카페 메뉴 가격, 원가, 순이익을 한 화면에서 설계하는 도구
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5f7f78] sm:text-base">
                입력은 필요한 때만 열고, 결과는 메인 작업판에서 바로 비교하도록 구조를 바꿨습니다.
                메뉴별 가격과 권장가를 먼저 보고, 그 다음 월·연 순이익과 전체 순익 구조를 확인할 수
                있습니다.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-[#f6faf8] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6a8780]">
                  현재 템플릿
                </p>
                <p className="mt-2 text-sm font-semibold text-[#173a33]">{activeTemplate.name}</p>
                <p className="mt-1 text-xs text-[#6b8781]">{activeTemplate.description}</p>
              </div>
              <div className="rounded-3xl bg-[#fff9ef] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6c32]">
                  현재 월 순수익
                </p>
                <p className="mt-2 text-sm font-semibold text-[#5f430f]">
                  {formatCompactCurrency(result.totals.monthlyNetProfit)}
                </p>
                <p className="mt-1 text-xs text-[#8c6c32]">
                  목표까지 차이 {formatCompactCurrency(result.totals.targetMonthlyGap)}
                </p>
              </div>
              <div className="rounded-3xl bg-[#eef5ff] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5b7790]">
                  화면 원칙
                </p>
                <p className="mt-2 text-sm font-semibold text-[#173a33]">결과 중심 작업판</p>
                <p className="mt-1 text-xs text-[#5b7790]">
                  입력 패널은 접고, 메뉴 가격과 대시보드를 메인 화면에 고정합니다.
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-5 flex gap-2 xl:hidden">
          <button
            type="button"
            onClick={() => setMobilePanel("settings")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold",
              mobilePanel === "settings"
                ? "bg-[#16342e] text-white"
                : "bg-white/80 text-[#4d6963]",
            )}
          >
            <LayoutPanelLeft className="h-4 w-4" />
            입력
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel("results")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold",
              mobilePanel === "results"
                ? "bg-[#16342e] text-white"
                : "bg-white/80 text-[#4d6963]",
            )}
          >
            <PanelsTopLeft className="h-4 w-4" />
            결과
          </button>
        </div>

        <main className="mt-5 space-y-5">
          <div className={cn(mobilePanel !== "settings" && "hidden xl:block")}>
            <section className="rounded-[30px] border border-[#d5ddd9] bg-white/95 p-5 shadow-[0_18px_60px_rgba(22,52,46,0.08)]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b7b74]">
                    Control Rail
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[#16342e]">
                    기준만 빠르게 바꾸고, 입력은 필요할 때만 열기
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#5f7f78]">
                    Quick Start를 큰 카드에서 빼고, 핵심 컨트롤만 한 줄 레일로 압축했습니다.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInputTrayOpen((current) => !current)}
                    className="hidden xl:inline-flex items-center gap-2 rounded-full bg-[#16342e] px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {isInputTrayOpen ? "입력 접기" : "입력 열기"}
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "completeWizard" })}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition",
                      state.wizard.completed
                        ? "bg-[#eef4f2] text-[#4d6963]"
                        : "bg-[#fff1d6] text-[#7a5313]",
                    )}
                  >
                    <Save className="h-4 w-4" />
                    {state.wizard.completed ? "초기 설정 완료됨" : "빠른 시작 완료"}
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "resetState" })}
                    className="inline-flex items-center gap-2 rounded-full bg-[#eef4f2] px-4 py-2.5 text-sm font-semibold text-[#4d6963]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    기본값 리셋
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_1.2fr_1.2fr]">
                <div className="space-y-3">
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
                </div>

                <div className="rounded-3xl border border-[#d8e0dc] bg-[#fbfdfc] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#68857f]">
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
                            ? "bg-[#16342e] text-white"
                            : "bg-[#eef4f2] text-[#4d6963] hover:bg-[#e0ebe7]",
                        )}
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#64807a]">{activeTemplate.description}</p>
                </div>

                <div className="rounded-3xl border border-[#d8e0dc] bg-[#fbfdfc] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#68857f]">
                      저장 / 불러오기
                    </p>
                    <button
                      type="button"
                      onClick={handleSaveScenario}
                      className="inline-flex items-center gap-1 rounded-full bg-[#16342e] px-3 py-2 text-xs font-semibold text-white"
                    >
                      <Save className="h-3.5 w-3.5" />
                      현재 설정 저장
                    </button>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <div className="flex-1 rounded-2xl border border-[#d5ddda] bg-white px-3">
                      <select
                        value={effectiveSelectedScenarioId}
                        onChange={(event) => setSelectedScenarioId(event.target.value)}
                        className="h-10 w-full bg-transparent text-sm text-[#173a33] outline-none"
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
                        className="inline-flex items-center gap-2 rounded-full bg-[#eef4f2] px-3 py-2 text-xs font-semibold text-[#4d6963] disabled:opacity-50"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        불러오기
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteSelectedScenario}
                        disabled={!selectedScenario}
                        className="inline-flex items-center gap-2 rounded-full bg-[#fff1ec] px-3 py-2 text-xs font-semibold text-[#9b4b3b] disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        삭제
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-[#64807a]">
                    {selectedScenario
                      ? `선택됨: ${selectedScenario.name}`
                      : "아직 저장한 설정이 없습니다."}
                  </p>
                </div>
              </div>
            </section>

            {shouldShowInputArea ? (
              <div className="mt-5">
                <InputTray
                  state={state}
                  store={state.store}
                  dispatch={dispatch}
                  onClose={() => setIsInputTrayOpen(false)}
                />
              </div>
            ) : null}
          </div>

          <div className={cn(mobilePanel !== "results" && "hidden xl:block")}>
            <ResultsDashboard state={state} result={result} dispatch={dispatch} />
          </div>
        </main>

        <footer className="mt-6 flex flex-wrap items-center gap-3 rounded-[28px] border border-white/60 bg-white/70 px-5 py-4 text-xs text-[#5f7d76] shadow-[0_14px_40px_rgba(22,52,46,0.06)] backdrop-blur">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#eef4f2] px-3 py-2 font-semibold text-[#49655f]">
            <Save className="h-3.5 w-3.5" />
            현재 상태 자동 저장 중
          </span>
          <span>단가 기본값은 쿠팡 최저가 가정 시드 데이터이며, 바로 수정할 수 있습니다.</span>
          <span>목표 권장가는 현재 메뉴 판매 비중을 기준으로 계산합니다.</span>
        </footer>
      </div>
    </div>
  );
}
