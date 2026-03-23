import { clsx, type ClassValue } from "clsx";

export function cn(...values: ClassValue[]) {
  return clsx(values);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ratioFromPercentInput(value: number) {
  return clamp(value, 0, 100) / 100;
}

export function percentFromRatio(value: number) {
  return Math.round(clamp(value, 0, 1) * 1000) / 10;
}

export function roundToUnit(value: number, unit = 10) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value / unit) * unit;
}

export function createId(prefix: string) {
  const token =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}-${token}`;
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
