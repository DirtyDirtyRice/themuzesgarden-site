type AnalyzeControllerCardProps = {
  title: string;
  value: string;
  help: string;
};

export default function AnalyzeControllerCard({
  title,
  value,
  help,
}: AnalyzeControllerCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
        {title}
      </p>

      <p className="mt-2 text-xl font-black text-white">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-white/55">
        {help}
      </p>
    </div>
  );
}