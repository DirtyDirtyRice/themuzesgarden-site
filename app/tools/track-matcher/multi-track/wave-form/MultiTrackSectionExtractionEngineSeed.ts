// app/tools/track-matcher/multi-track/wave-form/MultiTrackSectionExtractionEngineSeed.ts

import type { MultiTrackSectionExtractionWorkspace } from "./MultiTrackSectionExtractionEngineTypes";

export const multiTrackSectionExtractionWorkspaceSeed: MultiTrackSectionExtractionWorkspace =
  {
    title: "Section Extraction Engine",

    summary:
      "Extracts the strongest intro, verse, chorus, bridge, and outro sections from ranked candidates for future assembly and survivor analysis.",

    metrics: [
      {
        label: "Extracted",
        value: 6,
        detail: "Sections selected from candidate analysis.",
      },
      {
        label: "Keeper Linked",
        value: 5,
        detail: "Sections connected to keeper evidence.",
      },
      {
        label: "Elite",
        value: 2,
        detail: "Elite confidence sections.",
      },
      {
        label: "Average Confidence",
        value: 89,
        detail: "Average extraction confidence.",
      },
    ],

    steps: [
      {
        step: "01",
        title: "Load comparisons",
        status: "ready",
        detail: "Read comparison winners.",
      },
      {
        step: "02",
        title: "Locate best sections",
        status: "ready",
        detail: "Identify strongest section candidates.",
      },
      {
        step: "03",
        title: "Extract sections",
        status: "ready",
        detail: "Promote strongest section examples.",
      },
      {
        step: "04",
        title: "Prepare survivor analysis",
        status: "needs-review",
        detail: "Human review before survivor promotion.",
      },
    ],

    sections: [
      {
        id: "intro-01",
        sectionType: "intro",
        sourceVersion: "14 Days - Version 03",
        sourceCandidate: "Candidate A",
        confidence: 86,
        strongestIdea: "Opening Lift",
        keeperStatus: "keeper",
        detail: "Best opening energy and transition.",
      },
      {
        id: "verse-01",
        sectionType: "verse",
        sourceVersion: "14 Days - Version 02",
        sourceCandidate: "Candidate A",
        confidence: 92,
        strongestIdea: "Verse Answer Figure",
        keeperStatus: "keeper",
        detail: "Highest recurring verse phrase.",
      },
      {
        id: "chorus-01",
        sectionType: "chorus",
        sourceVersion: "14 Days - Version 02",
        sourceCandidate: "Candidate A",
        confidence: 98,
        strongestIdea: "Main Hook Motif",
        keeperStatus: "elite",
        detail: "Strongest chorus discovered so far.",
      },
      {
        id: "bridge-01",
        sectionType: "bridge",
        sourceVersion: "14 Days - Dark Version",
        sourceCandidate: "Candidate C",
        confidence: 81,
        strongestIdea: "Bridge Pulse Pattern",
        keeperStatus: "keeper",
        detail: "Useful contrast section.",
      },
      {
        id: "outro-01",
        sectionType: "outro",
        sourceVersion: "14 Days - Rock Version",
        sourceCandidate: "Candidate B",
        confidence: 84,
        strongestIdea: "Outro Energy Lift",
        keeperStatus: "keeper",
        detail: "Strong ending candidate.",
      },
    ],
  };