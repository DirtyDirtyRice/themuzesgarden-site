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

export type MultiTrackBridgeStep = {
  step: string;
  title: string;
  status: string;
  detail: string;
};

export type MultiTrackBridgePathRow = {
  label: string;
  value: string;
  detail: string;
};

export type MultiTrackBridgeWorkspace = {
  title: string;
  summary: string;
  steps: MultiTrackBridgeStep[];
  pathRows: MultiTrackBridgePathRow[];
  locks: MultiTrackBridgePathRow[];
};

export function getMultiTrackBridgeWorkspace(): MultiTrackBridgeWorkspace {
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

  return {
    title: "Similarity to Strongest Idea Bridge",
    summary:
      "Seed-safe bridge connecting the existing Similarity, Riff Grouping, Extraction, Keeper, and Strongest Idea engines without creating a new analysis engine.",
    steps: [
      {
        step: "01",
        title: "Similarity",
        status: similarityWorkspace.readiness,
        detail: `${similarityWorkspace.matches.length} matches ready for riff-family routing.`,
      },
      {
        step: "02",
        title: "Riff Grouping",
        status: riffGroupingWorkspace.readiness,
        detail: `${riffGroupingWorkspace.groups.length} riff families grouped for extraction planning.`,
      },
      {
        step: "03",
        title: "Extraction",
        status: extractionWorkspace.readiness,
        detail: `${extractionWorkspace.cutWindows.length} cut windows and ${extractionWorkspace.plans.length} plans available.`,
      },
      {
        step: "04",
        title: "Keeper",
        status: keeperWorkspace.readinessStatus,
        detail: `${keeperSummary.keeperCount} keeper winner and ${keeperSummary.queueCount} queue items ready.`,
      },
      {
        step: "05",
        title: "Strongest Idea",
        status: strongestIdeaEngineSeedState.readiness,
        detail: `${strongestIdeaReport.summary.strongestCandidateTitle} is ranked at ${strongestIdeaReport.summary.strongestScore}.`,
      },
    ],
    pathRows: [
      {
        label: "Similarity output",
        value: similarityWorkspace.matches[0]?.title ?? "No similarity match loaded",
        detail: "Matching riff evidence starts here.",
      },
      {
        label: "Riff family",
        value: riffGroupingWorkspace.groups[0]?.title ?? "No riff family loaded",
        detail: "Matched segments become a family before extraction.",
      },
      {
        label: "Extraction plan",
        value: extractionWorkspace.plans[0]?.title ?? "No extraction plan loaded",
        detail: "The family becomes a drift-corrected cut plan.",
      },
      {
        label: "Keeper candidate",
        value: bestKeeper?.title ?? "No keeper candidate loaded",
        detail: "The extraction target becomes keeper material.",
      },
      {
        label: "Strongest idea",
        value: strongestIdea?.candidate.title ?? "No strongest idea loaded",
        detail: "The keeper lane becomes the strongest musical idea candidate.",
      },
    ],
    locks: [
      {
        label: "No new engine",
        value: "Bridge only",
        detail: "This file only connects existing seed-safe engine outputs.",
      },
      {
        label: "No controller wiring",
        value: "Isolated",
        detail: "This does not touch the page, route, controller, or audio runtime.",
      },
      {
        label: "Safe bridge",
        value: "Read-only",
        detail:
          "The bridge reads existing workspaces and displays the current promotion chain.",
      },
    ],
  };
}