"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lock, PanelRightClose, Save, Sparkles, Trash2, Unlock } from "lucide-react";

import { NumericInput } from "@/components/numeric-input";
import {
  CATEGORY_META,
  FIXED_COST_FIELDS,
  LABOR_FIELDS,
  LOSS_FIELDS,
  SALES_FIELDS,
  VARIABLE_COST_FIELDS,
} from "@/lib/constants";
import { formatPercent } from "@/lib/format";
import { cn, percentFromRatio, ratioFromPercentInput } from "@/lib/utils";
import type { AppAction } from "@/lib/app-state";
import type { AppCalculationResult, AppState, CategoryKey, FieldDefinition, PriceCatalogItem, SavedScenario } from "@/lib/types";

interface InputTrayProps {
  state: AppState;
  result: AppCalculationResult;
  dispatch: React.Dispatch<AppAction>;
  onClose: () => void;
  savedScenarios: SavedScenario[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  onSaveScenario: () => void;
  onLoadScenario: () => void;
  onDeleteScenario: () => void;
}

type SettingsView = "fixed" | "variable" | "catalog" | "loss" | "pricing";

function SegmentButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-2 text-xs font-semibold transition",
        active
          ? "bg-[#1b4797] text-white"
          : "bg-[#eef3ff] text-[#1b4797] hover:bg-[#dde8ff]",
      )}
    >
      {children}
    </button>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 rounded-full transition",
        checked ? "bg-[#1b4797]" : "bg-[#d4dded]",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-white transition",
          checked ? "left-6" : "left-1",
        )}
      />
    </button>
  );
}

function FieldInput({
  label,
  description,
  value,
  kind,
  unitLabel,
  onChange,
}: {
  label: string;
  description?: string;
  value: number;
  kind: FieldDefinition<string>["kind"];
  unitLabel?: string;
  onChange: (nextValue: number) => void;
}) {
  const displayValue = kind === "percent" ? percentFromRatio(value) : value;
  const suffix = kind === "currency" ? "원" : unitLabel ?? (kind === "percent" ? "%" : "");

  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#5c6f90]">{label}</span>
        {description ? <span className="text-[11px] text-[#7c8daa]">{description}</span> : null}
      </div>
      <NumericInput
        value={displayValue}
        onChange={(nextValue) =>
          onChange(kind === "percent" ? ratioFromPercentInput(nextValue) : nextValue)
        }
        suffix={suffix}
      />
    </label>
  );
}

