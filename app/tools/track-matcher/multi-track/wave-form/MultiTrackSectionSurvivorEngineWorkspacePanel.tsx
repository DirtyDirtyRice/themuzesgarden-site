// app/tools/track-matcher/multi-track/wave-form/MultiTrackSectionSurvivorEngineWorkspacePanel.tsx

import {
  InfoCard,
  StatusPill,
  panelClass,
} from "../components/MultiTrackShared";

import {
  getAverageSurvivorScore,
  getSectionSurvivorReadinessLabel,
  getSectionSurvivorVerdictLabel,
  getSurvivorCount,
  getTopSurvivor,
} from "./MultiTrackSectionSurvivorEngineHelpers";

import { multiTrackSectionSurvivorWorkspaceSeed } from "./MultiTrackSectionSurvivorEngineSeed";

export function MultiTrackSectionSurvivorEngineWorkspacePanel() {
  const workspace = multiTrackSectionSurvivorWorkspaceSeed;

  const topSurvivor = getTopSurvivor(workspace);

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">
          Section Survivor Engine
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          {workspace.title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-white/70">
          {workspace.summary}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill label="Survivor Tracking" />
        <StatusPill label="Promotion Routing" />
        <StatusPill label="Section Validation" />
        <StatusPill label="Build Decision Ready" />
      </div>

      <div className="mt-5 rounded-2xl border border-white/20 bg-black p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          Top Survivor
        </p>

        <p className="mt-2 text-lg font-black text-white">
          {topSurvivor?.strongestIdea ?? "No survivor"}
        </p>
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

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <InfoCard
          label="Survivors"
          value={String(getSurvivorCount(workspace))}
          detail="Promoted survivor sections."
        />

        <InfoCard
          label="Average Score"
          value={String(getAverageSurvivorScore(workspace))}
          detail="Average survivor score."
        />
      </div>

      <div className="mt-5 grid gap-3">
        {workspace.survivors.map((survivor) => (
          <div
            key={survivor.id}
            className="rounded-2xl border border-white/20 bg-black p-4"
          >
            <div className="flex flex-wrap gap-2">
              <StatusPill
                label={getSectionSurvivorVerdictLabel(
                  survivor.verdict
                )}
              />

              <StatusPill
                label={`${survivor.survivalScore}%`}
              />

              <StatusPill
                label={getSectionSurvivorReadinessLabel("ready")}
              />
            </div>

            <h3 className="mt-3 text-lg font-black text-white">
              {survivor.strongestIdea}
            </h3>

            <p className="mt-2 text-sm text-white/70">
              {survivor.detail}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <InfoCard
                label="Section"
                value={survivor.sectionType}
                detail="Section type."
              />

              <InfoCard
                label="Version"
                value={survivor.sourceVersion}
                detail="Source version."
              />

              <InfoCard
                label="Confidence"
                value={String(survivor.confidence)}
                detail="Confidence score."
              />

              <InfoCard
                label="Survival Score"
                value={String(survivor.survivalScore)}
                detail="Promotion score."
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}