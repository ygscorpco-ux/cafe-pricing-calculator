"use client";

import Image from "next/image";
import { useEffect, useMemo, useReducer, useState } from "react";
import { RotateCcw, Settings2, Sparkles } from "lucide-react";

import { InputTray } from "@/components/input-tray";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { ResultsDashboard } from "@/components/results-dashboard";
import { appReducer, createInitialAppState } from "@/lib/app-state";
import { calculateAppState } from "@/lib/calculations";
import { loadStoredScenarios, loadStoredState, saveStoredScenarios, saveStoredState } from "@/lib/storage";
import { createId, deepClone } from "@/lib/utils";
import type { SavedScenario } from "@/lib/types";

export function CafePricingApp() {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialAppState);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [hasBooted, setHasBooted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const storedState = loadStoredState();
    const storedScenarios = loadStoredScenarios();
    const frame = window.requestAnimationFrame(() => {
      if (storedState) {
        dispatch({ type: "hydrate", state: storedState });
      }

      setSavedScenarios(storedScenarios);
      setHasBooted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hasBooted) {
      return;
    }

    saveStoredState(state);
  }, [hasBooted, state]);

  useEffect(() => {
    if (!hasBooted) {
      return;
    }

    saveStoredScenarios(savedScenarios);
  }, [hasBooted, savedScenarios]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.style.overflow = isSettingsOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSettingsOpen]);

  const result = useMemo(() => calculateAppState(state), [state]);

  const handleSaveScenario = () => {
    const name = window.prompt("저장할 설정 이름을 입력해 주세요.", "내 설정");
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
    const scenario = savedScenarios.find((item) => item.id === selectedScenarioId);
    if (!scenario) {
      return;
    }

    dispatch({ type: "hydrate", state: deepClone(scenario.state) });
    setIsSettingsOpen(false);
  };

  const handleDeleteSelectedScenario = () => {
    const scenario = savedScenarios.find((item) => item.id === selectedScenarioId);
    if (!scenario) {
      return;
    }

    const confirmed = window.confirm(`"${scenario.name}" 설정을 삭제할까요?`);
    if (!confirmed) {
      return;
    }

    setSavedScenarios((current) =>
      current.filter((item) => item.id !== scenario.id),
    );
    setSelectedScenarioId("");
  };

  if (!hasBooted) {
    return (
      <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1660px] items-center justify-center rounded-[34px] border border-white/80 bg-white/90 shadow-[0_30px_80px_rgba(27,71,151,0.10)] backdrop-blur">
          <div className="rounded-[28px] border border-[#dbe5f9] bg-[#f8fbff] px-5 py-4 shadow-[0_16px_34px_rgba(27,71,151,0.08)]">
            <Image
              src="/branding/cafe.png"
              alt="얼만교 로고"
              width={220}
              height={52}
              className="h-auto w-[180px] sm:w-[220px]"
              priority
            />
          </div>
        </div>
      </div>
    );
  }

  if (!state.wizard.completed) {
    return <OnboardingFlow state={state} dispatch={dispatch} />;
  }

  return (
    <div className="min-h-screen px-4 py-4 text-[#13233f] sm:px-6 sm:py-6 xl:px-8">
      <div className="mx-auto max-w-[1660px]">
        <header className="rounded-[34px] border border-white/80 bg-white/90 px-5 py-5 shadow-[0_30px_80px_rgba(27,71,151,0.10)] backdrop-blur sm:px-6 xl:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
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
                <p className="mt-2 text-sm leading-6 text-[#61728f]">
                  지금 가격으로 얼마 남는지 보고, 목표 순이익까지 얼마 올려야 하는지 바로 확인하는 카페 가격 설계 도구
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => dispatch({ type: "reopenWizard" })}
                className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-4 py-2.5 text-sm font-semibold text-[#1b4797]"
              >
                <Sparkles className="h-4 w-4" />
                설정 다시 하기
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#1b4797] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Settings2 className="h-4 w-4" />
                고급 설정 열기
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: "resetState" });
                  dispatch({ type: "reopenWizard" });
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#f3f6fb] px-4 py-2.5 text-sm font-semibold text-[#4f6285]"
              >
                <RotateCcw className="h-4 w-4" />
                기본값 리셋
              </button>
            </div>
          </div>
        </header>

        <main className="mt-5">
          <ResultsDashboard
            state={state}
            result={result}
            dispatch={dispatch}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </main>
      </div>

      {isSettingsOpen ? (
        <div className="fixed inset-0 z-50 bg-[rgba(19,35,63,0.28)] backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsSettingsOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[760px] overflow-hidden border-l border-[#d9e3f6] bg-white shadow-[-24px_0_60px_rgba(27,71,151,0.14)]">
            <InputTray
              state={state}
              result={result}
              dispatch={dispatch}
              onClose={() => setIsSettingsOpen(false)}
              savedScenarios={savedScenarios}
              selectedScenarioId={selectedScenarioId}
              onSelectScenario={setSelectedScenarioId}
              onSaveScenario={handleSaveScenario}
              onLoadScenario={handleLoadSelectedScenario}
              onDeleteScenario={handleDeleteSelectedScenario}
            />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
