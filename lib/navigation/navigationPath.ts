import {
  NAVIGATION_NODES,
  getNavigationBreadcrumb,
  getNavigationNodeById,
} from "./navigationTree";
import type { NavigationNode } from "./navigationTree";

export type NavigationPathStep = {
  id: string;
  label: string;
  href?: string;
  kind: NavigationNode["kind"];
  isCurrentLocation: boolean;
  isTarget: boolean;
  direction: "stay" | "up" | "down" | "across";
};

export type NavigationPathResult = {
  currentNode: NavigationNode | null;
  targetNode: NavigationNode | null;
  steps: NavigationPathStep[];
  message: string;
};

function normalizePathname(pathname: string) {
  const cleanPath = pathname.trim();

  if (!cleanPath || cleanPath === "/") {
    return "/";
  }

  return cleanPath.endsWith("/") ? cleanPath.slice(0, -1) : cleanPath;
}

function isDynamicMetadataRecordPath(pathname: string) {
  const cleanPath = normalizePathname(pathname);

  return cleanPath.startsWith("/metadata/") && cleanPath !== "/metadata/create";
}

function getStaticRouteMatch(pathname: string) {
  const cleanPath = normalizePathname(pathname);

  return (
    NAVIGATION_NODES.find((node) => {
      if (!node.href || node.href.includes("[")) {
        return false;
      }

      return normalizePathname(node.href) === cleanPath;
    }) ?? null
  );
}

export function getNavigationNodeForPathname(pathname: string) {
  const staticMatch = getStaticRouteMatch(pathname);

  if (staticMatch) {
    return staticMatch;
  }

  if (isDynamicMetadataRecordPath(pathname)) {
    return getNavigationNodeById("metadata-record");
  }

  if (normalizePathname(pathname).startsWith("/workspace/projects/")) {
    return getNavigationNodeById("project-detail");
  }

  return getNavigationNodeById("app");
}

function getSharedAncestorIndex(
  currentBreadcrumb: NavigationNode[],
  targetBreadcrumb: NavigationNode[],
) {
  let sharedIndex = -1;

  currentBreadcrumb.forEach((node, index) => {
    if (targetBreadcrumb[index]?.id === node.id) {
      sharedIndex = index;
    }
  });

  return sharedIndex;
}

function uniqueNavigationNodes(nodes: NavigationNode[]) {
  const seenIds = new Set<string>();
  const uniqueNodes: NavigationNode[] = [];

  nodes.forEach((node) => {
    if (seenIds.has(node.id)) {
      return;
    }

    seenIds.add(node.id);
    uniqueNodes.push(node);
  });

  return uniqueNodes;
}

function getGuidedPathNodes({
  currentBreadcrumb,
  targetBreadcrumb,
  sharedAncestorIndex,
}: {
  currentBreadcrumb: NavigationNode[];
  targetBreadcrumb: NavigationNode[];
  sharedAncestorIndex: number;
}) {
  if (currentBreadcrumb.length === 0) {
    return targetBreadcrumb;
  }

  if (sharedAncestorIndex < 0) {
    return uniqueNavigationNodes([...currentBreadcrumb, ...targetBreadcrumb]);
  }

  const targetBranch = targetBreadcrumb.slice(sharedAncestorIndex + 1);

  return uniqueNavigationNodes([...currentBreadcrumb, ...targetBranch]);
}

function getStepDirection({
  node,
  currentNode,
  targetNode,
  sharedAncestorIndex,
  currentBreadcrumb,
  targetBreadcrumb,
}: {
  node: NavigationNode;
  currentNode: NavigationNode | null;
  targetNode: NavigationNode | null;
  sharedAncestorIndex: number;
  currentBreadcrumb: NavigationNode[];
  targetBreadcrumb: NavigationNode[];
}): NavigationPathStep["direction"] {
  if (currentNode?.id === targetNode?.id || node.id === currentNode?.id) {
    return "stay";
  }

  if (node.id === targetNode?.id) {
    return "down";
  }

  const currentIndex = currentBreadcrumb.findIndex(
    (breadcrumbNode) => breadcrumbNode.id === node.id,
  );
  const targetIndex = targetBreadcrumb.findIndex(
    (breadcrumbNode) => breadcrumbNode.id === node.id,
  );

  if (currentIndex >= 0 && currentIndex > sharedAncestorIndex) {
    return "up";
  }

  if (targetIndex >= 0 && targetIndex > sharedAncestorIndex) {
    return "down";
  }

  if (currentIndex >= 0 || targetIndex >= 0) {
    return "across";
  }

  return "across";
}

