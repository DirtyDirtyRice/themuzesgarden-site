import { panelClass, StatusPill, InfoCard } from "../components/MultiTrackShared";
import {
  getMultiTrackRiffFrequencyAverageScore,
  getMultiTrackRiffFrequencyEliteCount,
  getMultiTrackRiffFrequencyReadinessLabel,
  getMultiTrackRiffFrequencyReadyCount,
  getMultiTrackRiffFrequencyTierLabel,
  getMultiTrackRiffFrequencyTopRecord,
} from "./MultiTrackRiffFrequencyEngineHelpers";
import { multiTrackRiffFrequencyWorkspaceSeed } from "./MultiTrackRiffFrequencyEngineSeed";

export function MultiTrackRiffFrequencyEngineWorkspacePanel() {
  const workspace = multiTrackRiffFrequencyWorkspaceSeed;
  const topRecord = getMultiTrackRiffFrequencyTopRecord(workspace);

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">
          Riff Frequency Engine
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-white">
          {workspace.title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-white/70">
          {workspace.summary}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill label="Frequency Ranking" />
          <StatusPill label="Version Coverage" />
          <StatusPill label="Keeper Routing" />
          <StatusPill label="Strongest Idea Prep" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {workspace.metrics.map((metric) => (
          <InfoCard
            key={metric.label}
            label={metric.label}
            value={String(metric.value)}
            detail={metric.detail}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <InfoCard
          label="Top Frequency"
          value={topRecord?.label ?? "None"}
          detail="Highest-ranked recurring riff."
        />

        <InfoCard
          label="Elite Riffs"
          value={String(
            getMultiTrackRiffFrequencyEliteCount(workspace)
          )}
          detail="Top frequency tier."
        />

        <InfoCard
          label="Average Score"
          value={String(
            getMultiTrackRiffFrequencyAverageScore(workspace)
          )}
          detail="Average frequency ranking."
        />
      </div>

      <div className="mt-5 grid gap-3">
        {workspace.records.map((record) => (
          <div
            key={record.id}
            className="rounded-2xl border border-white/20 bg-black p-4"
          >
            <div className="flex flex-wrap gap-2">
              <StatusPill
                label={getMultiTrackRiffFrequencyTierLabel(record.tier)}
              />
              <StatusPill
                label={getMultiTrackRiffFrequencyReadinessLabel(
                  record.readiness
                )}
              />
            </div>

            <h3 className="mt-3 text-lg font-black text-white">
              {record.label}
            </h3>

            <p className="mt-2 text-sm text-white/70">
              {record.detail}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-5">
              <InfoCard
                label="Usage"
                value={String(record.usageCount)}
                detail="Total appearances."
              />

              <InfoCard
                label="Versions"
                value={String(record.versionCoverage)}
                detail="Version coverage."
              />

              <InfoCard
                label="Sections"
                value={String(record.sectionCoverage)}
                detail="Section coverage."
              />

              <InfoCard
                label="Confidence"
                value={String(record.confidenceScore)}
                detail="Confidence score."
              />

              <InfoCard
                label="Frequency"
                value={String(record.frequencyScore)}
                detail="Final ranking score."
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}