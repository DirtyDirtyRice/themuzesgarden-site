import type { MultiTrackRiffNormalizationWorkspace } from "./MultiTrackRiffNormalizationEngineTypes";

export const multiTrackRiffNormalizationWorkspaceSeed: MultiTrackRiffNormalizationWorkspace =
  {
    title: "Riff Normalization Engine",
    summary:
      "Temporary analysis layer for comparing riffs across song versions that may have different BPMs, keys, genres, or feels. The goal is to normalize copies for matching while preserving each original version's musical identity.",
    analysisTarget: {
      label: "Shared Analysis Target",
      value: "120 BPM / A minor",
      detail:
        "All versions can be temporarily viewed against a shared comparison BPM and key before being returned to their original feel.",
    },
    metrics: [
      {
        label: "Versions Ready",
        value: 6,
        detail: "Versions with enough BPM/key information to normalize.",
      },
      {
        label: "Analysis Copies",
        value: 6,
        detail: "Temporary normalized copies prepared for riff matching.",
      },
      {
        label: "Original Locks",
        value: 6,
        detail: "Original BPM/key values preserved for return after analysis.",
      },
      {
        label: "Risk Flags",
        value: 2,
        detail: "Versions that may need manual listening after normalization.",
      },
    ],
    steps: [
      {
        step: "01",
        title: "Capture original identity",
        status: "ready",
        detail:
          "Store each version's original BPM, key, title, and feel before any analysis copy is created.",
      },
      {
        step: "02",
        title: "Choose comparison target",
        status: "ready",
        detail:
          "Pick a shared BPM and key so riffs can be compared by shape instead of being hidden by tempo/key differences.",
      },
      {
        step: "03",
        title: "Create temporary normalized copy",
        status: "needs-review",
        detail:
          "Analysis copies can shift tempo and pitch for matching without replacing the original songs.",
      },
      {
        step: "04",
        title: "Compare riff shapes",
        status: "future",
        detail:
          "Recurring riff engines will use the normalized copies to find repeated hooks, motifs, and phrases.",
      },
      {
        step: "05",
        title: "Return to original feel",
        status: "ready",
        detail:
          "Keeper decisions must remember the original BPM/key because the best genre feel may live in the unnormalized version.",
      },
    ],
    versions: [
      {
        id: "riff-normalization-version-01",
        title: "14 Days - Suno Version 01",
        originalBpm: 96,
        originalKey: "G minor",
        analysisBpm: 120,
        analysisKey: "A minor",
        bpmShift: "+24 BPM",
        keyShift: "+2 semitones",
        mode: "tempo-and-key",
        scope: "full-version",
        readiness: "ready",
        risk: "watch-artifacts",
        detail:
          "Good candidate for normalization, but the larger tempo jump should be checked for feel changes.",
      },
      {
        id: "riff-normalization-version-02",
        title: "14 Days - Suno Version 02",
        originalBpm: 120,
        originalKey: "A minor",
        analysisBpm: 120,
        analysisKey: "A minor",
        bpmShift: "0 BPM",
        keyShift: "0 semitones",
        mode: "reference-version",
        scope: "full-version",
        readiness: "ready",
        risk: "safe",
        detail:
          "Reference version already matches the analysis BPM and key.",
      },
      {
        id: "riff-normalization-version-03",
        title: "14 Days - Suno Version 03",
        originalBpm: 128,
        originalKey: "B minor",
        analysisBpm: 120,
        analysisKey: "A minor",
        bpmShift: "-8 BPM",
        keyShift: "-2 semitones",
        mode: "tempo-and-key",
        scope: "phrase",
        readiness: "ready",
        risk: "safe",
        detail:
          "Small enough shift to compare phrase shape while keeping original energy available later.",
      },
      {
        id: "riff-normalization-version-04",
        title: "14 Days - Phone Melody",
        originalBpm: 0,
        originalKey: "Unknown",
        analysisBpm: 120,
        analysisKey: "A minor",
        bpmShift: "Manual",
        keyShift: "Manual",
        mode: "manual",
        scope: "riff",
        readiness: "needs-review",
        risk: "manual-check",
        detail:
          "Ad-lib source may need manual tapping and pitch center confirmation before matching.",
      },
      {
        id: "riff-normalization-version-05",
        title: "14 Days - Rock Version",
        originalBpm: 132,
        originalKey: "A minor",
        analysisBpm: 120,
        analysisKey: "A minor",
        bpmShift: "-12 BPM",
        keyShift: "0 semitones",
        mode: "tempo-only",
        scope: "section",
        readiness: "ready",
        risk: "feel-change",
        detail:
          "Tempo-only analysis can reveal riff reuse, but the faster original may carry the stronger rock feel.",
      },
      {
        id: "riff-normalization-version-06",
        title: "14 Days - Dark Version",
        originalBpm: 90,
        originalKey: "F minor",
        analysisBpm: 120,
        analysisKey: "A minor",
        bpmShift: "+30 BPM",
        keyShift: "+4 semitones",
        mode: "tempo-and-key",
        scope: "section",
        readiness: "needs-review",
        risk: "watch-artifacts",
        detail:
          "Useful for finding the same motif, but a major shift may change the emotional weight.",
      },
    ],
    reminders: [
      {
        title: "Normalization is temporary",
        body:
          "Do not treat the analysis BPM/key as the final arrangement choice. It is only a comparison lens.",
      },
      {
        title: "Original feel stays important",
        body:
          "A riff may match across versions, but the keeper version may still be the one with the best original genre feel.",
      },
      {
        title: "Manual listening remains required",
        body:
          "Large tempo or pitch shifts can create artifacts. Repeated riff evidence should be verified by ear.",
      },
    ],
  };