function toPathStep({
  node,
  currentNode,
  targetNode,
  sharedAncestorIndex,
  currentBreadcrumb,
  targetBreadcrumb,
}: {
  node: NavigationNode;
  currentNode: NavigationNode | null;
  targetNode: NavigationNode | null;
  sharedAncestorIndex: number;
  currentBreadcrumb: NavigationNode[];
  targetBreadcrumb: NavigationNode[];
}): NavigationPathStep {
  return {
    id: node.id,
    label: node.label,
    href: node.href,
    kind: node.kind,
    isCurrentLocation: node.id === currentNode?.id,
    isTarget: node.id === targetNode?.id,
    direction: getStepDirection({
      node,
      currentNode,
      targetNode,
      sharedAncestorIndex,
      currentBreadcrumb,
      targetBreadcrumb,
    }),
  };
}

function getAlreadyThereResult({
  currentNode,
  targetNode,
}: {
  currentNode: NavigationNode;
  targetNode: NavigationNode;
}): NavigationPathResult {
  return {
    currentNode,
    targetNode,
    steps: [
      {
        id: currentNode.id,
        label: currentNode.label,
        href: currentNode.href,
        kind: currentNode.kind,
        isCurrentLocation: true,
        isTarget: true,
        direction: "stay",
      },
    ],
    message: "You are already there.",
  };
}

function getPathMessage({
  currentNode,
  targetNode,
  sharedAncestorIndex,
}: {
  currentNode: NavigationNode | null;
  targetNode: NavigationNode | null;
  sharedAncestorIndex: number;
}) {
  if (!targetNode) {
    return "I could not find that destination in the navigation tree.";
  }

  if (!currentNode) {
    return "Start from the app home, then follow this path.";
  }

  if (currentNode.id === targetNode.id) {
    return "You are already there.";
  }

  if (sharedAncestorIndex >= 2) {
    return "This is nearby. Follow the short path from your current area.";
  }

  return "Follow this full path from where you are now.";
}

export function getNavigationPath({
  currentPathname,
  targetNodeId,
}: {
  currentPathname: string;
  targetNodeId: string;
}): NavigationPathResult {
  const currentNode = getNavigationNodeForPathname(currentPathname);
  const targetNode = getNavigationNodeById(targetNodeId);

  if (!targetNode) {
    return {
      currentNode,
      targetNode: null,
      steps: [],
      message: getPathMessage({
        currentNode,
        targetNode: null,
        sharedAncestorIndex: -1,
      }),
    };
  }

  if (!currentNode) {
    const targetBreadcrumb = getNavigationBreadcrumb(targetNode.id);

    return {
      currentNode: null,
      targetNode,
      steps: targetBreadcrumb.map((node) =>
        toPathStep({
          node,
          currentNode: null,
          targetNode,
          sharedAncestorIndex: -1,
          currentBreadcrumb: [],
          targetBreadcrumb,
        }),
      ),
      message: getPathMessage({
        currentNode: null,
        targetNode,
        sharedAncestorIndex: -1,
      }),
    };
  }

  if (currentNode.id === targetNode.id) {
    return getAlreadyThereResult({
      currentNode,
      targetNode,
    });
  }

  const currentBreadcrumb = getNavigationBreadcrumb(currentNode.id);
  const targetBreadcrumb = getNavigationBreadcrumb(targetNode.id);
  const sharedAncestorIndex = getSharedAncestorIndex(
    currentBreadcrumb,
    targetBreadcrumb,
  );
  const guidedPathNodes = getGuidedPathNodes({
    currentBreadcrumb,
    targetBreadcrumb,
    sharedAncestorIndex,
  });

  const steps = guidedPathNodes.map((node) =>
    toPathStep({
      node,
      currentNode,
      targetNode,
      sharedAncestorIndex,
      currentBreadcrumb,
      targetBreadcrumb,
    }),
  );

  return {
    currentNode,
    targetNode,
    steps,
    message: getPathMessage({
      currentNode,
      targetNode,
      sharedAncestorIndex,
    }),
  };
}