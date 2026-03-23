import type { GoalStatus } from "@/lib/types";

const currencyFormatter = new Intl.NumberFormat("ko-KR");
const percentFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});
const compactCurrencyFormatter = new Intl.NumberFormat("ko-KR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number) {
  return `${currencyFormatter.format(Math.round(value))}원`;
}

export function formatCompactCurrency(value: number) {
  return `${compactCurrencyFormatter.format(Math.round(value))}원`;
}

export function formatNumber(value: number) {
  return currencyFormatter.format(Math.round(value));
}

export function formatPercent(value: number) {
  return `${percentFormatter.format(value * 100)}%`;
}

export function statusTone(status: GoalStatus) {
  switch (status) {
    case "achievable":
      return "emerald";
    case "surplus":
      return "sky";
    case "stretch":
      return "amber";
    case "hard":
      return "rose";
    default:
      return "zinc";
  }
}
