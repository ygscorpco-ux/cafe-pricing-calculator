import { STORAGE_VERSION } from "@/lib/constants";
import type { AppState, SavedScenario } from "@/lib/types";

const STATE_KEY = `cafe-pricing-calculator:${STORAGE_VERSION}:state`;
const SCENARIOS_KEY = `cafe-pricing-calculator:${STORAGE_VERSION}:scenarios`;
const ONBOARDING_KEY = "cafe-pricing-calculator:onboarding";

interface WrappedState {
  version: string;
  state: AppState;
}

interface WrappedScenarios {
  version: string;
  scenarios: SavedScenario[];
}

interface WrappedOnboarding {
  version: string;
  seen: boolean;
}

export function loadStoredState() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as WrappedState;
    return parsed.version === STORAGE_VERSION ? parsed.state : null;
  } catch {
    return null;
  }
}

export function saveStoredState(state: AppState) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: WrappedState = {
    version: STORAGE_VERSION,
    state,
  };
  window.localStorage.setItem(STATE_KEY, JSON.stringify(payload));
}

export function loadStoredScenarios() {
  if (typeof window === "undefined") {
    return [] as SavedScenario[];
  }

  try {
    const raw = window.localStorage.getItem(SCENARIOS_KEY);
    if (!raw) {
      return [] as SavedScenario[];
    }

    const parsed = JSON.parse(raw) as WrappedScenarios;
    return parsed.version === STORAGE_VERSION ? parsed.scenarios : [];
  } catch {
    return [] as SavedScenario[];
  }
}

export function saveStoredScenarios(scenarios: SavedScenario[]) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: WrappedScenarios = {
    version: STORAGE_VERSION,
    scenarios,
  };
  window.localStorage.setItem(SCENARIOS_KEY, JSON.stringify(payload));
}

export function loadOnboardingSeen(version: string) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(ONBOARDING_KEY);
    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw) as WrappedOnboarding;
    return parsed.version === version && parsed.seen === true;
  } catch {
    return false;
  }
}

export function saveOnboardingSeen(version: string) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: WrappedOnboarding = {
    version,
    seen: true,
  };

  window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(payload));
}
