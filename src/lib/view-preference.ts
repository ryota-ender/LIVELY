/**
 * 一覧 / カレンダーの表示切替を localStorage に覚えさせるための小さなストア。
 * useSyncExternalStore から使うことで、サーバー描画との不整合なく復元できる。
 */

export type ViewMode = "list" | "calendar";

const STORAGE_KEY = "lively:view";

const listeners = new Set<() => void>();
let cache: ViewMode | null = null;

function notify() {
  for (const listener of listeners) listener();
}

function handleStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  cache = null;
  notify();
}

export function subscribeView(onStoreChange: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorage);
  }
  listeners.add(onStoreChange);

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export function getViewSnapshot(): ViewMode {
  if (cache === null) {
    cache = window.localStorage.getItem(STORAGE_KEY) === "calendar" ? "calendar" : "list";
  }
  return cache;
}

/** サーバー描画時は常に一覧表示（ハイドレーション後に localStorage の値へ切り替わる） */
export function getViewServerSnapshot(): ViewMode {
  return "list";
}

export function setStoredView(view: ViewMode): void {
  cache = view;
  window.localStorage.setItem(STORAGE_KEY, view);
  notify();
}
