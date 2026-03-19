type CountValue = {
  value: string;
  count: number;
};

function getTopCount(items: CountValue[]): number {
  if (!items.length) return 0;
  return Math.max(...items.map((item) => Number(item.count ?? 0)));
}

function getUniqueValueCount(items: CountValue[]): number {
  return items.filter((item) => String(item.value ?? "").trim()).length;
}

function StatCard(props: {
  label: string;
  value: string | number;
}) {
  const { label, value } = props;

  return (
    <div className="rounded border bg-zinc-50 px-2 py-2">
      <div className="text-[10px] text-zinc-500">{label}</div>
      <div className="text-[12px] font-medium text-zinc-800">{value}</div>
    </div>
  );
}

function PanelShell(props: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { title, subtitle, children } = props;

  return (
    <div className="rounded-lg border bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-zinc-700">{title}</div>
        <div className="text-[10px] text-zinc-500">{subtitle}</div>
      </div>

      {children}
    </div>
  );
}

function WarningPanel(props: {
  title: string;
  countLabel: string;
  toneClass: string;
  chipBorderClass: string;
  items: CountValue[];
  itemKeyPrefix: string;
}) {
  const { title, countLabel, toneClass, chipBorderClass, items, itemKeyPrefix } = props;

  if (!items.length) return null;

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium">{title}</div>
        <div className="text-[10px]">{countLabel}</div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {items.map(({ value, count }) => (
          <span
            key={`${itemKeyPrefix}:${value}`}
            className={`rounded border bg-white px-2 py-0.5 text-[10px] ${chipBorderClass}`}
          >
            {value} ×{count}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MomentInspectorTagPanels(props: {
  trackTags: string[];
  momentTagFrequency: CountValue[];
  descriptions: string[];
  duplicateTrackTags: CountValue[];
  duplicateMomentTags: CountValue[];
  duplicateSectionIds: CountValue[];
}) {
  const {
    trackTags,
    momentTagFrequency,
    descriptions,
    duplicateTrackTags,
    duplicateMomentTags,
    duplicateSectionIds,
  } = props;

  const uniqueMomentTagCount = getUniqueValueCount(momentTagFrequency);
  const topMomentTagCount = getTopCount(momentTagFrequency);

  return (
    <>
      <PanelShell title="Tag Overview" subtitle="discovery/debug snapshot">
        <div className="mt-2 grid grid-cols-2 gap-2">
          <StatCard label="Track Tags" value={trackTags.length} />
          <StatCard label="Unique Moment Tags" value={uniqueMomentTagCount} />
          <StatCard
            label="Top Tag Repeat"
            value={topMomentTagCount > 0 ? `×${topMomentTagCount}` : "0"}
          />
          <StatCard label="Descriptions" value={descriptions.length} />
        </div>
      </PanelShell>

      <PanelShell
        title="Track Tags"
        subtitle={trackTags.length > 0 ? `${trackTags.length} total` : "none"}
      >
        <div className="mt-2 flex flex-wrap gap-1">
          {trackTags.length > 0 ? (
            trackTags.map((tag) => (
              <span
                key={`track:${tag}`}
                className="rounded border bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-700"
                title={`Track tag: ${tag}`}
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-zinc-500">
              No track tags found for this track.
            </span>
          )}
        </div>
      </PanelShell>

      <PanelShell
        title="Moment Tag Frequency"
        subtitle={momentTagFrequency.length > 0 ? `${momentTagFrequency.length} indexed` : "none"}
      >
        <div className="mt-2 flex flex-wrap gap-1">
          {momentTagFrequency.length > 0 ? (
            momentTagFrequency.slice(0, 18).map(({ value, count }) => (
              <span
                key={`freq:${value}`}
                className="rounded border bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-700"
                title={`${value} appears ${count} time${count === 1 ? "" : "s"}`}
              >
                {value} ×{count}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-zinc-500">
              No moment tag frequency data found.
            </span>
          )}
        </div>
      </PanelShell>

      <PanelShell
        title="Description Preview"
        subtitle={descriptions.length > 0 ? `${Math.min(descriptions.length, 8)} shown` : "none"}
      >
        <div className="mt-2 space-y-1">
          {descriptions.length > 0 ? (
            descriptions.slice(0, 8).map((description, index) => (
              <div
                key={`${index}:${description}`}
                className="rounded border bg-zinc-50 px-2 py-1 text-[10px] text-zinc-700"
              >
                {description}
              </div>
            ))
          ) : (
            <div className="text-[10px] text-zinc-500">No section descriptions found.</div>
          )}
        </div>
      </PanelShell>

      <WarningPanel
        title="Duplicate Track Tags"
        countLabel={`${duplicateTrackTags.length} duplicate${duplicateTrackTags.length === 1 ? "" : "s"}`}
        toneClass="border-amber-200 bg-amber-50 text-amber-800"
        chipBorderClass="border-amber-200 text-amber-900"
        items={duplicateTrackTags}
        itemKeyPrefix="dup-track"
      />

      <WarningPanel
        title="Repeated Moment Tags Across Sections"
        countLabel={`${duplicateMomentTags.length} repeated`}
        toneClass="border-amber-200 bg-amber-50 text-amber-800"
        chipBorderClass="border-amber-200 text-amber-900"
        items={duplicateMomentTags}
        itemKeyPrefix="dup-moment"
      />

      <WarningPanel
        title="Duplicate Section IDs"
        countLabel={`${duplicateSectionIds.length} duplicate${duplicateSectionIds.length === 1 ? "" : "s"}`}
        toneClass="border-red-200 bg-red-50 text-red-800"
        chipBorderClass="border-red-200 text-red-900"
        items={duplicateSectionIds}
        itemKeyPrefix="dup-id"
      />
    </>
  );
}