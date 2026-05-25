import { TRACK_MATCHER_FINDER_PRESETS } from "./trackMatcherFinderQueryPresets";
import type {
  TrackMatcherFinderPreset,
  TrackMatcherMetadataProfile,
} from "./trackMatcherFinderMetadataTypes";

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getProfileTokens(profile: TrackMatcherMetadataProfile) {
  return new Set([
    ...profile.generatedKeywords,
    ...profile.genres,
    ...profile.moods,
    ...profile.instruments,
    ...profile.stemTypes,
    ...profile.vocalTypes,
    ...profile.workflowFlags,
    ...profile.metadataTokens.map((token) => token.token),
  ].map(normalize));
}

export function metadataProfileMatchesPreset(
  profile: TrackMatcherMetadataProfile,
  preset: TrackMatcherFinderPreset,
) {
  const tokens = getProfileTokens(profile);

  const hasRequired = preset.requiredTokens.every((token) =>
    tokens.has(normalize(token)),
  );

  const hasExcluded = preset.excludedTokens.some((token) =>
    tokens.has(normalize(token)),
  );

  return hasRequired && !hasExcluded;
}

export function getMatchingFinderPresetsForProfile(
  profile: TrackMatcherMetadataProfile,
) {
  return TRACK_MATCHER_FINDER_PRESETS.filter((preset) =>
    metadataProfileMatchesPreset(profile, preset),
  );
}

export function getFinderPresetById(presetId: string) {
  return TRACK_MATCHER_FINDER_PRESETS.find(
    (preset) => preset.id === presetId,
  );
}

export function filterProfilesByFinderPreset(
  profiles: readonly TrackMatcherMetadataProfile[],
  presetId: string,
) {
  const preset = getFinderPresetById(presetId);
  if (!preset) return [];

  return profiles.filter((profile) =>
    metadataProfileMatchesPreset(profile, preset),
  );
}