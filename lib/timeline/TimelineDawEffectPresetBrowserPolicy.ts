import type { TimelineDawEffectKind } from "./TimelineDawMultitrackViewModel";

export type TimelineDawEffectPresetCategory =
  | "all" | "vocals" | "instruments" | "drums" | "mix" | "creative";

export type TimelineDawEffectPreset = {
  id: string;
  kind: TimelineDawEffectKind;
  name: string;
  category: Exclude<TimelineDawEffectPresetCategory, "all">;
  description: string;
  amount: number;
  mix: number;
  tags: string[];
};

export const timelineDawEffectPresetCatalog: TimelineDawEffectPreset[] = [
  { id: "eq-balanced", kind: "eq", name: "Balanced", category: "mix", description: "Gentle full-range tonal balance.", amount: 0.45, mix: 1, tags: ["neutral", "starting point"] },
  { id: "eq-vocal-presence", kind: "eq", name: "Vocal Presence", category: "vocals", description: "Adds intelligibility and forward vocal detail.", amount: 0.62, mix: 1, tags: ["voice", "clarity"] },
  { id: "eq-bass-cleanup", kind: "eq", name: "Bass Cleanup", category: "instruments", description: "Controls mud while preserving low-end weight.", amount: 0.56, mix: 1, tags: ["bass", "low end"] },
  { id: "eq-air", kind: "eq", name: "Air", category: "vocals", description: "Opens the top end for breath and shimmer.", amount: 0.48, mix: 0.9, tags: ["bright", "high shelf"] },
  { id: "eq-drum-focus", kind: "eq", name: "Drum Focus", category: "drums", description: "Tightens lows and emphasizes attack.", amount: 0.68, mix: 1, tags: ["kick", "snare", "attack"] },
  { id: "comp-vocal-glue", kind: "compressor", name: "Vocal Glue", category: "vocals", description: "Smooth, controlled vocal dynamics.", amount: 0.52, mix: 1, tags: ["voice", "level"] },
  { id: "comp-punch", kind: "compressor", name: "Punch", category: "drums", description: "Firm compression with energetic attack.", amount: 0.72, mix: 0.88, tags: ["drums", "transient"] },
  { id: "comp-gentle-bus", kind: "compressor", name: "Gentle Bus", category: "mix", description: "Subtle cohesion for groups and mixes.", amount: 0.35, mix: 1, tags: ["bus", "glue"] },
  { id: "comp-limiter", kind: "compressor", name: "Limiter", category: "mix", description: "Strong peak control before output.", amount: 0.9, mix: 1, tags: ["peak", "loud"] },
  { id: "comp-parallel", kind: "compressor", name: "Parallel Energy", category: "creative", description: "Dense compression blended with the dry signal.", amount: 0.82, mix: 0.42, tags: ["parallel", "energy"] },
  { id: "reverb-studio", kind: "reverb", name: "Studio Room", category: "mix", description: "Short natural room ambience.", amount: 0.38, mix: 0.22, tags: ["room", "natural"] },
  { id: "reverb-plate", kind: "reverb", name: "Plate", category: "vocals", description: "Smooth, bright vocal sustain.", amount: 0.58, mix: 0.3, tags: ["voice", "bright"] },
  { id: "reverb-hall", kind: "reverb", name: "Large Hall", category: "instruments", description: "Wide concert-hall depth.", amount: 0.72, mix: 0.36, tags: ["wide", "orchestral"] },
  { id: "reverb-dream", kind: "reverb", name: "Dream", category: "creative", description: "Long atmospheric space for sound design.", amount: 0.9, mix: 0.62, tags: ["ambient", "long"] },
  { id: "reverb-drum-room", kind: "reverb", name: "Drum Room", category: "drums", description: "Compact live-room depth for drums.", amount: 0.48, mix: 0.2, tags: ["kit", "room"] },
  { id: "delay-quarter", kind: "delay", name: "Quarter Note", category: "instruments", description: "Musical quarter-note echo.", amount: 0.5, mix: 0.26, tags: ["tempo", "echo"] },
  { id: "delay-eighth", kind: "delay", name: "Eighth Note", category: "vocals", description: "Quick rhythmic repeats that support phrasing.", amount: 0.42, mix: 0.2, tags: ["voice", "tempo"] },
  { id: "delay-slap", kind: "delay", name: "Slapback", category: "vocals", description: "Short vintage single-repeat character.", amount: 0.34, mix: 0.18, tags: ["vintage", "short"] },
  { id: "delay-ping-pong", kind: "delay", name: "Ping Pong", category: "creative", description: "Wide alternating stereo echoes.", amount: 0.68, mix: 0.35, tags: ["stereo", "wide"] },
  { id: "delay-drum-throw", kind: "delay", name: "Drum Throw", category: "drums", description: "Bold repeat for fills and transitions.", amount: 0.76, mix: 0.32, tags: ["fill", "transition"] },
];

export function browseTimelineDawEffectPresets(input: {
  kind: TimelineDawEffectKind;
  category?: TimelineDawEffectPresetCategory;
  query?: string;
}): TimelineDawEffectPreset[] {
  const query = (input.query ?? "").trim().toLowerCase().slice(0, 80);
  const category = input.category ?? "all";
  return timelineDawEffectPresetCatalog.filter((preset) => (
    preset.kind === input.kind
    && (category === "all" || preset.category === category)
    && (!query || [preset.name, preset.description, preset.category, ...preset.tags]
      .some((value) => value.toLowerCase().includes(query)))
  ));
}

export function getTimelineDawEffectPreset(
  kind: TimelineDawEffectKind,
  name: string,
): TimelineDawEffectPreset | null {
  return timelineDawEffectPresetCatalog.find((preset) => (
    preset.kind === kind && preset.name === name
  )) ?? null;
}
