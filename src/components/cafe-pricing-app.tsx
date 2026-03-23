"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { LayoutPanelLeft, PanelsTopLeft, Save, ShieldCheck } from "lucide-react";

import { CoveragePanel } from "@/components/coverage-panel";
import { ResultsDashboard } from "@/components/results-dashboard";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { appReducer, createInitialAppState } from "@/lib/app-state";
import { calculateAppState } from "@/lib/calculations";
import { formatCompactCurrency } from "@/lib/format";
import { loadStoredScenarios, loadStoredState, saveStoredScenarios, saveStoredState } from "@/lib/storage";
import { getTemplateById } from "@/lib/seeds";
import { createId, deepClone, cn } from "@/lib/utils";
import type { SavedScenario } from "@/lib/types";

type MobilePanel = "settings" | "results" | "coverage";

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
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("results");
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
  const selectedStore =
    state.stores.find((store) => store.id === state.selectedStoreId) ?? state.stores[0];
  const selectedStoreResult =
    result.storeResults.find((storeResult) => storeResult.storeId === selectedStore.id) ??
    result.storeResults[0];
  const activeTemplate = getTemplateById(state.wizard.templateId);

  const handleSaveScenario = () => {
    const name = window.prompt("저장할 설정 이름을 입력해주세요.", activeTemplate.name);
    if (!name) {
      return;
    }

    setSavedScenarios((current) => [
      {
        id: createId("scenario"),
        name,
        createdAt: new Date().toISOString(),
        state: deepClone(state),
      },
      ...current,
    ]);
  };

  const handleLoadScenario = (scenarioId: string) => {
    const scenario = savedScenarios.find((item) => item.id === scenarioId);
    if (!scenario) {
      return;
    }

    dispatch({ type: "hydrate", state: deepClone(scenario.state) });
  };

  const handleDeleteScenario = (scenarioId: string) => {
    setSavedScenarios((current) => current.filter((scenario) => scenario.id !== scenarioId));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,243,221,0.9),_transparent_28%),linear-gradient(180deg,#f4f0e8_0%,#eef6f3_40%,#edf2f0_100%)] px-4 py-6 text-[#16342e] sm:px-6 xl:px-8">
      <div className="mx-auto max-w-[1800px]">
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
                초보자도 몇 번의 클릭으로 월 순수익, 연 순수익, 목표 순수익 기준 권장 판매가,
                현재 가격에 반영된 비용 항목을 바로 확인할 수 있게 설계했습니다.
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
                  목표와의 차이 {formatCompactCurrency(result.totals.targetMonthlyGap)}
                </p>
              </div>
              <div className="rounded-3xl bg-[#eef5ff] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5b7790]">
                  저장 정책
                </p>
                <p className="mt-2 text-sm font-semibold text-[#173a33]">브라우저 로컬 저장</p>
                <p className="mt-1 text-xs text-[#5b7790]">
                  DB 없이 현재 설정과 시나리오를 바로 저장합니다.
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
          <button
            type="button"
            onClick={() => setMobilePanel("coverage")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold",
              mobilePanel === "coverage"
                ? "bg-[#16342e] text-white"
                : "bg-white/80 text-[#4d6963]",
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            반영 항목
          </button>
        </div>

        <main className="mt-5 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)_320px]">
          <div className={cn(mobilePanel !== "settings" && "hidden xl:block")}>
            <SettingsSidebar
              state={state}
              selectedStore={selectedStore}
              dispatch={dispatch}
              onSaveScenario={handleSaveScenario}
              onLoadScenario={handleLoadScenario}
              onDeleteScenario={handleDeleteScenario}
              savedScenarioOptions={savedScenarios.map((scenario) => ({
                id: scenario.id,
                name: scenario.name,
              }))}
            />
          </div>

          <div className={cn(mobilePanel !== "results" && "hidden xl:block")}>
            <ResultsDashboard
              state={state}
              result={result}
              selectedStore={selectedStore}
              selectedStoreResult={selectedStoreResult}
              dispatch={dispatch}
            />
          </div>

          <div className={cn(mobilePanel !== "coverage" && "hidden xl:block")}>
            <CoveragePanel result={result} selectedStoreResult={selectedStoreResult} />
          </div>
        </main>

        <footer className="mt-6 flex flex-wrap items-center gap-3 rounded-[28px] border border-white/60 bg-white/70 px-5 py-4 text-xs text-[#5f7d76] shadow-[0_14px_40px_rgba(22,52,46,0.06)] backdrop-blur">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#eef4f2] px-3 py-2 font-semibold text-[#49655f]">
            <Save className="h-3.5 w-3.5" />
            현재 상태 자동 저장 중
          </span>
          <span>단가 기본값은 쿠팡 최저가 가정 시드 데이터이며 언제든 수정 가능합니다.</span>
          <span>목표 권장가는 현재 판매 비중 가중 방식으로 계산됩니다.</span>
        </footer>
      </div>
    </div>
  );
}
