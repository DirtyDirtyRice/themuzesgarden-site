import type {
  TrackMatcherPanelRegistryCapability,
  TrackMatcherPanelRegistryId,
} from "./trackMatcherPanelRegistryTypes";

export type TrackMatcherPanelPluginRegistrationStatus =
  | "registered"
  | "disabled"
  | "planned";

export type TrackMatcherPanelPluginRegistration = {
  pluginId: string;
  panelId: TrackMatcherPanelRegistryId;
  title: string;
  capabilities: TrackMatcherPanelRegistryCapability[];
  status: TrackMatcherPanelPluginRegistrationStatus;
  version: string;
  author: string;
};

export type TrackMatcherPanelPluginRegistrySnapshot = {
  snapshotId: string;
  createdAtIso: string;
  registrations: TrackMatcherPanelPluginRegistration[];
};
