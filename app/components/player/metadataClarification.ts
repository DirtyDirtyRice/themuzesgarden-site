import {
  buildMetadataClarificationAction,
  buildMetadataClarificationContext,
  buildMetadataClarificationIntent,
  buildMetadataClarificationNote,
  buildMetadataClarificationRecord,
  buildMetadataClarificationResult,
} from "./metadataClarification.builders";

import type {
  BuildMetadataClarificationActionParams,
  BuildMetadataClarificationContextParams,
  BuildMetadataClarificationIntentParams,
  BuildMetadataClarificationNoteParams,
  BuildMetadataClarificationRecordParams,
  BuildMetadataClarificationResultParams,
  MetadataClarificationAction,
  MetadataClarificationAmbiguityFlag,
  MetadataClarificationContext,
  MetadataClarificationIntent,
  MetadataClarificationNote,
  MetadataClarificationPriority,
  MetadataClarificationRecord,
  MetadataClarificationResult,
  MetadataClarificationSource,
  MetadataClarificationStatus,
  MetadataClarificationTargetKind,
} from "./metadataClarification.types";

export type {
  BuildMetadataClarificationActionParams,
  BuildMetadataClarificationContextParams,
  BuildMetadataClarificationIntentParams,
  BuildMetadataClarificationNoteParams,
  BuildMetadataClarificationRecordParams,
  BuildMetadataClarificationResultParams,
  MetadataClarificationAction,
  MetadataClarificationAmbiguityFlag,
  MetadataClarificationContext,
  MetadataClarificationIntent,
  MetadataClarificationNote,
  MetadataClarificationPriority,
  MetadataClarificationRecord,
  MetadataClarificationResult,
  MetadataClarificationSource,
  MetadataClarificationStatus,
  MetadataClarificationTargetKind,
} from "./metadataClarification.types";

export function buildMomentMetadataClarificationIntent(
  params: BuildMetadataClarificationIntentParams
): MetadataClarificationIntent {
  return buildMetadataClarificationIntent(params);
}

export function buildMomentMetadataClarificationContext(
  params: BuildMetadataClarificationContextParams
): MetadataClarificationContext {
  return buildMetadataClarificationContext(params);
}

export function buildMomentMetadataClarificationNote(
  params: BuildMetadataClarificationNoteParams
): MetadataClarificationNote | null {
  return buildMetadataClarificationNote(params);
}

export function buildMomentMetadataClarificationAction(
  params: BuildMetadataClarificationActionParams
): MetadataClarificationAction | null {
  return buildMetadataClarificationAction(params);
}

export function buildMomentMetadataClarificationRecord(
  params: BuildMetadataClarificationRecordParams
): MetadataClarificationRecord | null {
  return buildMetadataClarificationRecord(params);
}

export function buildMomentMetadataClarificationResult(
  params: BuildMetadataClarificationResultParams
): MetadataClarificationResult {
  return buildMetadataClarificationResult(params);
}