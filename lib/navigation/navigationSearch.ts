import { getNavigationBreadcrumb, getNavigationNodeById } from "./navigationTree";
import { NAVIGATION_NODES } from "./navigationTree";
import type { NavigationNode } from "./navigationTree";

export type NavigationSearchInjectedRecord = {
  id: string;
  label: string;
  href?: string;
  description?: string;
  keywords?: string[];
  relationshipType?: string | null;
  sourceLabel?: string | null;
  targetLabel?: string | null;
  strength?: string | number | null;
};

export type NavigationSearchContext = {
  pathname?: string;
  currentNodeId?: string | null;
  limit?: number;
  relatedRecords?: NavigationSearchInjectedRecord[];
};

export type NavigationSearchResult = {
  node: NavigationNode;
  score: number;
  matchedBy: string;
  contextBoost: number;
  relationshipBoost?: number;
};

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function splitSearchWords(value: string) {
  return normalizeSearchText(value)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function scoreExactMatch(query: string, value: string) {
  return normalizeSearchText(value) === query ? 100 : 0;
}

function scoreStartsWith(query: string, value: string) {
  return normalizeSearchText(value).startsWith(query) ? 70 : 0;
}

function scoreContains(query: string, value: string) {
  return normalizeSearchText(value).includes(query) ? 45 : 0;
}

function scoreWordMatch(query: string, value: string) {
  const queryWords = splitSearchWords(query);

  if (queryWords.length === 0) {
    return 0;
  }

  const normalizedValue = normalizeSearchText(value);
  const matches = queryWords.filter((word) => normalizedValue.includes(word));

  if (matches.length === 0) {
    return 0;
  }

  return Math.round((matches.length / queryWords.length) * 35);
}

function scoreValue(query: string, value: string) {
  return Math.max(
    scoreExactMatch(query, value),
    scoreStartsWith(query, value),
    scoreContains(query, value),
    scoreWordMatch(query, value),
  );
}

function getNodeSearchValues(node: NavigationNode) {
  return [
    {
      value: node.label,
      matchedBy: "label",
    },
    {
      value: node.description,
      matchedBy: "description",
    },
    {
      value: node.href ?? "",
      matchedBy: "route",
    },
    ...node.keywords.map((keyword) => ({
      value: keyword,
      matchedBy: "keyword",
    })),
  ].filter((item) => item.value.trim().length > 0);
}

function scoreNavigationNode(query: string, node: NavigationNode) {
  const scoredValues = getNodeSearchValues(node).map((item) => ({
    matchedBy: item.matchedBy,
    score: scoreValue(query, item.value),
  }));

  return scoredValues.reduce(
    (best, item) => (item.score > best.score ? item : best),
    {
      matchedBy: "label",
      score: 0,
    },
  );
}

function getContextNode(context?: NavigationSearchContext) {
  if (context?.currentNodeId) {
    return getNavigationNodeById(context.currentNodeId);
  }

  return null;
}

function getBreadcrumbIds(nodeId: string | null | undefined) {
  if (!nodeId) {
    return [];
  }

  return getNavigationBreadcrumb(nodeId).map((node) => node.id);
}

function getChildIds(parentId: string) {
  return NAVIGATION_NODES.filter((node) => node.parentId === parentId).map(
    (node) => node.id,
  );
}

function getSiblingIds(node: NavigationNode) {
  if (!node.parentId) {
    return [];
  }

  return NAVIGATION_NODES.filter(
    (candidate) =>
      candidate.parentId === node.parentId && candidate.id !== node.id,
  ).map((candidate) => candidate.id);
}

function getContextBoost({
  node,
  contextNode,
}: {
  node: NavigationNode;
  contextNode: NavigationNode | null;
}) {
  if (!contextNode) {
    return 0;
  }

  if (node.id === contextNode.id) {
    return 35;
  }

  const contextBreadcrumbIds = getBreadcrumbIds(contextNode.id);
  const nodeBreadcrumbIds = getBreadcrumbIds(node.id);
  const contextChildren = getChildIds(contextNode.id);
  const contextSiblings = getSiblingIds(contextNode);

  if (contextChildren.includes(node.id)) {
    return 28;
  }

  if (contextSiblings.includes(node.id)) {
    return 18;
  }

  if (contextBreadcrumbIds.includes(node.id)) {
    return 16;
  }

  if (nodeBreadcrumbIds.includes(contextNode.id)) {
    return 14;
  }

  const sharedBreadcrumbCount = nodeBreadcrumbIds.filter((id) =>
    contextBreadcrumbIds.includes(id),
  ).length;

  if (sharedBreadcrumbCount >= 3) {
    return 12;
  }

  if (sharedBreadcrumbCount >= 2) {
    return 8;
  }

  if (sharedBreadcrumbCount >= 1) {
    return 4;
  }

  return 0;
}

function getDefaultNavigationResults({
  context,
  limit,
}: {
  context?: NavigationSearchContext;
  limit: number;
}) {
  const contextNode = getContextNode(context);

  if (!contextNode) {
    return NAVIGATION_NODES.slice(0, limit).map((node) => ({
      node,
      score: 1,
      matchedBy: "default",
      contextBoost: 0,
      relationshipBoost: 0,
    }));
  }

  const contextIds = [
    ...getBreadcrumbIds(contextNode.id),
    contextNode.id,
    ...getChildIds(contextNode.id),
    ...getSiblingIds(contextNode),
  ];

  const uniqueIds = Array.from(new Set(contextIds));

  return uniqueIds
    .map((id) => getNavigationNodeById(id))
    .filter((node): node is NavigationNode => Boolean(node))
    .slice(0, limit)
    .map((node) => ({
      node,
      score: getContextBoost({ node, contextNode }),
      matchedBy: "current location",
      contextBoost: getContextBoost({ node, contextNode }),
      relationshipBoost: 0,
    }));
}

function getInjectedRecordKeywords(record: NavigationSearchInjectedRecord) {
  return [
    ...(record.keywords ?? []),
    record.relationshipType ?? "",
    record.sourceLabel ?? "",
    record.targetLabel ?? "",
    String(record.strength ?? ""),
  ].filter((value) => value.trim().length > 0);
}

function createInjectedRecordNode(
  record: NavigationSearchInjectedRecord,
): NavigationNode {
  return {
    id: `metadata-related-${record.id}`,
    label: record.label,
    kind: "record",
    href: record.href,
    parentId: "metadata-record",
    keywords: getInjectedRecordKeywords(record),
    description:
      record.description ??
      [
        "Related metadata record",
        record.relationshipType ? `via ${record.relationshipType}` : "",
      ]
        .filter(Boolean)
        .join(" "),
  };
}

function scoreInjectedRecord({
  query,
  record,
}: {
  query: string;
  record: NavigationSearchInjectedRecord;
}) {
  const values = [
    {
      value: record.label,
      matchedBy: "relationship label",
    },
    {
      value: record.description ?? "",
      matchedBy: "relationship description",
    },
    {
      value: record.relationshipType ?? "",
      matchedBy: "relationship type",
    },
    {
      value: record.sourceLabel ?? "",
      matchedBy: "relationship source",
    },
    {
      value: record.targetLabel ?? "",
      matchedBy: "relationship target",
    },
    ...getInjectedRecordKeywords(record).map((keyword) => ({
      value: keyword,
      matchedBy: "relationship keyword",
    })),
  ].filter((item) => item.value.trim().length > 0);

  return values.reduce(
    (best, item) => {
      const score = scoreValue(query, item.value);

      return score > best.score
        ? {
            score,
            matchedBy: item.matchedBy,
          }
        : best;
    },
    {
      score: 0,
      matchedBy: "relationship",
    },
  );
}

function getRelationshipBoost(record: NavigationSearchInjectedRecord) {
  if (record.strength === null || record.strength === undefined) {
    return 45;
  }

  const numericStrength = Number(record.strength);

  if (Number.isFinite(numericStrength)) {
    return Math.min(70, Math.max(45, Math.round(numericStrength)));
  }

  return 50;
}

function getInjectedRecordResults({
  query,
  context,
}: {
  query: string;
  context?: NavigationSearchContext;
}): NavigationSearchResult[] {
  const relatedRecords = context?.relatedRecords ?? [];

  if (relatedRecords.length === 0) {
    return [];
  }

  return relatedRecords
    .map((record) => {
      const scored = scoreInjectedRecord({
        query,
        record,
      });
      const relationshipBoost = getRelationshipBoost(record);
      const node = createInjectedRecordNode(record);

      return {
        node,
        score: scored.score + relationshipBoost,
        matchedBy:
          scored.score > 0
            ? `${scored.matchedBy} + context`
            : "relationship + context",
        contextBoost: relationshipBoost,
        relationshipBoost,
      };
    })
    .filter((result) => result.score > 0);
}

function sortNavigationSearchResults(
  first: NavigationSearchResult,
  second: NavigationSearchResult,
) {
  if (second.score !== first.score) {
    return second.score - first.score;
  }

  const secondRelationshipBoost = second.relationshipBoost ?? 0;
  const firstRelationshipBoost = first.relationshipBoost ?? 0;

  if (secondRelationshipBoost !== firstRelationshipBoost) {
    return secondRelationshipBoost - firstRelationshipBoost;
  }

  if (second.contextBoost !== first.contextBoost) {
    return second.contextBoost - first.contextBoost;
  }

  return first.node.label.localeCompare(second.node.label);
}

export function searchNavigationNodes(
  query: string,
  limitOrContext: number | NavigationSearchContext = 8,
) {
  const context =
    typeof limitOrContext === "number" ? undefined : limitOrContext;
  const limit =
    typeof limitOrContext === "number" ? limitOrContext : limitOrContext.limit ?? 8;
  const cleanQuery = normalizeSearchText(query);
  const contextNode = getContextNode(context);

  if (!cleanQuery) {
    return getDefaultNavigationResults({
      context,
      limit,
    });
  }

  const staticResults = NAVIGATION_NODES.map((node) => {
    const scored = scoreNavigationNode(cleanQuery, node);
    const contextBoost = getContextBoost({
      node,
      contextNode,
    });

    return {
      node,
      score: scored.score + contextBoost,
      matchedBy:
        contextBoost > 0 && scored.score > 0
          ? `${scored.matchedBy} + context`
          : scored.matchedBy,
      contextBoost,
      relationshipBoost: 0,
    };
  }).filter((result) => result.score > 0);

  const injectedResults = getInjectedRecordResults({
    query: cleanQuery,
    context,
  });

  return [...injectedResults, ...staticResults]
    .sort(sortNavigationSearchResults)
    .slice(0, limit);
}

export function getBestNavigationMatch(
  query: string,
  context?: NavigationSearchContext,
) {
  return searchNavigationNodes(query, {
    ...(context ?? {}),
    limit: 1,
  })[0] ?? null;
}