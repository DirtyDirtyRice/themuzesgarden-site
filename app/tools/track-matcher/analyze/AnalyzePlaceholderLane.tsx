type AnalyzePlaceholderLaneProps = {
  label: string;
  help: string;
};

export default function AnalyzePlaceholderLane({
  label,
  help,
}: AnalyzePlaceholderLaneProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="h-16 rounded-xl border border-white/10 bg-white/[0.03]">
        <div className="flex h-full items-center justify-center text-xs font-bold uppercase tracking-[0.18em] text-white/30">
          {label}
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/55">
        {help}
      </p>
    </div>
  );
}