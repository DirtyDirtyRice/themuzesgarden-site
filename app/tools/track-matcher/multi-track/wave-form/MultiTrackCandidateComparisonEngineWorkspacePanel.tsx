// app/tools/track-matcher/multi-track/wave-form/MultiTrackCandidateComparisonEngineWorkspacePanel.tsx

import {
  InfoCard,
  StatusPill,
  panelClass,
} from "../components/MultiTrackShared";

import {
  getAverageComparisonConfidence,
  getCandidateComparisonReadinessLabel,
  getCandidateComparisonVerdictLabel,
  getComparisonCount,
} from "./MultiTrackCandidateComparisonEngineHelpers";

import { multiTrackCandidateComparisonWorkspaceSeed } from "./MultiTrackCandidateComparisonEngineSeed";

export function MultiTrackCandidateComparisonEngineWorkspacePanel() {
  const workspace = multiTrackCandidateComparisonWorkspaceSeed;

  return (
    <section className={panelClass}>
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">
          Candidate Comparison Engine
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          {workspace.title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-white/70">
          {workspace.summary}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill label="Head To Head" />
        <StatusPill label="Winner Detection" />
        <StatusPill label="Promotion Routing" />
        <StatusPill label="Extraction Ready" />
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
          label="Comparisons"
          value={String(getComparisonCount(workspace))}
          detail="Completed comparisons."
        />

        <InfoCard
          label="Average Confidence"
          value={String(getAverageComparisonConfidence(workspace))}
          detail="Average comparison confidence."
        />
      </div>

      <div className="mt-5 grid gap-3">
        {workspace.comparisons.map((comparison) => (
          <div
            key={comparison.id}
            className="rounded-2xl border border-white/20 bg-black p-4"
          >
            <div className="flex flex-wrap gap-2">
              <StatusPill
                label={getCandidateComparisonVerdictLabel(
                  comparison.verdict
                )}
              />

              <StatusPill
                label={getCandidateComparisonReadinessLabel(
                  comparison.readiness
                )}
              />

              <StatusPill label={`${comparison.confidence}%`} />
            </div>

            <h3 className="mt-3 text-lg font-black text-white">
              {comparison.title}
            </h3>

            <p className="mt-2 text-sm text-white/70">
              {comparison.detail}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <InfoCard
                label="Winner"
                value={comparison.winner}
                detail="Current leader."
              />
            </div>

            <div className="mt-4 grid gap-3">
              {comparison.rows.map((row) => (
                <div
                  key={`${comparison.id}-${row.category}`}
                  className="rounded-2xl border border-white/20 bg-black p-4"
                >
                  <div className="grid gap-3 md:grid-cols-4">
                    <InfoCard
                      label="Category"
                      value={row.category}
                      detail="Comparison category."
                    />

                    <InfoCard
                      label="Candidate A"
                      value={String(row.candidateA)}
                      detail="Candidate A value."
                    />

                    <InfoCard
                      label="Candidate B"
                      value={String(row.candidateB)}
                      detail="Candidate B value."
                    />

                    <InfoCard
                      label="Winner"
                      value={row.winner}
                      detail="Category winner."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}