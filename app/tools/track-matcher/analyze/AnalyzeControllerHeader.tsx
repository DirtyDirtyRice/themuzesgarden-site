type AnalyzeControllerHeaderProps = {
  title: string;
  description: string;
};

export default function AnalyzeControllerHeader({
  title,
  description,
}: AnalyzeControllerHeaderProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
            Analyze Controller
          </p>

          <h2 className="mt-3 text-2xl font-black text-white">
            {title}
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
            {description}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100">
          GREEN-SAFE
        </div>
      </div>
    </div>
  );
}