// app/tools/track-matcher/multi-track/wave-form/MultiTrackSectionSurvivorEngineSeed.ts

import type { MultiTrackSectionSurvivorWorkspace } from "./MultiTrackSectionSurvivorEngineTypes";

export const multiTrackSectionSurvivorWorkspaceSeed: MultiTrackSectionSurvivorWorkspace =
  {
    title: "Section Survivor Engine",

    summary:
      "Tracks which extracted sections survive repeated comparison, extraction, ranking, and strongest-idea validation stages.",

    metrics: [
      {
        label: "Survivors",
        value: 4,
        detail: "Sections surviving evaluation.",
      },
      {
        label: "Contenders",
        value: 1,
        detail: "Still under review.",
      },
      {
        label: "Rejected",
        value: 1,
        detail: "Failed survivor criteria.",
      },
      {
        label: "Average Score",
        value: 88,
        detail: "Average survivor score.",
      },
    ],

    steps: [
      {
        step: "01",
        title: "Load extracted sections",
        status: "ready",
        detail: "Import extraction results.",
      },
      {
        step: "02",
        title: "Evaluate survival",
        status: "ready",
        detail: "Score recurring appearance and confidence.",
      },
      {
        step: "03",
        title: "Promote survivors",
        status: "ready",
        detail: "Mark strongest sections as survivors.",
      },
      {
        step: "04",
        title: "Prepare build decision",
        status: "needs-review",
        detail: "Human review before final promotion.",
      },
    ],

    survivors: [
      {
        id: "survivor-chorus",
        sectionType: "Chorus",
        strongestIdea: "Main Hook Motif",
        sourceVersion: "14 Days - Version 02",
        sourceCandidate: "Candidate A",
        verdict: "survivor",
        confidence: 98,
        survivalScore: 99,
        detail: "Strongest surviving musical idea.",
      },
      {
        id: "survivor-verse",
        sectionType: "Verse",
        strongestIdea: "Verse Answer Figure",
        sourceVersion: "14 Days - Version 02",
        sourceCandidate: "Candidate A",
        verdict: "survivor",
        confidence: 92,
        survivalScore: 93,
        detail: "Repeated across multiple versions.",
      },
      {
        id: "survivor-bridge",
        sectionType: "Bridge",
        strongestIdea: "Bridge Pulse Pattern",
        sourceVersion: "14 Days - Dark Version",
        sourceCandidate: "Candidate C",
        verdict: "contender",
        confidence: 80,
        survivalScore: 78,
        detail: "Needs additional listening review.",
      },
      {
        id: "survivor-outro",
        sectionType: "Outro",
        strongestIdea: "Outro Energy Lift",
        sourceVersion: "14 Days - Rock Version",
        sourceCandidate: "Candidate B",
        verdict: "survivor",
        confidence: 86,
        survivalScore: 87,
        detail: "Strong ending candidate.",
      },
    ],
  };