// app/tools/track-matcher/multi-track/wave-form/MultiTrackSectionExtractionEngineWorkspacePanel.tsx

import {
  InfoCard,
  StatusPill,
  panelClass,
} from "../components/MultiTrackShared";

import {
  getAverageExtractionConfidence,
  getKeeperSectionCount,
  getSectionExtractionReadinessLabel,
  getSectionTypeLabel,
  getTopExtractedSection,
} from "./MultiTrackSectionExtractionEngineHelpers";

import { multiTrackSectionExtractionWorkspaceSeed } from "./MultiTrackSectionExtractionEngineSeed";

export function MultiTrackSectionExtractionEngineWorkspacePanel() {
  const workspace = multiTrackSectionExtractionWorkspaceSeed;

  const topSection = getTopExtractedSection(workspace);

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">
          Section Extraction Engine
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          {workspace.title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-white/70">
          {workspace.summary}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill label="Section Mining" />
          <StatusPill label="Keeper Routing" />
          <StatusPill label="Winner Extraction" />
          <StatusPill label="Survivor Ready" />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/20 bg-black p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          Top Extracted Section
        </p>

        <p className="mt-2 text-lg font-black text-white">
          {topSection?.strongestIdea ?? "No section"}
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
          label="Keeper Sections"
          value={String(getKeeperSectionCount(workspace))}
          detail="Sections promoted to keeper status."
        />

        <InfoCard
          label="Average Confidence"
          value={String(getAverageExtractionConfidence(workspace))}
          detail="Average extraction confidence."
        />
      </div>

      <div className="mt-5 grid gap-3">
        {workspace.sections.map((section) => (
          <div
            key={section.id}
            className="rounded-2xl border border-white/20 bg-black p-4"
          >
            <div className="flex flex-wrap gap-2">
              <StatusPill
                label={getSectionTypeLabel(section.sectionType)}
              />

              <StatusPill
                label={`${section.confidence}%`}
              />
            </div>

            <h3 className="mt-3 text-lg font-black text-white">
              {section.strongestIdea}
            </h3>

            <p className="mt-2 text-sm text-white/70">
              {section.detail}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <InfoCard
                label="Version"
                value={section.sourceVersion}
                detail="Source version."
              />

              <InfoCard
                label="Candidate"
                value={section.sourceCandidate}
                detail="Winning candidate source."
              />

              <InfoCard
                label="Keeper Status"
                value={section.keeperStatus}
                detail="Promotion status."
              />

              <InfoCard
                label="Confidence"
                value={String(section.confidence)}
                detail="Confidence score."
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}