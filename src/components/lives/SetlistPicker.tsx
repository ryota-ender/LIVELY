"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { getCatalogFor, type PickableSong } from "@/app/(app)/songs/actions";
import { CatalogImporter } from "@/components/songs/CatalogImporter";
import {
  parseSetlistEntries,
  serializeSetlist,
  titleKey,
  type SetlistEntry,
} from "@/lib/songs";

type Row = SetlistEntry & { id: number };

/** 候補として一度に出す曲数 */
const MAX_CANDIDATES = 60;

let rowSeq = 0;
const withId = (entry: SetlistEntry): Row => ({ ...entry, id: rowSeq++ });

/**
 * セトリを曲の選択で組み立てる。
 *
 * 候補はライブのアーティスト（メイン・共演）の全曲カタログから出す。
 * 保存形式は従来どおり 1 行 1 曲のテキストなので、登録済みのセトリも
 * そのまま読み込めるし、ランキングやコンプリートブックの集計も変わらない。
 * 未発表曲やカバーのためにカタログにない曲も 1 曲ずつ追加できる。
 */
export function SetlistPicker({
  defaultValue,
  artistNames,
}: {
  defaultValue: string | null;
  /** フォームで入力中のアーティスト（メイン・共演） */
  artistNames: string[];
}) {
  const [rows, setRows] = useState<Row[]>(() => parseSetlistEntries(defaultValue).map(withId));

  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState<PickableSong[] | null>(null);
  /** いまの候補を読み込んだときのアーティスト */
  const [loadedNames, setLoadedNames] = useState<string[] | null>(null);
  const [query, setQuery] = useState("");
  const [artistFilter, setArtistFilter] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();

  const names = useMemo(() => [...new Set(artistNames)], [artistNames]);
  const namesKey = names.join("\u0000");
  const stale = loadedNames !== null && loadedNames.join("\u0000") !== namesKey;

  const load = (target: string[]) => {
    startTransition(async () => {
      const result = await getCatalogFor(target);
      if (result.ok) {
        setCatalog(result.songs);
        setLoadedNames(target);
        setError(null);
      } else {
        setError(result.message);
      }
    });
  };

  // 編集で既存のセトリがあるときは、どの曲がカタログにあるか分かるよう最初に読み込む
  const initialLoad = useRef(rows.length > 0 && names.length > 0);
  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      load(names);
    }
    // 最初の 1 回だけ実行する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPanel = () => {
    setOpen(true);
    // アーティストを書き換えていたら候補を読み直す
    if (loadedNames === null || stale) load(names);
  };

  const catalogKeys = useMemo(() => new Set((catalog ?? []).map((s) => s.title_key)), [catalog]);
  const addedCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      if (row.type !== "song") continue;
      const key = titleKey(row.title);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [rows]);

  const catalogArtists = useMemo(
    () => [...new Set((catalog ?? []).map((s) => s.artist_name))],
    [catalog],
  );

  const missingArtists = useMemo(
    () => (loadedNames ?? []).filter((name) => !catalogArtists.includes(name)),
    [loadedNames, catalogArtists],
  );

  const candidates = useMemo(() => {
    const q = titleKey(query);
    return (catalog ?? [])
      .filter((s) => (artistFilter ? s.artist_name === artistFilter : true))
      .filter((s) => (q ? s.title_key.includes(q) : true))
      .slice(0, MAX_CANDIDATES);
  }, [catalog, query, artistFilter]);

  const addSong = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setRows((prev) => [...prev, withId({ type: "song", title: trimmed })]);
  };

  const addEncore = () => {
    setRows((prev) =>
      prev.length === 0 || prev.at(-1)?.type === "encore"
        ? prev
        : [...prev, withId({ type: "encore" })],
    );
  };

  const move = (index: number, delta: -1 | 1) => {
    setRows((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeAt = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

  // 表示用の曲番号（アンコールの区切りは数えない）
  const songNumbers = useMemo(() => {
    let n = 0;
    return rows.map((row) => (row.type === "song" ? ++n : 0));
  }, [rows]);

  return (
    <div>
      <span className="field-label">
        セットリスト <span className="font-normal text-faint">（開催後に追加でも OK）</span>
      </span>
      <input type="hidden" name="setlist" value={serializeSetlist(rows)} />

      {rows.length > 0 ? (
        <ol className="mb-2 divide-y divide-line-soft rounded-xl border border-line bg-ink/40">
          {rows.map((row, index) => {
            const isSong = row.type === "song";
            const outsideCatalog =
              isSong && catalog !== null && !catalogKeys.has(titleKey(row.title));

            return (
              <li key={row.id} className="flex items-center gap-2 px-3 py-2">
                {isSong ? (
                  <>
                    <span className="w-5 shrink-0 text-right text-xs font-black text-faint">
                      {songNumbers[index]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">{row.title}</span>
                      {outsideCatalog ? (
                        <span className="text-[0.6rem] text-faint">カタログにない曲</span>
                      ) : null}
                    </span>
                  </>
                ) : (
                  <span className="flex-1 text-center text-[0.7rem] font-bold tracking-widest text-neon-pink">
                    アンコール
                  </span>
                )}

                <span className="flex shrink-0">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={isSong ? `${row.title}を上へ` : "アンコールの区切りを上へ"}
                    className="rounded-md px-2 py-1.5 text-[0.7rem] text-faint transition hover:bg-white/10 hover:text-text disabled:opacity-30"
                  >
                    上
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === rows.length - 1}
                    aria-label={isSong ? `${row.title}を下へ` : "アンコールの区切りを下へ"}
                    className="rounded-md px-2 py-1.5 text-[0.7rem] text-faint transition hover:bg-white/10 hover:text-text disabled:opacity-30"
                  >
                    下
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    aria-label={isSong ? `${row.title}を外す` : "アンコールの区切りを外す"}
                    className="rounded-md px-2 py-1.5 text-[0.7rem] text-faint transition hover:bg-red-400/15 hover:text-red-300"
                  >
                    外す
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mb-2 rounded-xl border border-dashed border-line px-3 py-4 text-center text-xs text-faint">
          まだ曲がありません。
        </p>
      )}

      {!open ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={openPanel} className="btn btn-ghost flex-1 text-xs">
            曲を追加する
          </button>
          {rows.length > 0 ? (
            <button
              type="button"
              onClick={addEncore}
              disabled={rows.at(-1)?.type === "encore"}
              className="btn btn-ghost text-xs"
            >
              アンコール区切り
            </button>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-ink/40 p-3">
          {stale && !loading ? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
              <span className="text-[0.7rem] text-muted">アーティストが変わりました。</span>
              <button
                type="button"
                onClick={() => load(names)}
                className="text-[0.7rem] font-semibold text-neon-cyan hover:underline"
              >
                候補を読み直す
              </button>
            </div>
          ) : null}

          {names.length === 0 ? (
            <p className="text-xs text-muted">先にアーティストを入力してください。</p>
          ) : loading && catalog === null ? (
            <p className="py-4 text-center text-xs text-faint">曲を読み込んでいます…</p>
          ) : error ? (
            <p role="alert" className="text-xs text-red-300">
              {error}
            </p>
          ) : catalog && catalog.length === 0 ? (
            <p className="text-xs text-muted">
              まだ全曲が取り込まれていません。取り込むと、ここから曲を選べます。
            </p>
          ) : (
            <>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="曲名で探す"
                aria-label="曲名で探す"
                className="field"
              />

              {catalogArtists.length > 1 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[null, ...catalogArtists].map((name) => (
                    <button
                      key={name ?? "all"}
                      type="button"
                      onClick={() => setArtistFilter(name)}
                      aria-pressed={artistFilter === name}
                      className={`max-w-full truncate rounded-full px-2.5 py-1 text-[0.7rem] font-semibold transition ${
                        artistFilter === name
                          ? "bg-white/10 text-text ring-1 ring-neon-violet/50"
                          : "text-faint ring-1 ring-line hover:text-text"
                      }`}
                    >
                      {name ?? "すべて"}
                    </button>
                  ))}
                </div>
              ) : null}

              <ul className="scroll-slim mt-2 max-h-64 divide-y divide-line-soft overflow-y-auto">
                {candidates.length === 0 ? (
                  <li className="py-4 text-center text-xs text-faint">見つかりませんでした。</li>
                ) : (
                  candidates.map((song) => {
                    const added = addedCount.get(song.title_key) ?? 0;
                    return (
                      <li key={`${song.artist_name}-${song.title_key}`}>
                        <button
                          type="button"
                          onClick={() => addSong(song.title)}
                          className="flex w-full items-center gap-2 px-1 py-2 text-left transition hover:bg-white/5"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm">{song.title}</span>
                            <span className="block truncate text-[0.6rem] text-faint">
                              {[catalogArtists.length > 1 ? song.artist_name : null, song.release_date?.slice(0, 4)]
                                .filter(Boolean)
                                .join(" / ")}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 text-[0.7rem] font-semibold ${
                              added > 0 ? "text-faint" : "text-neon-cyan"
                            }`}
                          >
                            {added > 0 ? "追加済み" : "追加"}
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </>
          )}

          {/* 全曲をまだ取り込んでいないアーティスト（取り込むと候補に加わる） */}
          {catalog && !loading && missingArtists.length > 0 ? (
            <div className="mt-3 space-y-2 border-t border-line-soft pt-3">
              {missingArtists.map((name) => (
                <div key={name}>
                  <p className="mb-1 text-[0.7rem] text-faint">{name} の曲は未取り込み</p>
                  <CatalogImporter
                    artistName={name}
                    itunesArtistId={null}
                    songCount={0}
                    compact
                    onImported={() => load(loadedNames ?? names)}
                  />
                </div>
              ))}
            </div>
          ) : null}

          {/* 未発表曲やカバーなど、カタログにない曲 */}
          {names.length > 0 ? (
            <div className="mt-3 border-t border-line-soft pt-3">
              <label className="field-label" htmlFor="customSong">
                カタログにない曲を追加 <span className="font-normal text-faint">（未発表曲・カバーなど）</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="customSong"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => {
                    // フォーム全体が送信されないよう、Enter はこの欄の追加に使う
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSong(custom);
                      setCustom("");
                    }
                  }}
                  maxLength={200}
                  placeholder="曲名"
                  className="field"
                />
                <button
                  type="button"
                  onClick={() => {
                    addSong(custom);
                    setCustom("");
                  }}
                  disabled={!custom.trim()}
                  className="btn btn-ghost shrink-0 text-xs"
                >
                  追加
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {rows.length > 0 ? (
              <button
                type="button"
                onClick={addEncore}
                disabled={rows.at(-1)?.type === "encore"}
                className="btn btn-ghost flex-1 text-xs"
              >
                アンコール区切り
              </button>
            ) : null}
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost flex-1 text-xs">
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
