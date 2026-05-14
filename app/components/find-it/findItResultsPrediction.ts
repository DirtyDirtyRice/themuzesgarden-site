import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import type { FindItSelectionMemorySnapshot } from "./findItResultsMemory";

export type FindItPredictionSignal = {
  label: string;
  value: string;
  weight: number;
};

export type FindItPredictionCandidate = {
  result: NavigationSearchResult;
  index: number;
  score: number;
  confidence: "low" | "medium" | "high";
  reason: string;
  signals: FindItPredictionSignal[];
};

export type FindItPredictionModel = {
  candidates: FindItPredictionCandidate[];
  topCandidate: FindItPredictionCandidate | null;
  predictedIndex: number | null;
  predictedNodeId: string | null;
  confidenceLabel: string;
  confidenceCopy: string;
  predictionMessage: string;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getWordSet(value: string) {
  return new Set(normalizeText(value).split(" ").filter(Boolean));
}

function getSearchOverlapScore(searchValue: string, label: string) {
  const searchWords = getWordSet(searchValue);
  const labelWords = getWordSet(label);

  if (searchWords.size === 0 || labelWords.size === 0) {
    return 0;
  }

  let shared = 0;

  searchWords.forEach((word) => {
    if (labelWords.has(word)) {
      shared += 1;
    }
  });

  return Math.round((shared / searchWords.size) * 20);
}

function getPositionScore(index: number) {
  if (index === 0) return 18;
  if (index === 1) return 12;
  if (index === 2) return 8;
  if (index <= 5) return 4;
  return 1;
}

function getMemoryScore({
  result,
  index,
  memory,
}: {
  result: NavigationSearchResult;
  index: number;
  memory: FindItSelectionMemorySnapshot;
}) {
  const memoryHit = memory.exactHit ?? memory.fuzzyHit;

  if (!memoryHit) {
    return 0;
  }

  if (memoryHit.selectedNodeId === result.node.id) {
    return memory.exactHit ? 35 : 22;
  }

  if (memoryHit.selectedLabel.toLowerCase() === result.node.label.toLowerCase()) {
    return memory.exactHit ? 28 : 18;
  }

  if (memoryHit.selectedIndex === index) {
    return memory.exactHit ? 8 : 5;
  }

  return 0;
}

function getKindContinuityScore({
  result,
  memory,
}: {
  result: NavigationSearchResult;
  memory: FindItSelectionMemorySnapshot;
}) {
  const recentKind = memory.recentSelections[0]?.selectedKind;

  if (!recentKind) {
    return 0;
  }

  const resultKind = result.node.kind.replace(/_/g, " ");

  return recentKind === resultKind ? 6 : 0;
}

function getSignal(label: string, value: string, weight: number): FindItPredictionSignal {
  return { label, value, weight };
}

function getCandidateConfidence(score: number): FindItPredictionCandidate["confidence"] {
  if (score >= 55) return "high";
  if (score >= 32) return "medium";
  return "low";
}

function getCandidateReason({
  memoryScore,
  overlapScore,
  positionScore,
  kindScore,
}: {
  memoryScore: number;
  overlapScore: number;
  positionScore: number;
  kindScore: number;
}) {
  if (memoryScore >= 30) {
    return "This result matches a remembered selection for this search.";
  }

  if (memoryScore >= 18) {
    return "This result matches a similar remembered selection.";
  }

  if (overlapScore >= 15) {
    return "This result strongly matches the words in the search.";
  }

  if (positionScore >= 12) {
    return "This result is near the top of the current match list.";
  }

  if (kindScore > 0) {
    return "This result matches the kind of item recently selected.";
  }

  return "This result is a possible match, but confidence is limited.";
}

function buildPredictionCandidate({
  result,
  index,
  searchValue,
  memory,
}: {
  result: NavigationSearchResult;
  index: number;
  searchValue: string;
  memory: FindItSelectionMemorySnapshot;
}): FindItPredictionCandidate {
  const memoryScore = getMemoryScore({ result, index, memory });
  const overlapScore = getSearchOverlapScore(searchValue, result.node.label);
  const positionScore = getPositionScore(index);
  const kindScore = getKindContinuityScore({ result, memory });
  const routeScore = result.node.href ? 3 : 0;

  const score = memoryScore + overlapScore + positionScore + kindScore + routeScore;

  return {
    result,
    index,
    score,
    confidence: getCandidateConfidence(score),
    reason: getCandidateReason({
      memoryScore,
      overlapScore,
      positionScore,
      kindScore,
    }),
    signals: [
      getSignal("Memory", memoryScore > 0 ? "hit" : "none", memoryScore),
      getSignal("Search words", overlapScore > 0 ? "matched" : "limited", overlapScore),
      getSignal("List position", `#${index + 1}`, positionScore),
      getSignal("Recent kind", kindScore > 0 ? "matched" : "different", kindScore),
      getSignal("Safe route", routeScore > 0 ? "available" : "missing", routeScore),
    ],
  };
}

function getPredictionConfidenceLabel(topCandidate: FindItPredictionCandidate | null) {
  if (!topCandidate) {
    return "No prediction";
  }

  if (topCandidate.confidence === "high") {
    return "High confidence";
  }

  if (topCandidate.confidence === "medium") {
    return "Medium confidence";
  }

  return "Low confidence";
}

function getPredictionCopy(topCandidate: FindItPredictionCandidate | null) {
  if (!topCandidate) {
    return "Prediction is waiting for results.";
  }

  if (topCandidate.confidence === "high") {
    return "The brain has a strong preferred target.";
  }

  if (topCandidate.confidence === "medium") {
    return "The brain has a useful guess, but you should still compare.";
  }

  return "The brain is still gathering context.";
}

function getPredictionMessage(topCandidate: FindItPredictionCandidate | null) {
  if (!topCandidate) {
    return "No prediction can be made yet.";
  }

  return `Likely target: ${topCandidate.result.node.label}. ${topCandidate.reason}`;
}

export function createFindItPredictionModel({
  matches,
  searchValue,
  memory,
}: {
  matches: NavigationSearchResult[];
  searchValue: string;
  memory: FindItSelectionMemorySnapshot;
}): FindItPredictionModel {
  const candidates = matches
    .map((result, index) =>
      buildPredictionCandidate({
        result,
        index,
        searchValue,
        memory,
      }),
    )
    .sort((left, right) => right.score - left.score);

  const topCandidate = candidates[0] ?? null;

  return {
    candidates,
    topCandidate,
    predictedIndex: topCandidate?.index ?? null,
    predictedNodeId: topCandidate?.result.node.id ?? null,
    confidenceLabel: getPredictionConfidenceLabel(topCandidate),
    confidenceCopy: getPredictionCopy(topCandidate),
    predictionMessage: getPredictionMessage(topCandidate),
  };
}