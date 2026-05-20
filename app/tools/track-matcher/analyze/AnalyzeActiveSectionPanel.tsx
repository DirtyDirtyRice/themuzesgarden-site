import AnalyzePlaceholderLane from "./AnalyzePlaceholderLane";

export type AnalyzeSectionStatus = "Ready" | "Building" | "Later";

export type AnalyzeActiveSection = {
  title: string;
  status: AnalyzeSectionStatus;
  description: string;
  details: string[];
};

type AnalyzeActiveSectionPanelProps = {
  section: AnalyzeActiveSection;
};

function getStatusClass(status: AnalyzeSectionStatus) {
  if (status === "Ready") {
    return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
  }

  if (status === "Building") {
    return "border-sky-300/30 bg-sky-300/10 text-sky-100";
  }

  return "border-white/10 bg-white/5 text-white/60";
}

export default function AnalyzeActiveSectionPanel({
  section,
}: AnalyzeActiveSectionPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${getStatusClass(
              section.status,
            )}`}
          >
            {section.status}
          </div>

          <h3 className="mt-4 text-2xl font-black text-white">
            {section.title}
          </h3>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
            {section.description}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {section.details.map((detail) => (
          <div
            key={detail}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <p className="text-sm leading-6 text-white/65">
              {detail}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <AnalyzePlaceholderLane
          label="Track A lane"
          help="This placeholder reserves space for the master track view."
        />

        <AnalyzePlaceholderLane
          label="Track B lane"
          help="This placeholder reserves space for the follower track view."
        />

        <AnalyzePlaceholderLane
          label="Intelligence lane"
          help="This placeholder reserves space for mix and training intelligence."
        />
      </div>
    </div>
  );
}