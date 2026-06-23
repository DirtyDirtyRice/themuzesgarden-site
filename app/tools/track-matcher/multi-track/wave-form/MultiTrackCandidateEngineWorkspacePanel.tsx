import { panelClass, StatusPill, InfoCard } from "../components/MultiTrackShared";
import {
  getMultiTrackCandidateAverageScore,
  getMultiTrackCandidateEliteCount,
  getMultiTrackCandidateReadinessLabel,
  getMultiTrackCandidateReadyCount,
  getMultiTrackCandidateReviewCount,
  getMultiTrackCandidateSourceLabel,
  getMultiTrackCandidateTierLabel,
  getMultiTrackCandidateTopCandidate,
} from "./MultiTrackCandidateEngineHelpers";
import { multiTrackCandidateWorkspaceSeed } from "./MultiTrackCandidateEngineSeed";

export function MultiTrackCandidateEngineWorkspacePanel() {
  const workspace = multiTrackCandidateWorkspaceSeed;
  const topCandidate = getMultiTrackCandidateTopCandidate(workspace);

  return (
    <section className={panelClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            Candidate Engine
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            {workspace.title}
          </h2>

          <p className="mt-3 max-w-5xl text-sm leading-6 text-white/70">
            {workspace.summary}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill label="Build Candidates" />
            <StatusPill label="Recurring Riff Evidence" />
            <StatusPill label="Arrangement Routing" />
            <StatusPill label="Hybrid Routing" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 bg-black p-4 lg:min-w-[300px]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Top Candidate
          </p>
          <p className="mt-2 text-xl font-black text-white">
            {topCandidate?.title || "No candidate yet"}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {topCandidate
              ? `${topCandidate.candidateScore}% / ${topCandidate.buildPurpose}`
              : "Candidate evidence has not been generated yet."}
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
          value={String(getMultiTrackCandidateReadyCount(workspace))}
          detail="Candidates ready for review."
        />
        <InfoCard
          label="Needs Review"
          value={String(getMultiTrackCandidateReviewCount(workspace))}
          detail="Candidates needing listening confirmation."
        />
        <InfoCard
          label="Elite"
          value={String(getMultiTrackCandidateEliteCount(workspace))}
          detail="Highest build tier."
        />
        <InfoCard
          label="Average Score"
          value={String(getMultiTrackCandidateAverageScore(workspace))}
          detail="Average candidate score."
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/20 bg-black p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          Candidate Steps
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-4">
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
                {getMultiTrackCandidateReadinessLabel(step.status)}
              </p>
              <p className="mt-3 text-sm leading-6 text-white/70">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {workspace.candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="rounded-2xl border border-white/20 bg-black p-4"
          >
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Build Candidate
                </p>
                <h3 className="mt-2 text-lg font-black text-white">
                  {candidate.title}
                </h3>
                <p className="mt-2 max-w-5xl text-sm leading-6 text-white/70">
                  {candidate.detail}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusPill
                  label={getMultiTrackCandidateTierLabel(candidate.tier)}
                />
                <StatusPill
                  label={getMultiTrackCandidateReadinessLabel(
                    candidate.readiness
                  )}
                />
                <StatusPill label={`${candidate.candidateScore}%`} />
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <InfoCard
                label="Purpose"
                value={candidate.buildPurpose}
                detail="Why this candidate exists."
              />
              <InfoCard
                label="Strongest Idea"
                value={candidate.strongestIdeaLink}
                detail="Main idea driving this build."
              />
              <InfoCard
                label="Keeper Bank"
                value={candidate.keeperBankStatus}
                detail="Keeper routing state."
              />
              <InfoCard
                label="Hybrid"
                value={candidate.hybridStatus}
                detail="Hybrid routing state."
              />
            </div>

            <div className="mt-4 grid gap-3">
              {candidate.sections.map((section) => (
                <div
                  key={`${candidate.id}-${section.label}-${section.versionTitle}`}
                  className="rounded-2xl border border-white/20 bg-black p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                        {section.label}
                      </p>
                      <h4 className="mt-2 text-sm font-black text-white">
                        {section.versionTitle}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {section.detail}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusPill
                        label={getMultiTrackCandidateSourceLabel(
                          section.source
                        )}
                      />
                      <StatusPill label={`${section.confidenceScore}%`} />
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <InfoCard
                      label="Idea"
                      value={section.riffOrIdea}
                      detail="Riff, hook, or section idea."
                    />
                    <InfoCard
                      label="Source"
                      value={getMultiTrackCandidateSourceLabel(section.source)}
                      detail="Where this section came from."
                    />
                    <InfoCard
                      label="Confidence"
                      value={String(section.confidenceScore)}
                      detail="Section confidence score."
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