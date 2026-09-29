import Image from "next/image";

/** この起動でスプラッシュを出したかを覚えておくキー（タブ / アプリを閉じると消える） */
const SEEN_KEY = "lively-splash";

/**
 * 描画前に実行するスクリプト。
 * 同じ起動の中で 2 回目以降（再読み込みなど）なら data-splash="done" を付けて出さない。
 * 表示中にタップしたら data-splash="skip" ですぐに消す。
 */
export const SPLASH_SCRIPT = `(function(){var d=document.documentElement;try{if(sessionStorage.getItem("${SEEN_KEY}")){d.setAttribute("data-splash","done");return}sessionStorage.setItem("${SEEN_KEY}","1")}catch(e){}function s(){d.setAttribute("data-splash","skip")}document.addEventListener("pointerdown",s,{once:true});setTimeout(function(){document.removeEventListener("pointerdown",s)},3000)})()`;

/**
 * アプリを開いたときに一度だけ出すスプラッシュ。
 * 最初の HTML に含め、表示から消えるまでを CSS アニメーションだけで行うので、
 * JavaScript の読み込みを待たずに出て、約 3 秒で薄く消える（globals.css の .splash）。
 * ページ内の移動ではルートレイアウトが描き直されないため出ない。
 */
export function Splash() {
  return (
    <div className="splash" aria-hidden>
      <div className="splash-mark flex flex-col items-center">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={96}
          height={96}
          priority
          className="rounded-[22%] shadow-[0_14px_60px_-10px_rgba(255,62,200,0.8)] ring-1 ring-white/10"
        />
        <p className="splash-word neon-text mt-6 text-4xl font-black tracking-[0.4em] pl-[0.4em]">
          LIVELY
        </p>
        <span className="splash-line mt-4 block h-0.5 w-32 rounded-full" />
        <p className="splash-tagline mt-4 text-xs text-faint">ライブ参戦記録 &amp; 都道府県制覇マップ</p>
      </div>
    </div>
  );
}
