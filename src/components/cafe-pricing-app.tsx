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
import { loadStoredScenarios, loadStoredState, saveStoredScenarios, saveStoredState } from "@/lib/storage";
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
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialAppState);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("results");
  const [isInputTrayOpen, setIsInputTrayOpen] = useState(false);
  const [hasBooted, setHasBooted] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const inlineInputTrayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedState = loadStoredState();
    const storedScenarios = loadStoredScenarios();
    const frame = window.requestAnimationFrame(() => {
      if (storedState) {
        dispatch({ type: "hydrate", state: storedState });
      }

      setSavedScenarios(storedScenarios);
      setIsOnboardingOpen(true);
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
  const effectiveSelectedScenarioId = savedScenarios.some(
    (scenario) => scenario.id === selectedScenarioId,
  )
    ? selectedScenarioId
    : savedScenarios[0]?.id ?? "";
  const selectedScenario = savedScenarios.find(
    (scenario) => scenario.id === effectiveSelectedScenarioId,
  );

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
                Quick Controls
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[#13233f]">
                설정 변경 및 저장
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOnboardingOpen(true);
                }}
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
                onClick={() => {
                  dispatch({ type: "resetState" });
                  setIsOnboardingOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#f3f6fb] px-4 py-2.5 text-sm font-semibold text-[#4f6285]"
              >
                <RotateCcw className="h-4 w-4" />
                기본값 리셋
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr_1.45fr]">
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

      </div>

      {hasBooted && isOnboardingOpen ? (
        <OnboardingFlow
          state={state}
          dispatch={dispatch}
          onClose={() => setIsOnboardingOpen(false)}
        />
      ) : null}
    </div>
  );
}
