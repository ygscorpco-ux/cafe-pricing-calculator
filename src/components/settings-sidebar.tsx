"use client";

import {
  ChevronDown,
  ChevronUp,
  Copy,
  Plus,
  RotateCcw,
  Sparkles,
  Store,
  Trash2,
} from "lucide-react";

import {
  CATEGORY_META,
  FIXED_COST_FIELDS,
  LABOR_FIELDS,
  LOSS_FIELDS,
  SALES_FIELDS,
  TEMPLATES,
  VARIABLE_COST_FIELDS,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { cn, percentFromRatio, ratioFromPercentInput } from "@/lib/utils";
import type { AppAction } from "@/lib/app-state";
import type { AppState, CategoryKey, FieldDefinition, PriceCatalogItem } from "@/lib/types";

interface SettingsSidebarProps {
  state: AppState;
  selectedStore: AppState["stores"][number];
  dispatch: React.Dispatch<AppAction>;
  onSaveScenario: () => void;
  onLoadScenario: (scenarioId: string) => void;
  onDeleteScenario: (scenarioId: string) => void;
  savedScenarioOptions: Array<{ id: string; name: string }>;
}

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
          ? "bg-[#16342e] text-white"
          : "bg-[#eef4f2] text-[#4e6c66] hover:bg-[#e0ebe7]",
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
        checked ? "bg-[#16342e]" : "bg-[#d1dad6]",
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

  return (
    <label className="block">
      <div className="mb-1.5 flex items-center gap-1 text-xs font-medium text-[#5d7a74]">
        <span>{label}</span>
        {description ? (
          <span
            title={description}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#eaf1ef] text-[10px] text-[#55736d]"
          >
            ?
          </span>
        ) : null}
      </div>
      <div className="flex items-center rounded-2xl border border-[#d5ddda] bg-white px-3">
        <input
          type="number"
          value={Number.isFinite(displayValue) ? displayValue : 0}
          onChange={(event) => {
            const numeric = Number(event.target.value);
            onChange(kind === "percent" ? ratioFromPercentInput(numeric) : numeric);
          }}
          className="h-10 w-full bg-transparent text-sm text-[#183a33] outline-none"
        />
        <span className="text-xs text-[#6b8781]">
          {kind === "currency" ? "원" : unitLabel ?? (kind === "percent" ? "%" : "")}
        </span>
      </div>
    </label>
  );
}

function SectionCard({
  categoryKey,
  category,
  titleExtra,
  onToggle,
  onCollapse,
  onBundleToggle,
  onAdvancedToggle,
  children,
}: {
  categoryKey: CategoryKey;
  category: AppState["stores"][number]["categories"][CategoryKey];
  titleExtra?: React.ReactNode;
  onToggle: (next: boolean) => void;
  onCollapse: () => void;
  onBundleToggle?: (next: boolean) => void;
  onAdvancedToggle?: (next: boolean) => void;
  children: React.ReactNode;
}) {
  const meta = CATEGORY_META[categoryKey];

  return (
    <section className="rounded-[28px] border border-[#d5ddda] bg-white/95 p-4 shadow-[0_12px_36px_rgba(22,52,46,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#16342e]">{meta.label}</p>
          <p className="mt-1 text-xs leading-5 text-[#607d76]">{meta.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleSwitch checked={category.enabled} disabled={meta.locked} onChange={onToggle} />
          <button
            type="button"
            onClick={onCollapse}
            className="rounded-full bg-[#eff5f2] p-2 text-[#56746e]"
          >
            {category.collapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {titleExtra ? <div className="mt-3">{titleExtra}</div> : null}

      {!category.collapsed ? (
        <>
          {meta.allowBundle ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <SegmentButton active={category.useBundle} onClick={() => onBundleToggle?.(true)}>
                묶음 입력
              </SegmentButton>
              <SegmentButton active={!category.useBundle} onClick={() => onBundleToggle?.(false)}>
                세부 입력
              </SegmentButton>
              <SegmentButton
                active={category.showAdvanced}
                onClick={() => onAdvancedToggle?.(!category.showAdvanced)}
              >
                고급 설정 {category.showAdvanced ? "숨기기" : "보기"}
              </SegmentButton>
            </div>
          ) : null}
          <div className="mt-4">{children}</div>
        </>
      ) : null}
    </section>
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
            className="grid grid-cols-[1fr_110px] items-center gap-3 rounded-2xl border border-[#dce4e0] bg-[#f8fbfa] px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(event) => onToggle(item.id, event.target.checked)}
              />
              <div>
                <p className="text-sm font-medium text-[#1d3d36]">{item.label}</p>
                <p className="text-[11px] text-[#6b8781]">{item.unit}당 기준 단가</p>
              </div>
            </div>
            <FieldInput
              label=""
              value={item.pricePerUnit}
              kind="currency"
              unitLabel={item.unit}
              onChange={(value) => onPriceChange(item.id, value)}
            />
          </div>
        ))}
    </div>
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