function SectionCard({
  categoryKey,
  category,
  onToggle,
  onCollapse,
  children,
}: {
  categoryKey: CategoryKey;
  category: AppState["store"]["categories"][CategoryKey];
  onToggle: (next: boolean) => void;
  onCollapse: () => void;
  children: React.ReactNode;
}) {
  const meta = CATEGORY_META[categoryKey];
  return (
    <section className="rounded-[26px] border border-[#d9e3f6] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#13233f]">{meta.label}</p>
          <p className="mt-1 text-xs leading-5 text-[#61728f]">{meta.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleSwitch checked={category.enabled} disabled={meta.locked} onChange={onToggle} />
          <button
            type="button"
            onClick={onCollapse}
            className="rounded-full bg-[#eef3ff] p-2 text-[#1b4797]"
          >
            {category.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {!category.collapsed ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

function FieldsGroup<T extends string>({
  fields,
  values,
  update,
  showAdvanced,
}: {
  fields: FieldDefinition<T>[];
  values: Record<T, number>;
  update: (field: T, value: number) => void;
  showAdvanced: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields
        .filter((field) => showAdvanced || !field.advanced)
        .map((field) => (
          <FieldInput
            key={field.key}
            label={field.label}
            description={field.description}
            value={values[field.key]}
            kind={field.kind}
            unitLabel={field.unitLabel}
            onChange={(value) => update(field.key, value)}
          />
        ))}
    </div>
  );
}

function PriceCatalogEditor({
  items,
  showAdvanced,
  onPriceChange,
  onToggle,
}: {
  items: PriceCatalogItem[];
  showAdvanced: boolean;
  onPriceChange: (itemId: string, value: number) => void;
  onToggle: (itemId: string, enabled: boolean) => void;
}) {
  return (
    <div className="grid gap-2">
      {items
        .filter((item) => showAdvanced || !item.advanced)
        .map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_120px] items-center gap-3 rounded-2xl border border-[#e0e8f8] bg-[#f8fbff] px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(event) => onToggle(item.id, event.target.checked)}
              />
              <div>
                <p className="text-sm font-medium text-[#13233f]">{item.label}</p>
                <p className="text-[11px] text-[#7183a3]">{item.unit} 기준 단가</p>
              </div>
            </div>
            <NumericInput value={item.pricePerUnit} onChange={(value) => onPriceChange(item.id, value)} suffix="원" />
          </div>
        ))}
    </div>
  );
}

export function InputTray({
  state,
  result,
  dispatch,
  onClose,
  savedScenarios,
  selectedScenarioId,
  onSelectScenario,
  onSaveScenario,
  onLoadScenario,
  onDeleteScenario,
}: InputTrayProps) {
  const [settingsView, setSettingsView] = useState<SettingsView>("fixed");
  const [showCatalogAdvanced, setShowCatalogAdvanced] = useState(false);
  const [showLaborAdvanced, setShowLaborAdvanced] = useState(false);
  const [showFixedAdvanced, setShowFixedAdvanced] = useState(false);
  const [showLossAdvanced, setShowLossAdvanced] = useState(false);
  const store = state.store;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-[#e0e8f8] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6c7fa5]">
              Advanced Settings
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#13233f]">고급 설정 패널</h2>
            <p className="mt-1 text-sm text-[#61728f]">
              기본 사용자는 결과만 보고, 필요할 때만 비용과 단가를 더 손봅니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-3 py-2 text-sm font-semibold text-[#1b4797]"
          >
            <PanelRightClose className="h-4 w-4" />
            닫기
          </button>
        </div>

        <div className="mt-4 rounded-[24px] border border-[#d9e3f6] bg-[#f8fbff] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c7fa5]">
              현재 설정 저장 / 불러오기
            </p>
            <button
              type="button"
              onClick={onSaveScenario}
              className="inline-flex items-center gap-2 rounded-full bg-[#1b4797] px-3 py-2 text-xs font-semibold text-white"
            >
              <Save className="h-3.5 w-3.5" />
              저장
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <div className="flex-1 rounded-2xl border border-[#d9e3f6] bg-white px-3">
              <select
                value={selectedScenarioId}
                onChange={(event) => onSelectScenario(event.target.value)}
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
            <button
              type="button"
              onClick={onLoadScenario}
              disabled={!selectedScenarioId}
              className="rounded-full bg-[#eef3ff] px-3 py-2 text-xs font-semibold text-[#1b4797] disabled:opacity-50"
            >
              불러오기
            </button>
            <button
              type="button"
              onClick={onDeleteScenario}
              disabled={!selectedScenarioId}
              className="inline-flex items-center gap-1 rounded-full bg-[#fff1f1] px-3 py-2 text-xs font-semibold text-[#a33f4c] disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              삭제
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-[#e0e8f8] px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <SegmentButton active={settingsView === "fixed"} onClick={() => setSettingsView("fixed")}>
            기본 비용
          </SegmentButton>
          <SegmentButton active={settingsView === "variable"} onClick={() => setSettingsView("variable")}>
            변동비
          </SegmentButton>
          <SegmentButton active={settingsView === "catalog"} onClick={() => setSettingsView("catalog")}>
            원재료 / 포장재
          </SegmentButton>
          <SegmentButton active={settingsView === "loss"} onClick={() => setSettingsView("loss")}>
            로스 / 폐기
          </SegmentButton>
          <SegmentButton active={settingsView === "pricing"} onClick={() => setSettingsView("pricing")}>
            고급 가격 기준
          </SegmentButton>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {settingsView === "fixed" ? (
          <>
            <SectionCard
              categoryKey="sales"
              category={store.categories.sales}
              onToggle={(next) =>
                dispatch({ type: "updateCategory", categoryKey: "sales", patch: { enabled: next } })
              }
              onCollapse={() =>
                dispatch({
                  type: "updateCategory",
                  categoryKey: "sales",
                  patch: { collapsed: !store.categories.sales.collapsed },
                })
              }
            >
              <FieldsGroup
                fields={SALES_FIELDS}
                values={store.sales}
                update={(field, value) =>
                  dispatch({ type: "updateStoreField", section: "sales", field, value })
                }
                showAdvanced
              />
            </SectionCard>

            <SectionCard
              categoryKey="labor"
              category={store.categories.labor}
              onToggle={(next) =>
                dispatch({ type: "updateCategory", categoryKey: "labor", patch: { enabled: next } })
              }
              onCollapse={() =>
                dispatch({
                  type: "updateCategory",
                  categoryKey: "labor",
                  patch: { collapsed: !store.categories.labor.collapsed },
                })
              }
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <SegmentButton
                  active={store.categories.labor.useBundle}
                  onClick={() =>
                    dispatch({ type: "updateCategory", categoryKey: "labor", patch: { useBundle: true } })
                  }
                >
                  묶음 입력
                </SegmentButton>
                <SegmentButton
                  active={!store.categories.labor.useBundle}
                  onClick={() =>
                    dispatch({ type: "updateCategory", categoryKey: "labor", patch: { useBundle: false } })
                  }
                >
                  상세 입력
                </SegmentButton>
                <SegmentButton active={showLaborAdvanced} onClick={() => setShowLaborAdvanced((current) => !current)}>
                  고급 {showLaborAdvanced ? "숨기기" : "보기"}
                </SegmentButton>
              </div>
              <FieldsGroup
                fields={LABOR_FIELDS}
                values={store.labor}
                update={(field, value) =>
                  dispatch({ type: "updateStoreField", section: "labor", field, value })
                }
                showAdvanced={!store.categories.labor.useBundle && showLaborAdvanced}
              />
            </SectionCard>

            <SectionCard
              categoryKey="fixedCosts"
              category={store.categories.fixedCosts}
              onToggle={(next) =>
                dispatch({ type: "updateCategory", categoryKey: "fixedCosts", patch: { enabled: next } })
              }
              onCollapse={() =>
                dispatch({
                  type: "updateCategory",
                  categoryKey: "fixedCosts",
                  patch: { collapsed: !store.categories.fixedCosts.collapsed },
                })
              }
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <SegmentButton
                  active={store.categories.fixedCosts.useBundle}
                  onClick={() =>
                    dispatch({
                      type: "updateCategory",
                      categoryKey: "fixedCosts",
                      patch: { useBundle: true },
                    })
                  }
                >
                  묶음 입력
                </SegmentButton>
                <SegmentButton
                  active={!store.categories.fixedCosts.useBundle}
                  onClick={() =>
                    dispatch({
                      type: "updateCategory",
                      categoryKey: "fixedCosts",
                      patch: { useBundle: false },
                    })
                  }
                >
                  상세 입력
                </SegmentButton>
                <SegmentButton active={showFixedAdvanced} onClick={() => setShowFixedAdvanced((current) => !current)}>
                  고급 {showFixedAdvanced ? "숨기기" : "보기"}
                </SegmentButton>
              </div>
              <FieldsGroup
                fields={FIXED_COST_FIELDS}
                values={store.fixedCosts}
                update={(field, value) =>
                  dispatch({ type: "updateStoreField", section: "fixedCosts", field, value })
                }
                showAdvanced={!store.categories.fixedCosts.useBundle && showFixedAdvanced}
              />
            </SectionCard>
          </>
        ) : null}

        {settingsView === "variable" ? (
          <SectionCard
            categoryKey="variableCosts"
            category={store.categories.variableCosts}
            onToggle={(next) =>
              dispatch({ type: "updateCategory", categoryKey: "variableCosts", patch: { enabled: next } })
            }
            onCollapse={() =>
              dispatch({
                type: "updateCategory",
                categoryKey: "variableCosts",
                patch: { collapsed: !store.categories.variableCosts.collapsed },
              })
            }
          >
            <FieldsGroup
              fields={VARIABLE_COST_FIELDS}
              values={store.variableCosts}
              update={(field, value) =>
                dispatch({ type: "updateStoreField", section: "variableCosts", field, value })
              }
              showAdvanced
            />
          </SectionCard>
        ) : null}

        {settingsView === "catalog" ? (
          <>
            <SectionCard
              categoryKey="ingredients"
              category={store.categories.ingredients}
              onToggle={(next) =>
                dispatch({ type: "updateCategory", categoryKey: "ingredients", patch: { enabled: next } })
              }
              onCollapse={() =>
                dispatch({
                  type: "updateCategory",
                  categoryKey: "ingredients",
                  patch: { collapsed: !store.categories.ingredients.collapsed },
                })
              }
            >
              <div className="mb-3 flex gap-2">
                <SegmentButton active={showCatalogAdvanced} onClick={() => setShowCatalogAdvanced((current) => !current)}>
                  고급 재료 {showCatalogAdvanced ? "숨기기" : "보기"}
                </SegmentButton>
              </div>
              <PriceCatalogEditor
                items={state.priceCatalog.ingredients}
                showAdvanced={showCatalogAdvanced}
                onPriceChange={(itemId, value) =>
                  dispatch({
                    type: "updateCatalogItem",
                    catalog: "ingredients",
                    itemId,
                    patch: { pricePerUnit: value },
                  })
                }
                onToggle={(itemId, enabled) =>
                  dispatch({
                    type: "updateCatalogItem",
                    catalog: "ingredients",
                    itemId,
                    patch: { enabled },
                  })
                }
              />
            </SectionCard>

            <SectionCard
              categoryKey="packaging"
              category={store.categories.packaging}
              onToggle={(next) =>
                dispatch({ type: "updateCategory", categoryKey: "packaging", patch: { enabled: next } })
              }
              onCollapse={() =>
                dispatch({
                  type: "updateCategory",
                  categoryKey: "packaging",
                  patch: { collapsed: !store.categories.packaging.collapsed },
                })
              }
            >
              <PriceCatalogEditor
                items={state.priceCatalog.packaging}
                showAdvanced={showCatalogAdvanced}
                onPriceChange={(itemId, value) =>
                  dispatch({
                    type: "updateCatalogItem",
                    catalog: "packaging",
                    itemId,
                    patch: { pricePerUnit: value },
                  })
                }
                onToggle={(itemId, enabled) =>
                  dispatch({
                    type: "updateCatalogItem",
                    catalog: "packaging",
                    itemId,
                    patch: { enabled },
                  })
                }
              />
            </SectionCard>
          </>
        ) : null}

        {settingsView === "loss" ? (
          <SectionCard
            categoryKey="loss"
            category={store.categories.loss}
            onToggle={(next) =>
              dispatch({ type: "updateCategory", categoryKey: "loss", patch: { enabled: next } })
            }
            onCollapse={() =>
              dispatch({
                type: "updateCategory",
                categoryKey: "loss",
                patch: { collapsed: !store.categories.loss.collapsed },
              })
            }
          >
            <div className="mb-3 flex flex-wrap gap-2">
              <SegmentButton
                active={store.categories.loss.useBundle}
                onClick={() =>
                  dispatch({ type: "updateCategory", categoryKey: "loss", patch: { useBundle: true } })
                }
              >
                로스율 일괄 반영
              </SegmentButton>
              <SegmentButton
                active={!store.categories.loss.useBundle}
                onClick={() =>
                  dispatch({ type: "updateCategory", categoryKey: "loss", patch: { useBundle: false } })
                }
              >
                항목별 조정
              </SegmentButton>
              <SegmentButton active={showLossAdvanced} onClick={() => setShowLossAdvanced((current) => !current)}>
                고급 {showLossAdvanced ? "숨기기" : "보기"}
              </SegmentButton>
            </div>
            <FieldsGroup
              fields={LOSS_FIELDS}
              values={store.loss}
              update={(field, value) =>
                dispatch({ type: "updateStoreField", section: "loss", field, value })
              }
              showAdvanced={!store.categories.loss.useBundle && showLossAdvanced}
            />
          </SectionCard>
        ) : null}

        {settingsView === "pricing" ? (
          <div className="space-y-4">
            <section className="rounded-[26px] border border-[#d9e3f6] bg-white p-4">
              <p className="text-sm font-semibold text-[#13233f]">고급 가격 기준</p>
              <p className="mt-1 text-xs leading-5 text-[#61728f]">
                기본은 앱 추천값을 쓰고, 필요할 때만 직접 수정합니다.
              </p>

              <div className="mt-4 grid gap-3">
                <div className="rounded-[22px] border border-[#d9e3f6] bg-[#f8fbff] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#13233f]">현재 적용 원재료율</p>
                      <p className="mt-1 text-xs text-[#61728f]">
                        결과 계산에 실제로 반영 중인 기준입니다.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#eef3ff] px-3 py-1.5 text-xs font-semibold text-[#1b4797]">
                      {state.ingredientRateMode === "manual" ? "직접 수정" : "추천 사용"}
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-[#13233f]">
                    {formatPercent(result.appliedIngredientRate)}
                  </p>
                </div>

                <div className="rounded-[22px] border border-[#d9e3f6] bg-[#f8fbff] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#13233f]">추천 원재료율</p>
                      <p className="mt-1 text-xs text-[#61728f]">
                        현재 구조와 전략 성향 기준으로 자동 추천한 값입니다.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#1b4797] px-3 py-1.5 text-xs font-semibold text-white">
                      추천
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-[#13233f]">
                    {formatPercent(result.recommendedIngredientRate)}
                  </p>
                  <p className="mt-2 text-xs text-[#61728f]">
                    권장 범위 {formatPercent(result.recommendedIngredientRateRange.min)} ~{" "}
                    {formatPercent(result.recommendedIngredientRateRange.max)}
                  </p>
                </div>

                <div className="rounded-[22px] border border-[#d9e3f6] bg-white p-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "setIngredientRateMode", value: "recommended" })}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
                        state.ingredientRateMode === "recommended"
                          ? "bg-[#1b4797] text-white"
                          : "bg-[#eef3ff] text-[#1b4797]",
                      )}
                    >
                      <Lock className="h-4 w-4" />
                      추천값 사용
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "setIngredientRateMode", value: "manual" })}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
                        state.ingredientRateMode === "manual"
                          ? "bg-[#1b4797] text-white"
                          : "bg-[#eef3ff] text-[#1b4797]",
                      )}
                    >
                      <Unlock className="h-4 w-4" />
                      직접 수정
                    </button>
                  </div>

                  <div className="mt-4">
                    <FieldInput
                      label="수동 원재료율"
                      description="직접 수정 모드일 때만 적용됩니다."
                      value={state.targetIngredientRate}
                      kind="percent"
                      onChange={(value) => dispatch({ type: "setTargetIngredientRate", value })}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[26px] border border-[#d9e3f6] bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#18376c]">
                <Sparkles className="h-4 w-4" />
                자동 계산 참고값
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-[#e6ecf7] bg-[#f8fbff] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7081a2]">
                    필요 방문객
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#13233f]">
                    {result.requiredVisitorsPerDay}명/일
                  </p>
                </div>
                <div className="rounded-[20px] border border-[#e6ecf7] bg-[#f8fbff] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7081a2]">
                    평균 조정 필요액
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#13233f]">
                    {result.averagePriceDeltaPerCup >= 0 ? "+" : ""}
                    {Math.round(result.averagePriceDeltaPerCup)}원/잔
                  </p>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
