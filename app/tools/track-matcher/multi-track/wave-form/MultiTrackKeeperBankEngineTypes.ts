export type MultiTrackKeeperBankLane =
  | "hook-bank"
  | "verse-bank"
  | "bridge-bank"
  | "riff-bank"
  | "groove-bank"
  | "arrangement-bank";

export type MultiTrackKeeperBankAssetKind =
  | "hook"
  | "verse-riff"
  | "bridge-lift"
  | "groove-pocket"
  | "vocal-phrase"
  | "instrumental-response"
  | "arrangement-moment";

export type MultiTrackKeeperBankSourceKind =
  | "survivor-promotion"
  | "manual-favorite"
  | "phrase-match"
  | "riff-color"
  | "idea-cluster"
  | "future-analyzer";

export type MultiTrackKeeperBankQualityFlag =
  | "emotionally-strong"
  | "repeatable"
  | "arrangement-ready"
  | "needs-trim"
  | "needs-ear-check"
  | "possible-duplicate"
  | "future-dsp-check";

export type MultiTrackKeeperBankDecision =
  | "accept"
  | "hold"
  | "review"
  | "reject"
  | "future";

export type MultiTrackKeeperBankEvidence = {
  id: string;
  label: string;
  detail: string;
  sourceKind: MultiTrackKeeperBankSourceKind;
  strength: number;
  confidence: number;
};

export type MultiTrackKeeperBankAsset = {
  id: string;
  title: string;
  lane: MultiTrackKeeperBankLane;
  assetKind: MultiTrackKeeperBankAssetKind;
  sourceCandidateId: string;
  sourceVersionIds: string[];
  sectionLabel: string;
  startBar: number;
  endBar: number;
  emotionalScore: number;
  reuseScore: number;
  arrangementScore: number;
  confidence: number;
  decision: MultiTrackKeeperBankDecision;
  readiness: "ready" | "needs-review" | "blocked" | "future";
  qualityFlags: MultiTrackKeeperBankQualityFlag[];
  evidence: MultiTrackKeeperBankEvidence[];
  notes: string[];
};

export type MultiTrackKeeperBankCollection = {
  id: string;
  title: string;
  description: string;
  lane: MultiTrackKeeperBankLane;
  acceptedAssetIds: string[];
  pendingAssetIds: string[];
  rejectedAssetIds: string[];
  readiness: "ready" | "needs-review" | "blocked" | "future";
};

export type MultiTrackKeeperBankWorkspaceState = {
  engineId: string;
  engineTitle: string;
  enginePurpose: string;
  readiness: "ready" | "needs-review" | "blocked" | "future";
  assets: MultiTrackKeeperBankAsset[];
  collections: MultiTrackKeeperBankCollection[];
  nextActions: string[];
};