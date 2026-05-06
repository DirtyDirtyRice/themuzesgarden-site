export type AppNavigationNodeType =
  | "root"
  | "page"
  | "section"
  | "action"
  | "future";

export type AppNavigationNode = {
  id: string;
  label: string;
  type: AppNavigationNodeType;
  route?: string;
  keywords: string[];
  description: string;
  children?: AppNavigationNode[];
};

export const appNavigationTree: AppNavigationNode = {
  id: "home",
  label: "Home",
  type: "root",
  route: "/",
  keywords: ["home", "start", "main", "landing"],
  description: "The main entry point for The Muzes Garden.",
  children: [
    {
      id: "library",
      label: "Library",
      type: "page",
      route: "/library",
      keywords: ["library", "music", "tracks", "songs", "audio"],
      description: "The main music library area.",
    },
    {
      id: "listen",
      label: "Listen",
      type: "page",
      route: "/listen",
      keywords: ["listen", "player", "playback", "audio", "music"],
      description: "The listening and playback area.",
    },
    {
      id: "live",
      label: "Live",
      type: "page",
      route: "/live",
      keywords: ["live", "performance", "stage", "show"],
      description: "The live performance area.",
    },
    {
      id: "members",
      label: "Members",
      type: "page",
      route: "/members",
      keywords: ["members", "people", "profile", "account"],
      description: "The members and people area.",
    },
    {
      id: "metadata",
      label: "Metadata",
      type: "page",
      route: "/metadata",
      keywords: ["metadata", "meaning", "system", "knowledge"],
      description: "The metadata knowledge system.",
      children: [
        {
          id: "metadata-library",
          label: "Metadata Library",
          type: "page",
          route: "/metadata/library",
          keywords: ["metadata", "library", "records", "browse", "search"],
          description: "Browse and open saved metadata records.",
          children: [
            {
              id: "metadata-library-search",
              label: "Search metadata records",
              type: "section",
              route: "/metadata/library",
              keywords: ["search", "find", "filter", "records"],
              description: "Search or filter records inside the metadata library.",
            },
            {
              id: "metadata-library-card",
              label: "Record card",
              type: "section",
              route: "/metadata/library",
              keywords: ["card", "record", "select", "preview"],
              description: "A clickable record card inside the metadata library.",
            },
            {
              id: "metadata-quick-preview",
              label: "Quick Preview",
              type: "section",
              route: "/metadata/library",
              keywords: ["quick", "preview", "selected", "actions"],
              description:
                "The side preview panel that appears after selecting a record.",
              children: [
                {
                  id: "metadata-open-selected",
                  label: "Open Selected",
                  type: "action",
                  route: "/metadata/library",
                  keywords: ["open", "selected", "record", "details"],
                  description:
                    "The action that opens the selected metadata record page.",
                },
              ],
            },
          ],
        },
        {
          id: "metadata-create",
          label: "Create Metadata Record",
          type: "page",
          route: "/metadata/create",
          keywords: ["create", "new", "record", "metadata", "builder"],
          description: "Create and save a new metadata record.",
          children: [
            {
              id: "metadata-create-start",
              label: "Start Creating Record",
              type: "action",
              route: "/metadata/create",
              keywords: ["start", "begin", "create", "record"],
              description: "The first action that starts the create flow.",
            },
            {
              id: "metadata-create-required-fields",
              label: "Required fields",
              type: "section",
              route: "/metadata/create",
              keywords: ["required", "fields", "yellow", "star", "missing"],
              description:
                "Fields marked as required before moving forward in the create flow.",
            },
            {
              id: "metadata-create-placement",
              label: "Placement",
              type: "section",
              route: "/metadata/create",
              keywords: ["placement", "where", "belongs", "shelf", "section"],
              description:
                "The create-flow step where the record location is chosen.",
            },
            {
              id: "metadata-create-save",
              label: "Save metadata record",
              type: "action",
              route: "/metadata/create",
              keywords: ["save", "finish", "complete", "record"],
              description: "The final save step for a new metadata record.",
            },
          ],
        },
        {
          id: "metadata-system",
          label: "Metadata System",
          type: "page",
          route: "/metadata/system",
          keywords: ["system", "structure", "tree", "explain", "help"],
          description:
            "The explanation page for how the metadata system is organized.",
          children: [
            {
              id: "metadata-system-library-model",
              label: "Library model",
              type: "section",
              route: "/metadata/system",
              keywords: ["library", "shelves", "sections", "records"],
              description:
                "Explains Library → Shelves → Sections → Records.",
            },
            {
              id: "metadata-system-relationships",
              label: "Relationship model",
              type: "section",
              route: "/metadata/system",
              keywords: ["relationships", "connections", "links", "map"],
              description:
                "Explains how metadata records can connect to each other.",
            },
          ],
        },
        {
          id: "metadata-record-page",
          label: "Metadata Record Page",
          type: "page",
          route: "/metadata/[slug]",
          keywords: ["record", "details", "page", "metadata"],
          description: "The full detail page for one metadata record.",
          children: [
            {
              id: "metadata-record-overview",
              label: "Record overview",
              type: "section",
              route: "/metadata/[slug]",
              keywords: ["overview", "summary", "details"],
              description: "The main summary area of a metadata record.",
            },
            {
              id: "metadata-record-relationships",
              label: "Relationships section",
              type: "section",
              route: "/metadata/[slug]",
              keywords: ["relationships", "related", "connected", "map"],
              description:
                "The section showing connected records and relationship previews.",
            },
            {
              id: "metadata-record-more-information",
              label: "More Information",
              type: "future",
              route: "/metadata/[slug]",
              keywords: ["more", "info", "information", "explain"],
              description:
                "Future encyclopedia-style information expansion for record details.",
            },
          ],
        },
      ],
    },
    {
      id: "find-it",
      label: "Find It",
      type: "action",
      keywords: ["find", "where", "navigate", "help", "lost"],
      description:
        "The global TitleBar helper that tells the user exactly how to get somewhere.",
    },
  ],
};

export function flattenAppNavigationTree(
  node: AppNavigationNode = appNavigationTree,
): AppNavigationNode[] {
  const children = node.children ?? [];

  return [
    node,
    ...children.flatMap((child) => flattenAppNavigationTree(child)),
  ];
}

export function findNavigationNodeById(id: string) {
  return flattenAppNavigationTree().find((node) => node.id === id) ?? null;
}

export function findNavigationNodeByRoute(route: string) {
  return (
    flattenAppNavigationTree().find((node) => node.route === route) ?? null
  );
}

export function getNavigationPathToNode(
  targetId: string,
  node: AppNavigationNode = appNavigationTree,
  path: AppNavigationNode[] = [],
): AppNavigationNode[] | null {
  const nextPath = [...path, node];

  if (node.id === targetId) return nextPath;

  for (const child of node.children ?? []) {
    const childPath = getNavigationPathToNode(targetId, child, nextPath);

    if (childPath) return childPath;
  }

  return null;
}

export function getNavigationLabelsToNode(targetId: string) {
  return getNavigationPathToNode(targetId)?.map((node) => node.label) ?? [];
}