import type { MapIntelligence } from "./relationshipExplorerMapSummaryTypes";

type GuidanceItem = {
  label: string;
  detail: string;
};

function GuidanceMiniList({
  items,
}: {
  items: GuidanceItem[];
}) {
  return (
    <div className="mt-2 space-y-1.5">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-md border border-white/10 px-2 py-1.5"
        >
          <p className="text-[10px] font-medium text-white/55">{item.label}</p>
          <p className="mt-0.5 text-[10px] leading-4 text-white/30">
            {item.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

function getRecommendationItems(
  intelligence: MapIntelligence
): GuidanceItem[] {
  return [
    {
      label: "Read the dominant signal",
      detail: `Start with ${intelligence.dominantSignal}, because it is currently leading the map.`,
    },
    {
      label: "Check balance",
      detail: `This map is marked ${intelligence.signalBalance.tone}, so compare structure and language carefully.`,
    },
    {
      label: "Decide what to save",
      detail:
        "Use the strongest repeated signals to decide which suggested relationships should become permanent links.",
    },
  ];
}

function getRouteGuideItems(): GuidanceItem[] {
  return [
    {
      label: "Step view",
      detail:
        "Shows the literal click-by-click route, with no skipped pages or hidden assumptions.",
    },
    {
      label: "Tree view",
      detail:
        "Shows where a feature lives inside the larger app structure before giving the route.",
    },
    {
      label: "Search view",
      detail:
        "Lets users search for a feature name and jump to the correct route explanation.",
    },
  ];
}

export function SummaryActionCard({
  label,
  detail,
}: {
  label: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-white/15 bg-black p-3">
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">
        Suggested next action
      </p>

      <p className="mt-1 text-xs font-medium text-white/65">{label}</p>

      <p className="mt-1 text-[10px] leading-4 text-white/35">{detail}</p>

      <div className="mt-2 rounded-md border border-white/10 px-2 py-1.5">
        <p className="text-[10px] text-white/35">
          Baby step: do this one action first before opening another panel.
        </p>
      </div>
    </div>
  );
}

export function RecommendationCard({
  intelligence,
}: {
  intelligence: MapIntelligence;
}) {
  const items = getRecommendationItems(intelligence);

  return (
    <div className="rounded-lg border border-white/15 bg-black p-3 md:col-span-2">
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">
        Map recommendation
      </p>

      <p className="mt-1 text-xs leading-5 text-white/60">
        {intelligence.recommendationHint}
      </p>

      <p className="mt-2 text-[10px] leading-4 text-white/35">
        Dominant signal: {intelligence.dominantSignal}. Balance:{" "}
        {intelligence.signalBalance.tone}.
      </p>

      <GuidanceMiniList items={items} />
    </div>
  );
}

export function RouteFutureCard() {
  const items = getRouteGuideItems();

  return (
    <div className="rounded-lg border border-white/15 bg-black p-3">
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">
        Future route helper
      </p>

      <p className="mt-1 text-xs font-medium text-white/65">
        This map can later feed the step-by-step guide.
      </p>

      <p className="mt-1 text-[10px] leading-4 text-white/35">
        The same summary data can support the future ADD-friendly tree and route
        encyclopedia.
      </p>

      <GuidanceMiniList items={items} />

      <div className="mt-2 rounded-md border border-white/10 px-2 py-1.5">
        <p className="text-[10px] font-medium text-white/45">
          Future example route
        </p>

        <p className="mt-0.5 text-[10px] leading-4 text-white/30">
          Metadata → Library → Records → Record detail → Relationship explorer →
          Relationship card.
        </p>
      </div>
    </div>
  );
}