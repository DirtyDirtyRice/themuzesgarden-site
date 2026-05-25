import type { TrackMatcherFinderQuery } from "./trackMatcherFinderTypes";

export type TrackMatcherFinderSavedSearchScope =
  | "library"
  | "project"
  | "track-matcher"
  | "global";

export type TrackMatcherFinderSavedSearchStatus =
  | "active"
  | "starter"
  | "planned"
  | "hidden";

export type TrackMatcherFinderSavedSearch = {
  id: string;
  label: string;
  description: string;
  scope: TrackMatcherFinderSavedSearchScope;
  status: TrackMatcherFinderSavedSearchStatus;
  query: TrackMatcherFinderQuery;
  keywords: string[];
};

export type TrackMatcherFinderSavedSearchGroup = {
  id: string;
  label: string;
  description: string;
  searches: TrackMatcherFinderSavedSearch[];
};