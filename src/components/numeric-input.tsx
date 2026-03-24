"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  className?: string;
  inputClassName?: string;
  valueFormatter?: (value: number) => string;
  valueParser?: (raw: string) => number;
}

function defaultFormatter(value: number) {
  return Number.isFinite(value) ? String(value) : "";
}

function defaultParser(raw: string) {
  return Number(raw);
}

export function NumericInput({
  value,
  onChange,
  suffix,
  className,
  inputClassName,
  valueFormatter = defaultFormatter,
  valueParser = defaultParser,
}: NumericInputProps) {
  const normalizedValue = valueFormatter(value);
  const [draftValue, setDraftValue] = useState(normalizedValue);
  const [isEditing, setIsEditing] = useState(false);

  const commitValue = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "-" || trimmed === "." || trimmed === "-.") {
      return;
    }

    const parsed = valueParser(trimmed);
    if (Number.isFinite(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center rounded-2xl border border-[#d9e3f6] bg-white px-3",
        className,
      )}
    >
      <input
        type="text"
        inputMode="decimal"
        value={isEditing ? draftValue : normalizedValue}
        onFocus={() => {
          setIsEditing(true);
          setDraftValue(normalizedValue);
        }}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraftValue(nextValue);
          commitValue(nextValue);
        }}
        onBlur={() => {
          setIsEditing(false);
          const trimmed = draftValue.trim();

          if (!trimmed) {
            setDraftValue(normalizedValue);
            return;
          }

          const parsed = valueParser(trimmed);

          if (!Number.isFinite(parsed)) {
            setDraftValue(normalizedValue);
            return;
          }

          onChange(parsed);
          setDraftValue(valueFormatter(parsed));
        }}
        className={cn("h-10 w-full bg-transparent text-sm text-[#13233f] outline-none", inputClassName)}
      />
      {suffix ? <span className="text-xs text-[#7183a3]">{suffix}</span> : null}
    </div>
  );
}
