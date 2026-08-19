/**
 * 1 秒ごとに現在時刻を配る小さなストア。
 * useSyncExternalStore から使うことで、サーバー描画とクライアントの
 * 時刻ずれ（ハイドレーションの不一致）を起こさずにカウントダウンを表示できる。
 *
 * タイマーは購読者がいる間だけ動く。
 */

const listeners = new Set<() => void>();

let current: number | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

function tick() {
  current = Date.now();
  for (const listener of listeners) listener();
}

export function subscribeNow(onStoreChange: () => void): () => void {
  if (listeners.size === 0) {
    current = Date.now();
    timer = setInterval(tick, 1000);
  }
  listeners.add(onStoreChange);

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** 直近のティックの時刻を返す（同じティックの間は同じ値なので再描画は起きない） */
export function getNowSnapshot(): number {
  if (current === null) current = Date.now();
  return current;
}

/** サーバー描画時は時刻を持たない（null の間はカウントダウンを描画しない） */
export function getNowServerSnapshot(): number | null {
  return null;
}
