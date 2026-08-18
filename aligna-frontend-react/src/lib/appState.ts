export type MealItem = {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  prepMinutes: number;
  type: "food" | "drink";
};

export type ProgressSnapshot = {
  workouts7d: number;
  streak: number;
  kcalToday: number;
  kcalTarget: number;
  recovery: number;
};

const STORAGE_KEY = "aligna_state";

export function readLegacyState<T = unknown>(): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export function writeLegacyState(value: unknown) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
