export type MetadataRelationshipStrength =
  | "very-strong"
  | "strong"
  | "medium"
  | "weak"
  | "unknown";

export type MetadataRelationshipDirection =
  | "outgoing"
  | "incoming"
  | "bidirectional"
  | "unknown";

export type MetadataRelationshipSource =
  | "manual"
  | "system"
  | "suggested"
  | "imported"
  | "unknown";

export type MetadataRelationshipInput = {
  id?: string | null;
  sourceRecordId?: string | null;
  sourceSlug?: string | null;
  sourceTitle?: string | null;
  targetRecordId?: string | null;
  targetSlug?: string | null;
  targetTitle?: string | null;
  type?: string | null;
  label?: string | null;
  detail?: string | null;
  note?: string | null;
  reason?: string | null;
  strength?: string | number | null;
  direction?: string | null;
  source?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type NormalizedMetadataRelationship = {
  id: string;
  sourceRecordId: string;
  sourceSlug: string;
  sourceTitle: string;
  targetRecordId: string;
  targetSlug: string;
  targetTitle: string;
  type: string;
  label: string;
  detail: string;
  note: string;
  reason: string;
  strength: MetadataRelationshipStrength;
  strengthScore: number;
  direction: MetadataRelationshipDirection;
  source: MetadataRelationshipSource;
  createdAt: string;
  updatedAt: string;
};

export type MetadataRelationshipGroup = {
  type: string;
  label: string;
  relationships: NormalizedMetadataRelationship[];
  count: number;
  strongestStrength: MetadataRelationshipStrength;
  averageStrengthScore: number;
};

export type MetadataRelationshipGraphNode = {
  id: string;
  slug: string;
  title: string;
  role: "source" | "target" | "both";
  relationshipCount: number;
};

export type MetadataRelationshipGraphEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  type: string;
  strength: MetadataRelationshipStrength;
  strengthScore: number;
  direction: MetadataRelationshipDirection;
};

export type MetadataRelationshipGraph = {
  nodes: MetadataRelationshipGraphNode[];
  edges: MetadataRelationshipGraphEdge[];
};

function cleanText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;

  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned.length > 0 ? cleaned : fallback;
}

function slugifyFallback(value: string) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeId(value: unknown, fallbackSeed: string) {
  const cleaned = cleanText(value);

  if (cleaned) return cleaned;

  const fallback = slugifyFallback(fallbackSeed);
  return fallback || "relationship-unknown";
}

function normalizeRelationshipType(value: unknown) {
  const cleaned = cleanText(value, "related");

  return cleaned
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "related";
}

