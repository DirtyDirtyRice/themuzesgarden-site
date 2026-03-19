import type { FamilySignalResult } from "./playerMomentFamilySignal.types";

export type FamilyDiscoveryRank =
  | "discard"
  | "low"
  | "medium"
  | "high"
  | "priority";

export type FamilyKeeperStatus =
  | "ignore"
  | "monitor"
  | "keeper"
  | "signature";

export type FamilySurfaceStatus =
  | "hidden"
  | "watch"
  | "candidate"
  | "surface-now";

export type FamilyDiscoveryReason =
  | "signal-strong"
  | "signal-anchor"
  | "reuse-ready"
  | "discovery-score-high"
  | "mature-pattern"
  | "high-momentum"
  | "volatile-family"
  | "fragile-trust"
  | "insufficient-signal-history"
  | "keeper-candidate";

export type FamilyDiscoveryResult = {
  familyId: string;
  discoveryScore: number;
  reusePriorityScore: number;
  keeperScore: number;
  rankingScore: number;
  noveltyScore: number;
  candidateScore: number;
  discoveryRank: FamilyDiscoveryRank;
  keeperStatus: FamilyKeeperStatus;
  surfaceStatus: FamilySurfaceStatus;
  strongestReason: FamilyDiscoveryReason | null;
  reasons: FamilyDiscoveryReason[];
  signalResult: FamilySignalResult | null;
};

export type BuildFamilyDiscoveryParams = {
  familyId: string;
  signalResult?: FamilySignalResult | null;
};