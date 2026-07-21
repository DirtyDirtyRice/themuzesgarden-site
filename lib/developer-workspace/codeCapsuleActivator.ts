import "server-only";

import {
  assembledCodeCapsuleText,
  transitionCodeCapsule,
  type CodeCapsule,
} from "./codeCapsule";
import { updateStoredCodeCapsule } from "./codeCapsuleStore";
import { confirmationTokenMatches } from "./codeCapsuleValidator";
import { recordPreventedAttempt, recordPreventionOutcome } from "./preventedErrorLedger";
import {
  applySafePatch,
  type SafePatchProposal,
  type SafePatchResult,
} from "./safePatchExecutor";

export type CodeCapsuleActivationResult = {
  capsule: CodeCapsule;
  patch: SafePatchResult;
};

function proposalFor(capsule: CodeCapsule): SafePatchProposal {
  return {
    file: capsule.target.file,
    startLine: capsule.target.startLine,
    endLine: capsule.target.endLine,
    expectedLines: capsule.target.expectedLines,
    replacementLines: assembledCodeCapsuleText(capsule).split(/\r?\n/),
    explanation: `Activate validated code capsule ${capsule.id}: ${capsule.title}`,
  };
}

export async function activateStoredCodeCapsule(
  id: string,
  expectedVersion: number,
  confirmationToken: string,
  root = process.cwd()
): Promise<CodeCapsuleActivationResult> {
  let patchResult: SafePatchResult | null = null;
  const capsule = await updateStoredCodeCapsule(id, expectedVersion, async (stored) => {
    if (stored.state !== "validated") {
      throw new Error(`Only a validated capsule can activate; current state is ${stored.state}.`);
    }
    if (!confirmationTokenMatches(stored, confirmationToken)) {
      throw new Error("Activation confirmation is invalid, expired, or belongs to older capsule code.");
    }
    if (!stored.validation?.targetFileHash) {
      throw new Error("Validated target-file evidence is missing. Validate the capsule again.");
    }

    patchResult = await applySafePatch(proposalFor(stored), stored.validation.targetFileHash, { root });
    const occurredAt = new Date().toISOString();
    if (!patchResult.applied) {
      const prevention = await recordPreventedAttempt({
        attemptId: stored.preventionAttemptId ?? undefined,
        capsuleId: stored.id,
        file: stored.target.file,
        candidateSource: assembledCodeCapsuleText(stored),
        compilerDiagnostics: patchResult.verification.diagnostics.map((diagnostic) => ({
          code: diagnostic.code,
          message: diagnostic.message,
          file: diagnostic.file,
          line: diagnostic.line,
          column: diagnostic.column,
        })),
        note: "Safe Patch restored the original source after activation verification failed.",
        occurredAt,
      }, root);
      const incomplete = transitionCodeCapsule(
        stored,
        "incomplete",
        "Activation typecheck failed and Safe Patch restored the original source.",
        "activator",
        occurredAt
      );
      return {
        ...incomplete,
        version: incomplete.version + 1,
        preventionAttemptId: prevention.attemptId,
        validation: {
          ...stored.validation,
          projectTypecheckPassed: false,
          diagnostics: patchResult.verification.diagnostics.map(
            (diagnostic) =>
              `${diagnostic.file ?? "build"}:${diagnostic.line ?? "?"}:${diagnostic.column ?? "?"} ${diagnostic.code ?? "error"}: ${diagnostic.message}`
          ),
          confirmationTokenHash: null,
          confirmationExpiresAt: null,
        },
        updatedAt: occurredAt,
      };
    }

    if (stored.preventionAttemptId) {
      await recordPreventionOutcome({
        attemptId: stored.preventionAttemptId,
        capsuleId: stored.id,
        file: stored.target.file,
        candidateSource: assembledCodeCapsuleText(stored),
        outcome: "activated",
        note: "Validated capsule was activated and the global TypeScript gate passed.",
        occurredAt,
      }, root);
    }

    const active = transitionCodeCapsule(
      stored,
      "active",
      "Developer confirmed activation; Safe Patch and the global TypeScript gate passed.",
      "activator",
      occurredAt
    );
    return {
      ...active,
      version: active.version + 1,
      validation: active.validation
        ? { ...active.validation, confirmationTokenHash: null, confirmationExpiresAt: null }
        : null,
      updatedAt: occurredAt,
    };
  }, root);

  if (!patchResult) throw new Error("Capsule activation completed without a Safe Patch result.");
  return { capsule, patch: patchResult };
}
