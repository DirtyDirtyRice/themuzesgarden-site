export function RelationshipSignalPill({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  if (!active) return null;

  return (
    <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] text-white/55">
      {label}
    </span>
  );
}

export function RelationshipStatBox({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-white/20 p-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">
        {label}
      </p>
      <p className="mt-1 text-xs text-white/70">{value} records</p>
      {detail ? <p className="mt-1 text-[10px] text-white/35">{detail}</p> : null}
    </div>
  );
}

export function RelationshipMiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] text-white/55">
      {label}: {value}
    </span>
  );
}