import type { MetadataKind, MetadataTargetType } from "./metadataTypes";
import type { MetadataQueryInput } from "./metadataQueryTypes";

export const TARGET_TYPE_OPTIONS: Array<MetadataTargetType | "all"> = [
  "all",
  "project",
  "track",
  "section",
  "moment",
  "lyric",
  "instrument",
  "note",
  "chord",
  "modulation",
  "tag",
];

export const KIND_OPTIONS: Array<MetadataKind | "all"> = [
  "all",
  "tag",
  "description",
  "analysis",
  "instruction",
  "structure",
  "emotion",
  "technical",
  "timing",
  "reference",
];

export const MODE_OPTIONS: Array<MetadataQueryInput["mode"]> = [
  "all",
  "text",
  "target",
  "tokens",
];