"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CircleHelp,
  PanelLeftClose,
  Sparkles,
} from "lucide-react";

import {
  CATEGORY_META,
  FIXED_COST_FIELDS,
  LABOR_FIELDS,
  LOSS_FIELDS,
  SALES_FIELDS,
  VARIABLE_COST_FIELDS,
} from "@/lib/constants";
import { cn, percentFromRatio, ratioFromPercentInput } from "@/lib/utils";
import type { AppAction } from "@/lib/app-state";
import type { AppState, CategoryKey, FieldDefinition, PriceCatalogItem } from "@/lib/types";

interface InputTrayProps {
  state: AppState;
  store: AppState["store"];
  dispatch: React.Dispatch<AppAction>;
  onClose: () => void;
}

type SettingsView = "basics" | "menuCosts" | "operations";

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

function HelpTooltip({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="도움말 보기"
        aria-expanded={open}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#eef3ff] text-[#1b4797] transition hover:bg-[#dde8ff]"
      >
        <CircleHelp className="h-3 w-3" />
      </button>
      {open ? (
        <div className="absolute left-0 top-6 z-20 w-56 rounded-2xl border border-[#d9e3f6] bg-white p-3 text-[11px] leading-5 text-[#516281] shadow-[0_16px_30px_rgba(27,71,151,0.12)]">
          {content}
        </div>
      ) : null}
    </div>
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
  label?: string;
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
      {label ? (
        <div className="mb-1.5 flex items-center gap-1 text-xs font-medium text-[#5c6f90]">
          <span>{label}</span>
          {description ? <HelpTooltip content={description} /> : null}
        </div>
      ) : null}
      <div className="flex items-center rounded-2xl border border-[#d9e3f6] bg-white px-3">
        <input
          type="number"
          value={Number.isFinite(displayValue) ? displayValue : 0}
          onChange={(event) => {
            const numeric = Number(event.target.value);
            onChange(kind === "percent" ? ratioFromPercentInput(numeric) : numeric);
          }}
          className="h-10 w-full bg-transparent text-sm text-[#13233f] outline-none"
        />
        <span className="text-xs text-[#7183a3]">{suffix}</span>
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
  category: AppState["store"]["categories"][CategoryKey];
  titleExtra?: React.ReactNode;
  onToggle: (next: boolean) => void;
  onCollapse: () => void;
  onBundleToggle?: (next: boolean) => void;
  onAdvancedToggle?: (next: boolean) => void;
  children: React.ReactNode;
}) {
  const meta = CATEGORY_META[categoryKey];

  return (
    <section className="rounded-[28px] border border-[#d9e3f6] bg-white p-4 shadow-[0_14px_34px_rgba(27,71,151,0.06)]">
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
            <FieldInput
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

export function InputTray({ state, store, dispatch, onClose }: InputTrayProps) {
  const [settingsView, setSettingsView] = useState<SettingsView>("basics");
  const storeCategory = store.categories;

  return (
    <section className="space-y-4">
      <div className="rounded-[30px] border border-[#d9e3f6] bg-white p-5 shadow-[0_18px_44px_rgba(27,71,151,0.08)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6c7fa5]">
              Detail Settings
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#13233f]">필요할 때만 여는 상세 설정</h2>
            <p className="mt-1 text-sm text-[#61728f]">
              초보자는 핵심값만 보고, 세부 단가나 운영비는 필요한 순간에만 펼쳐서 수정할 수
              있게 3묶음으로 정리했습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hidden xl:inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-3 py-2 text-xs font-semibold text-[#1b4797]"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
            상세 설정 닫기
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setSettingsView("basics")}
            className={cn(
              "rounded-2xl border px-3 py-3 text-left transition",
              settingsView === "basics"
                ? "border-[#1b4797] bg-[#f4f8ff]"
                : "border-[#d9e3f6] bg-white hover:border-[#a9bfe8]",
            )}
          >
            <p className="text-sm font-semibold text-[#13233f]">기본 입력</p>
            <p className="mt-1 text-xs text-[#61728f]">A. 매출 기준</p>
          </button>
          <button
            type="button"
            onClick={() => setSettingsView("menuCosts")}
            className={cn(
              "rounded-2xl border px-3 py-3 text-left transition",
              settingsView === "menuCosts"
                ? "border-[#1b4797] bg-[#f4f8ff]"
                : "border-[#d9e3f6] bg-white hover:border-[#a9bfe8]",
            )}
          >
            <p className="text-sm font-semibold text-[#13233f]">메뉴·원가</p>
            <p className="mt-1 text-xs text-[#61728f]">B. 메뉴 스펙 + C~D 단가</p>
          </button>
          <button
            type="button"
            onClick={() => setSettingsView("operations")}
            className={cn(
              "rounded-2xl border px-3 py-3 text-left transition",
              settingsView === "operations"
                ? "border-[#1b4797] bg-[#f4f8ff]"
                : "border-[#d9e3f6] bg-white hover:border-[#a9bfe8]",
            )}
          >
            <p className="text-sm font-semibold text-[#13233f]">운영비</p>
            <p className="mt-1 text-xs text-[#61728f]">E. 변동비 + F~H 비용</p>
          </button>
        </div>
      </div>

      {settingsView === "basics" ? (
        <SectionCard
          categoryKey="sales"
          category={storeCategory.sales}
          onToggle={(next) =>
            dispatch({
              type: "updateCategory",
              categoryKey: "sales",
              patch: { enabled: next },
            })
          }
          onCollapse={() =>
            dispatch({
              type: "updateCategory",
              categoryKey: "sales",
              patch: { collapsed: !storeCategory.sales.collapsed },
            })
          }
        >
          <FieldsGroup
            fields={SALES_FIELDS}
            values={store.sales}
            update={(field, value) =>
              dispatch({
                type: "updateStoreField",
                section: "sales",
                field,
                value,
              })
            }
            showAdvanced
          />
        </SectionCard>
      ) : null}

      {settingsView === "menuCosts" ? (
        <>
          <SectionCard
            categoryKey="menuSpec"
            category={storeCategory.menuSpec}
            onToggle={(next) =>
              dispatch({
                type: "updateCategory",
                categoryKey: "menuSpec",
                patch: { enabled: next },
              })
            }
            onCollapse={() =>
              dispatch({
                type: "updateCategory",
                categoryKey: "menuSpec",
                patch: { collapsed: !storeCategory.menuSpec.collapsed },
              })
            }
            titleExtra={
              <div className="rounded-2xl bg-[#f8fbff] px-3 py-3 text-sm text-[#586a8a]">
                메뉴별 판매 비중과 HOT/ICE 가격은 위의 메뉴 카드에서 바로 조정할 수 있습니다.
              </div>
            }
          >
            <div className="rounded-2xl border border-dashed border-[#cfdcf5] px-3 py-3 text-sm text-[#5c6f90]">
              메뉴 판매 비중 합계 {store.menus.reduce((sum, menu) => sum + menu.share, 0).toFixed(1)}%
            </div>
          </SectionCard>

          <SectionCard
            categoryKey="ingredients"
            category={storeCategory.ingredients}
            onToggle={(next) =>
              dispatch({
                type: "updateCategory",
                categoryKey: "ingredients",
                patch: { enabled: next },
              })
            }
            onCollapse={() =>
              dispatch({
                type: "updateCategory",
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
                    categoryKey: "ingredients",
                    patch: { showAdvanced: !storeCategory.ingredients.showAdvanced },
                  })
                }
                className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-3 py-2 text-xs font-semibold text-[#1b4797]"
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
                categoryKey: "packaging",
                patch: { enabled: next },
              })
            }
            onCollapse={() =>
              dispatch({
                type: "updateCategory",
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
                    categoryKey: "packaging",
                    patch: { showAdvanced: !storeCategory.packaging.showAdvanced },
                  })
                }
                className="inline-flex items-center gap-2 rounded-full bg-[#eef3ff] px-3 py-2 text-xs font-semibold text-[#1b4797]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                고급 포장재 {storeCategory.packaging.showAdvanced ? "숨기기" : "보기"}
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
        </>
      ) : null}

      {settingsView === "operations" ? (
        <>
          <SectionCard
            categoryKey="variableCosts"
            category={storeCategory.variableCosts}
            onToggle={(next) =>
              dispatch({
                type: "updateCategory",
                categoryKey: "variableCosts",
                patch: { enabled: next },
              })
            }
            onCollapse={() =>
              dispatch({
                type: "updateCategory",
                categoryKey: "variableCosts",
                patch: { collapsed: !storeCategory.variableCosts.collapsed },
              })
            }
          >
            <FieldsGroup
              fields={VARIABLE_COST_FIELDS}
              values={store.variableCosts}
              update={(field, value) =>
                dispatch({
                  type: "updateStoreField",
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
                categoryKey: "labor",
                patch: { enabled: next },
              })
            }
            onCollapse={() =>
              dispatch({
                type: "updateCategory",
                categoryKey: "labor",
                patch: { collapsed: !storeCategory.labor.collapsed },
              })
            }
            onBundleToggle={(next) =>
              dispatch({
                type: "updateCategory",
                categoryKey: "labor",
                patch: { useBundle: next },
              })
            }
            onAdvancedToggle={(next) =>
              dispatch({
                type: "updateCategory",
                categoryKey: "labor",
                patch: { showAdvanced: next },
              })
            }
          >
            <FieldsGroup
              fields={LABOR_FIELDS}
              values={store.labor}
              update={(field, value) =>
                dispatch({
                  type: "updateStoreField",
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
                categoryKey: "fixedCosts",
                patch: { enabled: next },
              })
            }
            onCollapse={() =>
              dispatch({
                type: "updateCategory",
                categoryKey: "fixedCosts",
                patch: { collapsed: !storeCategory.fixedCosts.collapsed },
              })
            }
            onBundleToggle={(next) =>
              dispatch({
                type: "updateCategory",
                categoryKey: "fixedCosts",
                patch: { useBundle: next },
              })
            }
            onAdvancedToggle={(next) =>
              dispatch({
                type: "updateCategory",
                categoryKey: "fixedCosts",
                patch: { showAdvanced: next },
              })
            }
          >
            <FieldsGroup
              fields={FIXED_COST_FIELDS}
              values={store.fixedCosts}
              update={(field, value) =>
                dispatch({
                  type: "updateStoreField",
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
                categoryKey: "loss",
                patch: { enabled: next },
              })
            }
            onCollapse={() =>
              dispatch({
                type: "updateCategory",
                categoryKey: "loss",
                patch: { collapsed: !storeCategory.loss.collapsed },
              })
            }
            onBundleToggle={(next) =>
              dispatch({
                type: "updateCategory",
                categoryKey: "loss",
                patch: { useBundle: next },
              })
            }
            onAdvancedToggle={(next) =>
              dispatch({
                type: "updateCategory",
                categoryKey: "loss",
                patch: { showAdvanced: next },
              })
            }
          >
            <FieldsGroup
              fields={LOSS_FIELDS}
              values={store.loss}
              update={(field, value) =>
                dispatch({
                  type: "updateStoreField",
                  section: "loss",
                  field,
                  value,
                })
              }
              showAdvanced={!storeCategory.loss.useBundle && storeCategory.loss.showAdvanced}
            />
          </SectionCard>
        </>
      ) : null}
    </section>
  );
}
