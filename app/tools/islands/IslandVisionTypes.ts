// app/tools/islands/IslandVisionTypes.ts

export type IslandWorkspacePrinciple = {
  title: string;
  description: string;
};

export type IslandWorkspaceLink = {
  label: string;
  destination: string;
};

export type IslandWorkspaceTreeItem = {
  title: string;
  description: string;
};

export type IslandWorkspaceTreeGroup = {
  title: string;
  items: IslandWorkspaceTreeItem[];
};

export type IslandWorkspaceSection = {
  title: string;
  summary: string;
  groups: IslandWorkspaceTreeGroup[];
};

export type IslandWorkspaceToolCategory = {
  title: string;
  description: string;
  tools: string[];
};

export type IslandVisionWorkspace = {
  title: string;
  subtitle: string;

  principles: IslandWorkspacePrinciple[];

  quickLinks: IslandWorkspaceLink[];

  toolCategories: IslandWorkspaceToolCategory[];

  sections: IslandWorkspaceSection[];
};