import type { SVGProps } from "react";

/**
 * 各画面の見出し。下部タブと同じアイコンを添えて、
 * 「いまどの画面にいるか」の見え方を揃える。
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description?: string;
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
}) {
  return (
    <div className="mb-4 flex items-start gap-2.5">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-neon-pink" />
      <div className="min-w-0">
        <h1 className="text-xl leading-tight font-black">{title}</h1>
        {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
      </div>
    </div>
  );
}
