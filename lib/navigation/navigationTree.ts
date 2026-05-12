export type NavigationNodeKind =
  | "app"
  | "area"
  | "page"
  | "section"
  | "action"
  | "record";

export type NavigationNode = {
  id: string;
  label: string;
  kind: NavigationNodeKind;
  href?: string;
  parentId?: string;
  keywords: string[];
  description: string;
};

export type NavigationTreeNode = NavigationNode & {
  children: NavigationTreeNode[];
};

export const NAVIGATION_NODES: NavigationNode[] = [
  {
    id: "app",
    label: "The Muzes Garden",
    kind: "app",
    href: "/",
    keywords: ["home", "start", "muzes garden", "main"],
    description: "The main app starting point.",
  },
  {
    id: "workspace",
    label: "Workspace",
    kind: "area",
    href: "/workspace",
    parentId: "app",
    keywords: ["workspace", "projects", "work area"],
    description: "Where active project work lives.",
  },
  {
    id: "projects",
    label: "Projects",
    kind: "page",
    href: "/workspace/projects",
    parentId: "workspace",
    keywords: ["projects", "songs", "tracks", "library projects"],
    description: "Project list and project entry point.",
  },
  {
    id: "project-detail",
    label: "Project Detail",
    kind: "page",
    href: "/workspace/projects/[id]",
    parentId: "projects",
    keywords: ["project detail", "project page", "open project"],
    description: "A single project page with project-specific panels.",
  },
  {
    id: "metadata",
    label: "Metadata",
    kind: "area",
    href: "/metadata",
    parentId: "app",
    keywords: ["metadata", "library", "knowledge", "information"],
    description: "The metadata knowledge system.",
  },
  {
    id: "metadata-library",
    label: "Metadata Library",
    kind: "page",
    href: "/metadata",
    parentId: "metadata",
    keywords: ["metadata library", "library home", "shelves", "records"],
    description: "The main metadata library page.",
  },
  {
    id: "metadata-shelves",
    label: "Metadata Shelves",
    kind: "section",
    href: "/metadata",
    parentId: "metadata-library",
    keywords: ["shelves", "categories", "metadata shelves"],
    description: "Shelf-level grouping for metadata records.",
  },
  {
    id: "metadata-sections",
    label: "Metadata Sections",
    kind: "section",
    href: "/metadata",
    parentId: "metadata-shelves",
    keywords: ["sections", "metadata sections", "groups"],
    description: "Section-level grouping inside shelves.",
  },
  {
    id: "metadata-record",
    label: "Metadata Record",
    kind: "record",
    href: "/metadata/[slug]",
    parentId: "metadata-sections",
    keywords: ["record", "metadata record", "detail", "more information"],
    description: "A single metadata record detail page.",
  },
  {
    id: "metadata-relationships",
    label: "Relationships",
    kind: "section",
    href: "/metadata/[slug]",
    parentId: "metadata-record",
    keywords: [
      "relationships",
      "linked records",
      "connections",
      "source",
      "target",
    ],
    description: "Record-to-record relationships and linked metadata.",
  },
  {
    id: "metadata-create",
    label: "Create Metadata",
    kind: "page",
    href: "/metadata/create",
    parentId: "metadata",
    keywords: ["create", "add metadata", "new record", "builder"],
    description: "Guided metadata record creation flow.",
  },
  {
    id: "metadata-create-identity",
    label: "Create: Identity",
    kind: "section",
    href: "/metadata/create",
    parentId: "metadata-create",
    keywords: ["identity", "name", "title", "slug", "required"],
    description: "The create step for required identity fields.",
  },
  {
    id: "metadata-create-placement",
    label: "Create: Placement",
    kind: "section",
    href: "/metadata/create",
    parentId: "metadata-create",
    keywords: ["placement", "shelf", "section", "location"],
    description: "The create step for metadata library placement.",
  },
  {
    id: "metadata-create-content",
    label: "Create: Content",
    kind: "section",
    href: "/metadata/create",
    parentId: "metadata-create",
    keywords: ["content", "summary", "description", "information"],
    description: "The create step for record description and content.",
  },
  {
    id: "metadata-create-review",
    label: "Create: Review",
    kind: "section",
    href: "/metadata/create",
    parentId: "metadata-create",
    keywords: ["review", "save", "finish", "required fields"],
    description: "The create step for final review and saving.",
  },
  {
    id: "find-it",
    label: "Find It",
    kind: "action",
    href: "#find-it",
    parentId: "app",
    keywords: ["find it", "find", "navigation", "help", "where is"],
    description: "ADD-friendly navigation helper.",
  },
];

export function getNavigationNodeById(id: string) {
  return NAVIGATION_NODES.find((node) => node.id === id) ?? null;
}

export function getNavigationChildren(parentId: string) {
  return NAVIGATION_NODES.filter((node) => node.parentId === parentId);
}

export function getNavigationRootNodes() {
  return NAVIGATION_NODES.filter((node) => !node.parentId);
}

export function buildNavigationTree(parentId?: string): NavigationTreeNode[] {
  const nodes = parentId ? getNavigationChildren(parentId) : getNavigationRootNodes();

  return nodes.map((node) => ({
    ...node,
    children: buildNavigationTree(node.id),
  }));
}

export function getNavigationAncestors(nodeId: string) {
  const ancestors: NavigationNode[] = [];
  let current = getNavigationNodeById(nodeId);

  while (current?.parentId) {
    const parent = getNavigationNodeById(current.parentId);

    if (!parent) {
      break;
    }

    ancestors.unshift(parent);
    current = parent;
  }

  return ancestors;
}

export function getNavigationBreadcrumb(nodeId: string) {
  const node = getNavigationNodeById(nodeId);

  if (!node) {
    return [];
  }

  return [...getNavigationAncestors(nodeId), node];
}