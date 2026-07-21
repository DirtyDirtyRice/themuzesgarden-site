import "server-only";

import type { CodeRootInsertionPreview } from "./codeRootInsertion";
import { previewCodeRootInsertions } from "./codeRootInsertion";
import type { CodeRootRecommendation } from "./codeRootRecommendation";
import type { SafePatchProposal } from "./safePatchExecutor";

export type PreparedCodeRootPatch = {
  recommendation: CodeRootRecommendation;
  insertion: CodeRootInsertionPreview;
  proposal: SafePatchProposal;
};

export function prepareCodeRootSafePatch(
  source: string,
  recommendation: CodeRootRecommendation
): PreparedCodeRootPatch {
  const insertion = previewCodeRootInsertions(source, recommendation.path, [recommendation]);
  if (!insertion.validation.passed) {
    throw new Error(`Code root insertion is not safe: ${insertion.validation.errors.join(" ")}`);
  }
  const lines = source.split(/\r?\n/);
  const originalLine = lines[recommendation.insertionLine - 1];
  if (originalLine === undefined) throw new Error("The recommended root line no longer exists.");
  const proposal: SafePatchProposal = {
    file: recommendation.path,
    startLine: recommendation.insertionLine,
    endLine: recommendation.insertionLine,
    expectedLines: [originalLine],
    replacementLines: [recommendation.marker, originalLine],
    explanation: `Insert stable code root ${recommendation.id} before ${recommendation.anchorSymbol.kind} ${recommendation.anchorSymbol.name}. Executable tokens are unchanged.`,
  };
  return { recommendation, insertion, proposal };
}