function formatRelationshipTypeLabel(type: string) {
  return type
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizeRelationshipStrength(
  value: unknown,
): MetadataRelationshipStrength {
  if (typeof value === "number") {
    if (value >= 90) return "very-strong";
    if (value >= 70) return "strong";
    if (value >= 40) return "medium";
    if (value > 0) return "weak";
    return "unknown";
  }

  const cleaned = cleanText(value).toLowerCase();

  if (["very-strong", "very strong", "critical", "core"].includes(cleaned)) {
    return "very-strong";
  }

  if (["strong", "high", "important"].includes(cleaned)) {
    return "strong";
  }

  if (["medium", "moderate", "normal"].includes(cleaned)) {
    return "medium";
  }

  if (["weak", "low", "minor"].includes(cleaned)) {
    return "weak";
  }

  return "unknown";
}

export function getRelationshipStrengthScore(
  strength: MetadataRelationshipStrength,
) {
  if (strength === "very-strong") return 100;
  if (strength === "strong") return 75;
  if (strength === "medium") return 50;
  if (strength === "weak") return 25;
  return 0;
}

export function normalizeRelationshipDirection(
  value: unknown,
): MetadataRelationshipDirection {
  const cleaned = cleanText(value).toLowerCase();

  if (["outgoing", "out", "from"].includes(cleaned)) return "outgoing";
  if (["incoming", "in", "to"].includes(cleaned)) return "incoming";
  if (["bidirectional", "both", "two-way", "two way"].includes(cleaned)) {
    return "bidirectional";
  }

  return "unknown";
}

export function normalizeRelationshipSource(
  value: unknown,
): MetadataRelationshipSource {
  const cleaned = cleanText(value).toLowerCase();

  if (["manual", "user"].includes(cleaned)) return "manual";
  if (["system", "generated", "engine"].includes(cleaned)) return "system";
  if (["suggested", "suggestion", "ai"].includes(cleaned)) return "suggested";
  if (["imported", "import"].includes(cleaned)) return "imported";

  return "unknown";
}

export function normalizeMetadataRelationship(
  input: MetadataRelationshipInput,
): NormalizedMetadataRelationship {
  const sourceTitle = cleanText(input.sourceTitle, "Unknown source");
  const targetTitle = cleanText(input.targetTitle, "Unknown target");
  const sourceSlug = cleanText(input.sourceSlug, slugifyFallback(sourceTitle));
  const targetSlug = cleanText(input.targetSlug, slugifyFallback(targetTitle));
  const type = normalizeRelationshipType(input.type ?? input.label);
  const label = cleanText(input.label, formatRelationshipTypeLabel(type));
  const strength = normalizeRelationshipStrength(input.strength);
  const fallbackIdSeed = `${sourceSlug}-${type}-${targetSlug}`;

  return {
    id: normalizeId(input.id, fallbackIdSeed),
    sourceRecordId: cleanText(input.sourceRecordId, sourceSlug),
    sourceSlug,
    sourceTitle,
    targetRecordId: cleanText(input.targetRecordId, targetSlug),
    targetSlug,
    targetTitle,
    type,
    label,
    detail: cleanText(input.detail),
    note: cleanText(input.note),
    reason: cleanText(input.reason),
    strength,
    strengthScore: getRelationshipStrengthScore(strength),
    direction: normalizeRelationshipDirection(input.direction),
    source: normalizeRelationshipSource(input.source),
    createdAt: cleanText(input.createdAt),
    updatedAt: cleanText(input.updatedAt),
  };
}

export function normalizeMetadataRelationships(
  inputs: MetadataRelationshipInput[],
) {
  return inputs.map((input) => normalizeMetadataRelationship(input));
}

export function groupMetadataRelationshipsByType(
  relationships: NormalizedMetadataRelationship[],
): MetadataRelationshipGroup[] {
  const groups = new Map<string, NormalizedMetadataRelationship[]>();

  relationships.forEach((relationship) => {
    const existing = groups.get(relationship.type) ?? [];
    groups.set(relationship.type, [...existing, relationship]);
  });

  return Array.from(groups.entries())
    .map(([type, items]) => {
      const totalScore = items.reduce(
        (total, item) => total + item.strengthScore,
        0,
      );
      const averageStrengthScore =
        items.length > 0 ? Math.round(totalScore / items.length) : 0;
      const strongest = [...items].sort(
        (first, second) => second.strengthScore - first.strengthScore,
      )[0];

      return {
        type,
        label: formatRelationshipTypeLabel(type),
        relationships: items,
        count: items.length,
        strongestStrength: strongest?.strength ?? "unknown",
        averageStrengthScore,
      };
    })
    .sort((first, second) => {
      if (second.count !== first.count) return second.count - first.count;
      return second.averageStrengthScore - first.averageStrengthScore;
    });
}

function upsertGraphNode(
  nodes: Map<string, MetadataRelationshipGraphNode>,
  id: string,
  slug: string,
  title: string,
  role: MetadataRelationshipGraphNode["role"],
) {
  const existing = nodes.get(id);

  if (!existing) {
    nodes.set(id, {
      id,
      slug,
      title,
      role,
      relationshipCount: 1,
    });
    return;
  }

  nodes.set(id, {
    ...existing,
    role: existing.role === role ? role : "both",
    relationshipCount: existing.relationshipCount + 1,
  });
}

export function buildMetadataRelationshipGraph(
  relationships: NormalizedMetadataRelationship[],
): MetadataRelationshipGraph {
  const nodes = new Map<string, MetadataRelationshipGraphNode>();
  const edges: MetadataRelationshipGraphEdge[] = [];

  relationships.forEach((relationship) => {
    upsertGraphNode(
      nodes,
      relationship.sourceRecordId,
      relationship.sourceSlug,
      relationship.sourceTitle,
      "source",
    );

    upsertGraphNode(
      nodes,
      relationship.targetRecordId,
      relationship.targetSlug,
      relationship.targetTitle,
      "target",
    );

    edges.push({
      id: relationship.id,
      sourceId: relationship.sourceRecordId,
      targetId: relationship.targetRecordId,
      label: relationship.label,
      type: relationship.type,
      strength: relationship.strength,
      strengthScore: relationship.strengthScore,
      direction: relationship.direction,
    });
  });

  return {
    nodes: Array.from(nodes.values()).sort(
      (first, second) => second.relationshipCount - first.relationshipCount,
    ),
    edges: edges.sort(
      (first, second) => second.strengthScore - first.strengthScore,
    ),
  };
}

export function summarizeMetadataRelationships(
  relationships: NormalizedMetadataRelationship[],
) {
  const groups = groupMetadataRelationshipsByType(relationships);
  const graph = buildMetadataRelationshipGraph(relationships);

  return {
    totalRelationships: relationships.length,
    totalGroups: groups.length,
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    strongestRelationship:
      relationships
        .slice()
        .sort((first, second) => second.strengthScore - first.strengthScore)[0] ??
      null,
    groups,
    graph,
  };
}