export function SettingsSidebar({
  state,
  selectedStore,
  dispatch,
  onSaveScenario,
  onLoadScenario,
  onDeleteScenario,
  savedScenarioOptions,
}: SettingsSidebarProps) {
  const storeCategory = selectedStore.categories;

  return (
    <section className="space-y-4 xl:sticky xl:top-6">
      <div className="rounded-[30px] border border-[#d5ddda] bg-white/95 p-5 shadow-[0_18px_60px_rgba(22,52,46,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5f7f78]">
              Quick Start
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#16342e]">
              3분 안에 결과 보기
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: "completeWizard" })}
            className="rounded-full bg-[#16342e] px-3 py-2 text-xs font-semibold text-white"
          >
            {state.wizard.completed ? "설정 완료" : "빠른 시작 완료"}
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#67847e]">
              매출 기준
            </p>
            <div className="flex flex-wrap gap-2">
              <SegmentButton
                active={state.wizard.salesBasis === "monthly"}
                onClick={() => dispatch({ type: "setSalesBasis", value: "monthly" })}
              >
                월매출 기준
              </SegmentButton>
              <SegmentButton
                active={state.wizard.salesBasis === "annual"}
                onClick={() => dispatch({ type: "setSalesBasis", value: "annual" })}
              >
                연매출 기준
              </SegmentButton>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#67847e]">
              매장 수
            </p>
            <div className="flex flex-wrap gap-2">
              <SegmentButton
                active={state.wizard.storeMode === "single"}
                onClick={() => dispatch({ type: "setStoreMode", value: "single" })}
              >
                단일매장
              </SegmentButton>
              <SegmentButton
                active={state.wizard.storeMode === "multi"}
                onClick={() => dispatch({ type: "setStoreMode", value: "multi" })}
              >
                복수매장
              </SegmentButton>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#67847e]">
              부가세 기준
            </p>
            <div className="flex flex-wrap gap-2">
              <SegmentButton
                active={state.wizard.vatMode === "inclusive"}
                onClick={() => dispatch({ type: "setVatMode", value: "inclusive" })}
              >
                포함가
              </SegmentButton>
              <SegmentButton
                active={state.wizard.vatMode === "exclusive"}
                onClick={() => dispatch({ type: "setVatMode", value: "exclusive" })}
              >
                별도가
              </SegmentButton>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#67847e]">
              기본 템플릿
            </p>
            <div className="grid gap-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => dispatch({ type: "applyTemplate", templateId: template.id })}
                  className={cn(
                    "rounded-2xl border px-3 py-3 text-left transition",
                    state.wizard.templateId === template.id
                      ? "border-[#173a33] bg-[#f4faf7]"
                      : "border-[#d6dfdb] bg-[#fbfdfc] hover:border-[#b8c7c2]",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#173a33]">{template.name}</span>
                    <span className="rounded-full bg-[#eef5f2] px-2 py-1 text-[11px] font-semibold text-[#4f6b66]">
                      {template.tone}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#64807a]">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#d5ddda] bg-white/95 p-4 shadow-[0_12px_36px_rgba(22,52,46,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#173a33]">
            <Store className="h-4 w-4" />
            매장 선택
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: "duplicateStore", storeId: selectedStore.id })}
              className="rounded-full bg-[#eef4f2] p-2 text-[#4f6a64]"
              title="선택 매장 복제"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "addStore" })}
              className="rounded-full bg-[#eef4f2] p-2 text-[#4f6a64]"
              title="매장 추가"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {state.stores.map((store) => (
            <button
              key={store.id}
              type="button"
              onClick={() => dispatch({ type: "selectStore", storeId: store.id })}
              className={cn(
                "rounded-full px-3 py-2 text-xs font-semibold transition",
                state.selectedStoreId === store.id
                  ? "bg-[#173a33] text-white"
                  : "bg-[#eef4f2] text-[#4f6c66]",
              )}
            >
              {store.name}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {state.stores.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => dispatch({ type: "applyStoreToAll", storeId: selectedStore.id })}
                className="rounded-full bg-[#fff2db] px-3 py-2 text-xs font-semibold text-[#815715]"
              >
                현재 매장 설정 전체 적용
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "removeStore", storeId: selectedStore.id })}
                className="rounded-full bg-[#ffe8e4] px-3 py-2 text-xs font-semibold text-[#a24336]"
              >
                <span className="inline-flex items-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" />
                  선택 매장 삭제
                </span>
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="rounded-[28px] border border-[#d5ddda] bg-white/95 p-4 shadow-[0_12px_36px_rgba(22,52,46,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#173a33]">현재 설정 저장</p>
            <p className="mt-1 text-xs text-[#66827c]">
              템플릿에서 조금씩 바꿔가며 비교할 수 있게 저장합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onSaveScenario}
            className="rounded-full bg-[#16342e] px-3 py-2 text-xs font-semibold text-white"
          >
            저장
          </button>
        </div>

        {savedScenarioOptions.length > 0 ? (
          <div className="mt-3 space-y-2">
            {savedScenarioOptions.map((scenario) => (
              <div
                key={scenario.id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-[#dae2df] bg-[#f8fbfa] px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => onLoadScenario(scenario.id)}
                  className="text-left text-sm font-medium text-[#173a33]"
                >
                  {scenario.name}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteScenario(scenario.id)}
                  className="rounded-full bg-[#ffe8e4] p-2 text-[#a24336]"
                  title="시나리오 삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-[#6a8780]">아직 저장된 설정이 없습니다.</p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: "resetState" })}
            className="inline-flex items-center gap-2 rounded-full bg-[#eef4f2] px-3 py-2 text-xs font-semibold text-[#4f6b66]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            기본값 리셋
          </button>
        </div>
      </div>

      <SectionCard
        categoryKey="sales"
        category={storeCategory.sales}
        onToggle={(next) =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "sales",
            patch: { enabled: next },
          })
        }
        onCollapse={() =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "sales",
            patch: { collapsed: !storeCategory.sales.collapsed },
          })
        }
      >
        <FieldsGroup
          fields={SALES_FIELDS}
          values={selectedStore.sales}
          update={(field, value) =>
            dispatch({
              type: "updateStoreField",
              storeId: selectedStore.id,
              section: "sales",
              field,
              value,
            })
          }
          showAdvanced
        />
      </SectionCard>

      <SectionCard
        categoryKey="menuSpec"
        category={storeCategory.menuSpec}
        onToggle={(next) =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "menuSpec",
            patch: { enabled: next },
          })
        }
        onCollapse={() =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "menuSpec",
            patch: { collapsed: !storeCategory.menuSpec.collapsed },
          })
        }
        titleExtra={
          <div className="rounded-2xl bg-[#f6faf8] px-3 py-3 text-sm text-[#56726c]">
            메뉴별 컵 용량, 샷 수, 재료량, HOT/ICE 가격은 중앙의 메뉴 표에서 바로 수정합니다.
          </div>
        }
      >
        <div className="rounded-2xl border border-dashed border-[#cad5d1] px-3 py-3 text-sm text-[#607d76]">
          판매 비중 합계 {selectedStore.menus.reduce((sum, menu) => sum + menu.share, 0).toFixed(1)}%
        </div>
      </SectionCard>

      <SectionCard
        categoryKey="ingredients"
        category={storeCategory.ingredients}
        onToggle={(next) =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "ingredients",
            patch: { enabled: next },
          })
        }
        onCollapse={() =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "ingredients",
            patch: { collapsed: !storeCategory.ingredients.collapsed },
          })
        }
        titleExtra={
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: "updateCategory",
                storeId: selectedStore.id,
                categoryKey: "ingredients",
                patch: { showAdvanced: !storeCategory.ingredients.showAdvanced },
              })
            }
            className="inline-flex items-center gap-2 rounded-full bg-[#eef4f2] px-3 py-2 text-xs font-semibold text-[#4f6b66]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            고급 재료 {storeCategory.ingredients.showAdvanced ? "숨기기" : "보기"}
          </button>
        }
      >
        <PriceCatalogEditor
          items={state.priceCatalog.ingredients}
          showAdvanced={storeCategory.ingredients.showAdvanced}
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
        category={storeCategory.packaging}
        onToggle={(next) =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "packaging",
            patch: { enabled: next },
          })
        }
        onCollapse={() =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "packaging",
            patch: { collapsed: !storeCategory.packaging.collapsed },
          })
        }
        titleExtra={
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: "updateCategory",
                storeId: selectedStore.id,
                categoryKey: "packaging",
                patch: { showAdvanced: !storeCategory.packaging.showAdvanced },
              })
            }
            className="inline-flex items-center gap-2 rounded-full bg-[#eef4f2] px-3 py-2 text-xs font-semibold text-[#4f6b66]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            고급 포장 {storeCategory.packaging.showAdvanced ? "숨기기" : "보기"}
          </button>
        }
      >
        <PriceCatalogEditor
          items={state.priceCatalog.packaging}
          showAdvanced={storeCategory.packaging.showAdvanced}
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

      <SectionCard
        categoryKey="variableCosts"
        category={storeCategory.variableCosts}
        onToggle={(next) =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "variableCosts",
            patch: { enabled: next },
          })
        }
        onCollapse={() =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "variableCosts",
            patch: { collapsed: !storeCategory.variableCosts.collapsed },
          })
        }
      >
        <FieldsGroup
          fields={VARIABLE_COST_FIELDS}
          values={selectedStore.variableCosts}
          update={(field, value) =>
            dispatch({
              type: "updateStoreField",
              storeId: selectedStore.id,
              section: "variableCosts",
              field,
              value,
            })
          }
          showAdvanced
        />
      </SectionCard>

      <SectionCard
        categoryKey="labor"
        category={storeCategory.labor}
        onToggle={(next) =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "labor",
            patch: { enabled: next },
          })
        }
        onCollapse={() =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "labor",
            patch: { collapsed: !storeCategory.labor.collapsed },
          })
        }
        onBundleToggle={(next) =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "labor",
            patch: { useBundle: next },
          })
        }
        onAdvancedToggle={(next) =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "labor",
            patch: { showAdvanced: next },
          })
        }
      >
        <FieldsGroup
          fields={LABOR_FIELDS}
          values={selectedStore.labor}
          update={(field, value) =>
            dispatch({
              type: "updateStoreField",
              storeId: selectedStore.id,
              section: "labor",
              field,
              value,
            })
          }
          showAdvanced={!storeCategory.labor.useBundle && storeCategory.labor.showAdvanced}
        />
      </SectionCard>

      <SectionCard
        categoryKey="fixedCosts"
        category={storeCategory.fixedCosts}
        onToggle={(next) =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "fixedCosts",
            patch: { enabled: next },
          })
        }
        onCollapse={() =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "fixedCosts",
            patch: { collapsed: !storeCategory.fixedCosts.collapsed },
          })
        }
        onBundleToggle={(next) =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "fixedCosts",
            patch: { useBundle: next },
          })
        }
        onAdvancedToggle={(next) =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "fixedCosts",
            patch: { showAdvanced: next },
          })
        }
      >
        <FieldsGroup
          fields={FIXED_COST_FIELDS}
          values={selectedStore.fixedCosts}
          update={(field, value) =>
            dispatch({
              type: "updateStoreField",
              storeId: selectedStore.id,
              section: "fixedCosts",
              field,
              value,
            })
          }
          showAdvanced={!storeCategory.fixedCosts.useBundle && storeCategory.fixedCosts.showAdvanced}
        />
      </SectionCard>

      <SectionCard
        categoryKey="loss"
        category={storeCategory.loss}
        onToggle={(next) =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "loss",
            patch: { enabled: next },
          })
        }
        onCollapse={() =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "loss",
            patch: { collapsed: !storeCategory.loss.collapsed },
          })
        }
        onBundleToggle={(next) =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "loss",
            patch: { useBundle: next },
          })
        }
        onAdvancedToggle={(next) =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "loss",
            patch: { showAdvanced: next },
          })
        }
      >
        <FieldsGroup
          fields={LOSS_FIELDS}
          values={selectedStore.loss}
          update={(field, value) =>
            dispatch({
              type: "updateStoreField",
              storeId: selectedStore.id,
              section: "loss",
              field,
              value,
            })
          }
          showAdvanced={!storeCategory.loss.useBundle && storeCategory.loss.showAdvanced}
        />
      </SectionCard>

      <SectionCard
        categoryKey="tax"
        category={storeCategory.tax}
        onToggle={(next) =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "tax",
            patch: { enabled: next },
          })
        }
        onCollapse={() =>
          dispatch({
            type: "updateCategory",
            storeId: selectedStore.id,
            categoryKey: "tax",
            patch: { collapsed: !storeCategory.tax.collapsed },
          })
        }
        titleExtra={
          <div className="rounded-2xl bg-[#f6faf8] px-3 py-3 text-sm text-[#56726c]">
            현재 기준은{" "}
            <span className="font-semibold text-[#173a33]">
              {state.wizard.vatMode === "inclusive" ? "부가세 포함가" : "부가세 별도가"}
            </span>
            입니다. 권장 판매가는 부가세 모드에 맞춰 자동 변환됩니다.
          </div>
        }
      >
        <div className="rounded-2xl border border-dashed border-[#cad5d1] px-3 py-3 text-sm text-[#607d76]">
          선택한 매장 현재 평균 판매가{" "}
          {formatCurrency(
            selectedStore.menus.reduce((sum, menu) => {
              const variants = Object.values(menu.variants).filter(Boolean);
              const avg =
                variants.reduce((variantSum, variant) => variantSum + (variant?.price ?? 0), 0) /
                Math.max(variants.length, 1);
              return sum + avg;
            }, 0) / Math.max(selectedStore.menus.length, 1),
          )}
        </div>
      </SectionCard>
    </section>
  );
}
