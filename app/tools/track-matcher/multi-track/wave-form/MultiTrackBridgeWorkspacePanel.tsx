"use client";

import { getMultiTrackSimilarityEngineWorkspace } from "./MultiTrackSimilarityEngineHelpers";
import { getMultiTrackRiffGroupingEngineWorkspace } from "./MultiTrackRiffGroupingEngineHelpers";
import { getMultiTrackExtractionEngineWorkspace } from "./MultiTrackExtractionEngineHelpers";
import {
  getMultiTrackKeeperCandidateScore,
  getMultiTrackKeeperWorkspaceSummary,
} from "./MultiTrackKeeperEngineHelpers";
import { multiTrackKeeperEngineWorkspaceState } from "./MultiTrackKeeperEngineSeed";
import { createStrongestIdeaEngineReport } from "./MultiTrackStrongestIdeaEngineHelpers";
import { strongestIdeaEngineSeedState } from "./MultiTrackStrongestIdeaEngineSeed";

export default function MultiTrackBridgeWorkspacePanel() {
  const similarityWorkspace = getMultiTrackSimilarityEngineWorkspace();
  const riffGroupingWorkspace = getMultiTrackRiffGroupingEngineWorkspace();
  const extractionWorkspace = getMultiTrackExtractionEngineWorkspace();
  const keeperWorkspace = multiTrackKeeperEngineWorkspaceState;
  const keeperSummary = getMultiTrackKeeperWorkspaceSummary(keeperWorkspace);
  const strongestIdeaReport = createStrongestIdeaEngineReport(strongestIdeaEngineSeedState);

  const bestKeeper = [...keeperWorkspace.candidates].sort(
    (left, right) =>
      getMultiTrackKeeperCandidateScore(right) - getMultiTrackKeeperCandidateScore(left),
  )[0];

  const strongestIdea = strongestIdeaReport.rankedCandidates[0];

  return (
    <section className="rounded-3xl border border-white/15 bg-black p-5 text-white">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-white/60">
        Five Engine Bridge
      </p>
      <h2 className="mt-2 text-2xl font-black text-white">
        Similarity to Strongest Idea Bridge
      </h2>
      <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-white/70">
        Seed-safe bridge connecting the existing Similarity, Riff Grouping, Extraction, Keeper,
        and Strongest Idea engines without creating a new analysis engine.
      </p>

      <div className="mt-5 grid gap-3 xl:grid-cols-5">
        <BridgeStepCard
          step="01"
          title="Similarity"
          status={similarityWorkspace.readiness}
          detail={`${similarityWorkspace.matches.length} matches ready for riff-family routing.`}
        />
        <BridgeStepCard
          step="02"
          title="Riff Grouping"
          status={riffGroupingWorkspace.readiness}
          detail={`${riffGroupingWorkspace.groups.length} riff families grouped for extraction planning.`}
        />
        <BridgeStepCard
          step="03"
          title="Extraction"
          status={extractionWorkspace.readiness}
          detail={`${extractionWorkspace.cutWindows.length} cut windows and ${extractionWorkspace.plans.length} plans available.`}
        />
        <BridgeStepCard
          step="04"
          title="Keeper"
          status={keeperWorkspace.readinessStatus}
          detail={`${keeperSummary.keeperCount} keeper winner and ${keeperSummary.queueCount} queue items ready.`}
        />
        <BridgeStepCard
          step="05"
          title="Strongest Idea"
          status={strongestIdeaEngineSeedState.readiness}
          detail={`${strongestIdeaReport.summary.strongestCandidateTitle} is ranked at ${strongestIdeaReport.summary.strongestScore}.`}
        />
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="text-lg font-black text-white">Promotion Path</h3>

        <div className="mt-4 grid gap-3">
          <BridgePathRow
            label="Similarity output"
            value={similarityWorkspace.matches[0]?.title ?? "No similarity match loaded"}
            detail="Matching riff evidence starts here."
          />
          <BridgePathRow
            label="Riff family"
            value={riffGroupingWorkspace.groups[0]?.title ?? "No riff family loaded"}
            detail="Matched segments become a family before extraction."
          />
          <BridgePathRow
            label="Extraction plan"
            value={extractionWorkspace.plans[0]?.title ?? "No extraction plan loaded"}
            detail="The family becomes a drift-corrected cut plan."
          />
          <BridgePathRow
            label="Keeper candidate"
            value={bestKeeper?.title ?? "No keeper candidate loaded"}
            detail="The extraction target becomes keeper material."
          />
          <BridgePathRow
            label="Strongest idea"
            value={strongestIdea?.candidate.title ?? "No strongest idea loaded"}
            detail="The keeper lane becomes the strongest musical idea candidate."
          />
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="text-lg font-black text-white">Bridge Lock</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <LockCard
            title="No new engine"
            body="This file only connects existing seed-safe engine outputs."
          />
          <LockCard
            title="No controller wiring"
            body="This does not touch the page, route, controller, or audio runtime."
          />
          <LockCard
            title="Safe bridge"
            body="The bridge reads existing workspaces and displays the current promotion chain."
          />
        </div>
      </div>
    </section>
  );
}

function BridgeStepCard({
  step,
  title,
  status,
  detail,
}: {
  step: string;
  title: string;
  status: string;
  detail: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/50">
        Step {step}
      </p>
      <h3 className="mt-2 text-lg font-black text-white">{title}</h3>
      <p className="mt-2 rounded-full border border-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/70">
        {status}
      </p>
      <p className="mt-3 text-sm font-semibold leading-5 text-white/70">{detail}</p>
    </article>
  );
}

function BridgePathRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">{label}</p>
      <p className="mt-2 text-base font-black text-white">{value}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-white/70">{detail}</p>
    </div>
  );
}

function LockCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <h4 className="text-sm font-black text-white">{title}</h4>
      <p className="mt-2 text-sm font-semibold leading-5 text-white/70">{body}</p>
    </div>
  );
}