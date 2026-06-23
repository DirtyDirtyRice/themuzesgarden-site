import { panelClass, StatusPill, InfoCard } from "../components/MultiTrackShared";
import {
  getMultiTrackRecurringRiffDominantCount,
  getMultiTrackRecurringRiffKeeperCandidateCount,
  getMultiTrackRecurringRiffMatchTypeLabel,
  getMultiTrackRecurringRiffReadinessLabel,
  getMultiTrackRecurringRiffReadyCount,
  getMultiTrackRecurringRiffReviewCount,
  getMultiTrackRecurringRiffStrengthLabel,
  getMultiTrackRecurringRiffTopCandidate,
  getMultiTrackRecurringRiffTotalUses,
} from "./MultiTrackRecurringRiffEngineHelpers";
import { multiTrackRecurringRiffWorkspaceSeed } from "./MultiTrackRecurringRiffEngineSeed";

export function MultiTrackRecurringRiffEngineWorkspacePanel() {
  const workspace = multiTrackRecurringRiffWorkspaceSeed;
  const topCandidate = getMultiTrackRecurringRiffTopCandidate(workspace);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            Recurring Riff Engine
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            {workspace.title}
          </h2>

          <p className="mt-3 max-w-5xl text-sm leading-6 text-white/70">
            {workspace.summary}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill label="Repeated Riffs" />
            <StatusPill label="Normalized Matching" />
            <StatusPill label="Version Coverage" />
            <StatusPill label="Keeper Candidates" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 bg-black p-4 lg:min-w-[300px]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Top Reused Idea
          </p>
          <p className="mt-2 text-xl font-black text-white">
            {topCandidate?.label || "No candidate yet"}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {topCandidate
              ? `${topCandidate.versionCoverage} / ${topCandidate.keeperBankStatus}`
              : "Recurring riff evidence has not been prepared yet."}
          </p>
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

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        <InfoCard
          label="Ready"
          value={String(getMultiTrackRecurringRiffReadyCount(workspace))}
          detail="Riffs ready for forward routing."
        />
        <InfoCard
          label="Review"
          value={String(getMultiTrackRecurringRiffReviewCount(workspace))}
          detail="Matches that need listening checks."
        />
        <InfoCard
          label="Dominant"
          value={String(getMultiTrackRecurringRiffDominantCount(workspace))}
          detail="Most repeated musical ideas."
        />
        <InfoCard
          label="Keeper Candidates"
          value={String(
            getMultiTrackRecurringRiffKeeperCandidateCount(workspace)
          )}
          detail="Recurring riffs ready for keeper review."
        />
        <InfoCard
          label="Total Uses"
          value={String(getMultiTrackRecurringRiffTotalUses(workspace))}
          detail="Total riff appearances across versions."
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/20 bg-black p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          Recurring Riff Steps
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-5">
          {workspace.steps.map((step) => (
            <div
              key={step.step}
              className="rounded-2xl border border-white/20 bg-black p-4"
            >
              <p className="text-xs font-black text-white/50">{step.step}</p>
              <h3 className="mt-2 text-sm font-black text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-xs font-black text-white">
                {getMultiTrackRecurringRiffReadinessLabel(step.status)}
              </p>
              <p className="mt-3 text-sm leading-6 text-white/70">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {workspace.riffs.map((riff) => (
          <div
            key={riff.id}
            className="rounded-2xl border border-white/20 bg-black p-4"
          >
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Recurring Riff
                </p>
                <h3 className="mt-2 text-lg font-black text-white">
                  {riff.label}
                </h3>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">
                  {riff.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusPill
                  label={getMultiTrackRecurringRiffStrengthLabel(riff.strength)}
                />
                <StatusPill
                  label={getMultiTrackRecurringRiffReadinessLabel(
                    riff.readiness
                  )}
                />
                <StatusPill label={riff.versionCoverage} />
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <InfoCard
                label="Usage Count"
                value={String(riff.usageCount)}
                detail="Times this riff appears across versions."
              />
              <InfoCard
                label="Version Coverage"
                value={riff.versionCoverage}
                detail="How widely this riff survived."
              />
              <InfoCard
                label="Keeper Bank"
                value={riff.keeperBankStatus}
                detail="Keeper routing status."
              />
              <InfoCard
                label="Strongest Idea"
                value={riff.strongestIdeaStatus}
                detail="Strongest idea routing status."
              />
            </div>

            <div className="mt-4 grid gap-3">
              {riff.uses.map((use) => (
                <div
                  key={`${riff.id}-${use.versionTitle}-${use.section}`}
                  className="rounded-2xl border border-white/20 bg-black p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                        Version Use
                      </p>
                      <h4 className="mt-2 text-sm font-black text-white">
                        {use.versionTitle}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {use.detail}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusPill
                        label={getMultiTrackRecurringRiffMatchTypeLabel(
                          use.matchType
                        )}
                      />
                      <StatusPill label={use.section} />
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <InfoCard
                      label="Original BPM"
                      value={String(use.originalBpm || "Manual")}
                      detail={`Original key: ${use.originalKey}`}
                    />
                    <InfoCard
                      label="Normalized BPM"
                      value={String(use.normalizedBpm)}
                      detail={`Normalized key: ${use.normalizedKey}`}
                    />
                    <InfoCard
                      label="Section"
                      value={use.section}
                      detail="Where the riff appears."
                    />
                    <InfoCard
                      label="Match Type"
                      value={getMultiTrackRecurringRiffMatchTypeLabel(
                        use.matchType
                      )}
                      detail="How this riff matched."
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