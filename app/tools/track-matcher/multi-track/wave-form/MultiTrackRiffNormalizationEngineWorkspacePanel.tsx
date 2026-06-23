import { panelClass, StatusPill, InfoCard } from "../components/MultiTrackShared";
import {
  getMultiTrackRiffNormalizationLockedOriginalCount,
  getMultiTrackRiffNormalizationModeLabel,
  getMultiTrackRiffNormalizationReadinessLabel,
  getMultiTrackRiffNormalizationReadyCount,
  getMultiTrackRiffNormalizationReviewCount,
  getMultiTrackRiffNormalizationRiskCount,
  getMultiTrackRiffNormalizationRiskLabel,
  getMultiTrackRiffNormalizationScopeLabel,
  getMultiTrackRiffNormalizationShiftSummary,
} from "./MultiTrackRiffNormalizationEngineHelpers";
import { multiTrackRiffNormalizationWorkspaceSeed } from "./MultiTrackRiffNormalizationEngineSeed";

export function MultiTrackRiffNormalizationEngineWorkspacePanel() {
  const workspace = multiTrackRiffNormalizationWorkspaceSeed;

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            Riff Normalization Engine
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            {workspace.title}
          </h2>

          <p className="mt-3 max-w-5xl text-sm leading-6 text-white/70">
            {workspace.summary}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill label="Temporary BPM / Key" />
            <StatusPill label="Original Feel Locked" />
            <StatusPill label="Riff Matching Prep" />
            <StatusPill label="Return To Original" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 bg-black p-4 lg:min-w-[280px]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Analysis Target
          </p>
          <p className="mt-2 text-xl font-black text-white">
            {workspace.analysisTarget.value}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {workspace.analysisTarget.detail}
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

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <InfoCard
          label="Ready"
          value={String(getMultiTrackRiffNormalizationReadyCount(workspace))}
          detail="Versions ready for normalized comparison."
        />
        <InfoCard
          label="Needs Review"
          value={String(getMultiTrackRiffNormalizationReviewCount(workspace))}
          detail="Versions needing manual BPM/key confirmation."
        />
        <InfoCard
          label="Original Locks"
          value={String(
            getMultiTrackRiffNormalizationLockedOriginalCount(workspace)
          )}
          detail="Original BPM/key values preserved."
        />
        <InfoCard
          label="Risk Flags"
          value={String(getMultiTrackRiffNormalizationRiskCount(workspace))}
          detail="Normalization shifts that need listening checks."
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/20 bg-black p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          Normalization Steps
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
                {getMultiTrackRiffNormalizationReadinessLabel(step.status)}
              </p>
              <p className="mt-3 text-sm leading-6 text-white/70">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {workspace.versions.map((version) => (
          <div
            key={version.id}
            className="rounded-2xl border border-white/20 bg-black p-4"
          >
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Version
                </p>
                <h3 className="mt-2 text-lg font-black text-white">
                  {version.title}
                </h3>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-white/70">
                  {version.detail}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusPill
                  label={getMultiTrackRiffNormalizationReadinessLabel(
                    version.readiness
                  )}
                />
                <StatusPill
                  label={getMultiTrackRiffNormalizationRiskLabel(version)}
                />
                <StatusPill
                  label={getMultiTrackRiffNormalizationModeLabel(version)}
                />
                <StatusPill
                  label={getMultiTrackRiffNormalizationScopeLabel(version)}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <InfoCard
                label="Original BPM"
                value={
                  version.originalBpm > 0 ? String(version.originalBpm) : "Manual"
                }
                detail={`Original key: ${version.originalKey}`}
              />
              <InfoCard
                label="Analysis BPM"
                value={String(version.analysisBpm)}
                detail={`Analysis key: ${version.analysisKey}`}
              />
              <InfoCard
                label="Shift"
                value={getMultiTrackRiffNormalizationShiftSummary(version)}
                detail="Temporary analysis movement only."
              />
              <InfoCard
                label="Return Rule"
                value="Keep Original"
                detail="Final feel returns to original BPM/key."
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {workspace.reminders.map((reminder) => (
          <div
            key={reminder.title}
            className="rounded-2xl border border-white/20 bg-black p-4"
          >
            <h3 className="text-sm font-black text-white">{reminder.title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {reminder.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}