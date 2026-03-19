"use client";

export default function MomentInspectorIntelligenceSection(props: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { title, subtitle, children } = props;

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-700">
          {title}
        </div>
        {subtitle ? <div className="text-[10px] text-zinc-500">{subtitle}</div> : null}
      </div>

      <div className="mt-2">{children}</div>
    </div>
  );
}