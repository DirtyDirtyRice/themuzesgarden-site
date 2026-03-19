import {
  normalizeAmbiguityFlags,
  normalizeMetadataId,
  normalizeMetadataStringList,
  normalizeMetadataText,
  normalizeMetadataTextOrNull,
  normalizePriority,
  normalizeSource,
  normalizeStatus,
  normalizeTargetKind,
} from "./metadataClarification.shared";

import type {
  BuildMetadataClarificationActionParams,
  BuildMetadataClarificationContextParams,
  BuildMetadataClarificationIntentParams,
  BuildMetadataClarificationNoteParams,
  BuildMetadataClarificationRecordParams,
  BuildMetadataClarificationResultParams,
  MetadataClarificationAction,
  MetadataClarificationContext,
  MetadataClarificationIntent,
  MetadataClarificationNote,
  MetadataClarificationRecord,
  MetadataClarificationResult,
  MetadataClarificationTargetKind,
} from "./metadataClarification.types";

export function buildMetadataClarificationIntent(
  params: BuildMetadataClarificationIntentParams | null | undefined
): MetadataClarificationIntent {
  return {
    meaning: normalizeMetadataTextOrNull(params?.meaning),
    sound: normalizeMetadataTextOrNull(params?.sound),
    emotionalTone: normalizeMetadataTextOrNull(params?.emotionalTone),
    performanceStyle: normalizeMetadataTextOrNull(params?.performanceStyle),
    timingFeel: normalizeMetadataTextOrNull(params?.timingFeel),
  };
}

export function buildMetadataClarificationContext(
  params: BuildMetadataClarificationContextParams | null | undefined
): MetadataClarificationContext {
  return {
    trackId: normalizeMetadataTextOrNull(params?.trackId),
    sectionId: normalizeMetadataTextOrNull(params?.sectionId),
    phraseFamilyId: normalizeMetadataTextOrNull(params?.phraseFamilyId),
    momentId: normalizeMetadataTextOrNull(params?.momentId),
    targetLabel: normalizeMetadataTextOrNull(params?.targetLabel),
  };
}

export function buildMetadataClarificationNote(
  params: BuildMetadataClarificationNoteParams | null | undefined
): MetadataClarificationNote | null {
  const text = normalizeMetadataText(params?.text);
  if (!text) return null;

  return {
    id: normalizeMetadataId("note", params?.id ?? text),
    source: normalizeSource(params?.source),
    text,
  };
}

export function buildMetadataClarificationAction(
  params: BuildMetadataClarificationActionParams | null | undefined
): MetadataClarificationAction | null {
  const label = normalizeMetadataText(params?.label);
  const actionKind = normalizeMetadataText(params?.actionKind);

  if (!label || !actionKind) return null;

  const payload =
    params?.payload && typeof params.payload === "object" && !Array.isArray(params.payload)
      ? (params.payload as Record<string, unknown>)
      : null;

  return {
    id: normalizeMetadataId("action", params?.id ?? `${actionKind}-${label}`),
    label,
    actionKind,
    payload,
  };
}

export function buildMetadataClarificationRecord(
  params: BuildMetadataClarificationRecordParams
): MetadataClarificationRecord | null {
  const targetValue = normalizeMetadataText(params.targetValue);
  if (!targetValue) return null;

  const targetKind = normalizeTargetKind(params.targetKind);
  const normalizedTargetValue = targetValue.toLowerCase();

  const userNotes: MetadataClarificationNote[] = [];
  for (const note of params.userNotes ?? []) {
    const built = buildMetadataClarificationNote(note);
    if (built) userNotes.push(built);
  }

  const developerNotes: MetadataClarificationNote[] = [];
  for (const note of params.developerNotes ?? []) {
    const built = buildMetadataClarificationNote(note);
    if (built) developerNotes.push(built);
  }

  const actions: MetadataClarificationAction[] = [];
  for (const action of params.actions ?? []) {
    const built = buildMetadataClarificationAction(action);
    if (built) actions.push(built);
  }

  return {
    id: normalizeMetadataId("clarification", params.id ?? `${targetKind}-${targetValue}`),
    targetKind,
    targetValue,
    normalizedTargetValue,
    status: normalizeStatus(params.status),
    priority: normalizePriority(params.priority),
    intent: buildMetadataClarificationIntent(params.intent),
    context: buildMetadataClarificationContext(params.context),
    ambiguityFlags: normalizeAmbiguityFlags(params.ambiguityFlags ?? []),
    userNotes,
    developerNotes,
    actions,
    tags: normalizeMetadataStringList(params.tags ?? []),
  };
}

export function buildMetadataClarificationResult(
  params: BuildMetadataClarificationResultParams
): MetadataClarificationResult {
  const records: MetadataClarificationRecord[] = [];

  for (const input of params.records ?? []) {
    const built = buildMetadataClarificationRecord(input);
    if (built) records.push(built);
  }

  const recordsById: Record<string, MetadataClarificationRecord> = {};
  const recordsByTargetKind: Partial<
    Record<MetadataClarificationTargetKind, MetadataClarificationRecord[]>
  > = {};

  let unresolvedCount = 0;
  let highPriorityCount = 0;

  for (const record of records) {
    recordsById[record.id] = record;

    if (!recordsByTargetKind[record.targetKind]) {
      recordsByTargetKind[record.targetKind] = [];
    }

    recordsByTargetKind[record.targetKind]!.push(record);

    if (
      record.status === "draft" ||
      record.status === "uncertain" ||
      record.ambiguityFlags.length > 0
    ) {
      unresolvedCount += 1;
    }

    if (record.priority === "high" || record.priority === "critical") {
      highPriorityCount += 1;
    }
  }

  return {
    recordCount: records.length,
    records,
    recordsByTargetKind,
    recordsById,
    unresolvedCount,
    highPriorityCount,
  };
}