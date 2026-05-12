export default function FindItExactStepsList({ steps }: { steps: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/70 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
        Exact steps
      </p>

      <ol className="mt-3 flex flex-col gap-2 text-sm leading-6 text-white/80">
        {steps.map((step, index) => (
          <li
            key={`${step}-${index}`}
            className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <span className="shrink-0 font-bold text-white">{index + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}