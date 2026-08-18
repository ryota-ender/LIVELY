import type { ReactNode } from "react";

export function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel p-4">
      <div className="mb-3 flex flex-wrap items-baseline gap-2">
        <h2 className="text-sm font-bold">{title}</h2>
        {description ? <p className="text-[0.65rem] text-faint">{description}</p> : null}
        {action ? <div className="ml-auto">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
