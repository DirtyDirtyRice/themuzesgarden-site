import type { MetadataRelationshipDbRow } from "./metadataRelationshipAdapter";

export type MetadataRelationshipQueryError = {
  message?: string;
};

export type MetadataRelationshipQueryClient = {
  from: (tableName: string) => {
    select: (columns?: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        order: (
          column: string,
          options?: { ascending?: boolean },
        ) => Promise<{
          data: MetadataRelationshipDbRow[] | null;
          error: MetadataRelationshipQueryError | null;
        }>;
      };
      order: (
        column: string,
        options?: { ascending?: boolean },
      ) => Promise<{
        data: MetadataRelationshipDbRow[] | null;
        error: MetadataRelationshipQueryError | null;
      }>;
      limit: (
        count: number,
      ) => Promise<{
        data: MetadataRelationshipDbRow[] | null;
        error: MetadataRelationshipQueryError | null;
      }>;
    };
  };
};

export type MetadataRelationshipQueryResult = {
  ok: boolean;
  rows: MetadataRelationshipDbRow[];
  error: string | null;
};

export type MetadataRelationshipRecordQueryResult =
  MetadataRelationshipQueryResult & {
    outgoingRows: MetadataRelationshipDbRow[];
    incomingRows: MetadataRelationshipDbRow[];
  };

const DEFAULT_RELATIONSHIP_TABLE = "metadata_relationships";
const DEFAULT_SELECT_COLUMNS = "*";

function getQueryErrorMessage(error: MetadataRelationshipQueryError | null) {
  return error?.message ?? "Unknown metadata relationship query error";
}

function createQueryResult({
  ok,
  rows,
  error,
}: MetadataRelationshipQueryResult): MetadataRelationshipQueryResult {
  return {
    ok,
    rows,
    error,
  };
}

function createRecordQueryResult({
  ok,
  rows,
  outgoingRows,
  incomingRows,
  error,
}: MetadataRelationshipRecordQueryResult): MetadataRelationshipRecordQueryResult {
  return {
    ok,
    rows,
    outgoingRows,
    incomingRows,
    error,
  };
}

function cleanQueryText(value: string) {
  return value.trim();
}

function cleanQueryTexts(values: string[]) {
  return values
    .map((value) => cleanQueryText(value))
    .filter((value) => value.length > 0);
}

function mergeRelationshipRows(
  firstRows: MetadataRelationshipDbRow[],
  secondRows: MetadataRelationshipDbRow[],
) {
  const mergedRows: MetadataRelationshipDbRow[] = [];
  const seenKeys = new Set<string>();

  [...firstRows, ...secondRows].forEach((row, index) => {
    const id = String(row.id ?? "").trim();
    const fallbackKey = [
      row.source_slug,
      row.target_slug,
      row.relationship_type ?? row.type,
      row.label,
      index,
    ]
      .map((value) => String(value ?? "").trim())
      .join("::");

    const key = id || fallbackKey;

    if (seenKeys.has(key)) {
      return;
    }

    seenKeys.add(key);
    mergedRows.push(row);
  });

  return mergedRows;
}

function combineQueryErrors(errors: Array<string | null>) {
  const messages = errors.filter((message): message is string =>
    Boolean(message),
  );

  return messages.length > 0 ? messages.join(" | ") : null;
}

export function hasMetadataRelationshipRows(
  result: MetadataRelationshipQueryResult,
) {
  return result.ok && result.rows.length > 0;
}

export async function fetchAllMetadataRelationships({
  client,
  tableName = DEFAULT_RELATIONSHIP_TABLE,
  columns = DEFAULT_SELECT_COLUMNS,
  orderBy = "created_at",
  ascending = false,
}: {
  client: MetadataRelationshipQueryClient;
  tableName?: string;
  columns?: string;
  orderBy?: string;
  ascending?: boolean;
}): Promise<MetadataRelationshipQueryResult> {
  const { data, error } = await client
    .from(tableName)
    .select(columns)
    .order(orderBy, { ascending });

  if (error) {
    return createQueryResult({
      ok: false,
      rows: [],
      error: getQueryErrorMessage(error),
    });
  }

  return createQueryResult({
    ok: true,
    rows: data ?? [],
    error: null,
  });
}

export async function fetchMetadataRelationshipsBySourceSlug({
  client,
  sourceSlug,
  tableName = DEFAULT_RELATIONSHIP_TABLE,
  columns = DEFAULT_SELECT_COLUMNS,
  orderBy = "created_at",
  ascending = false,
}: {
  client: MetadataRelationshipQueryClient;
  sourceSlug: string;
  tableName?: string;
  columns?: string;
  orderBy?: string;
  ascending?: boolean;
}): Promise<MetadataRelationshipQueryResult> {
  const cleanSourceSlug = cleanQueryText(sourceSlug);

  if (!cleanSourceSlug) {
    return createQueryResult({
      ok: false,
      rows: [],
      error: "Missing source slug for relationship query",
    });
  }

  const { data, error } = await client
    .from(tableName)
    .select(columns)
    .eq("source_slug", cleanSourceSlug)
    .order(orderBy, { ascending });

  if (error) {
    return createQueryResult({
      ok: false,
      rows: [],
      error: getQueryErrorMessage(error),
    });
  }

  return createQueryResult({
    ok: true,
    rows: data ?? [],
    error: null,
  });
}

export async function fetchMetadataRelationshipsByTargetSlug({
  client,
  targetSlug,
  tableName = DEFAULT_RELATIONSHIP_TABLE,
  columns = DEFAULT_SELECT_COLUMNS,
  orderBy = "created_at",
  ascending = false,
}: {
  client: MetadataRelationshipQueryClient;
  targetSlug: string;
  tableName?: string;
  columns?: string;
  orderBy?: string;
  ascending?: boolean;
}): Promise<MetadataRelationshipQueryResult> {
  const cleanTargetSlug = cleanQueryText(targetSlug);

  if (!cleanTargetSlug) {
    return createQueryResult({
      ok: false,
      rows: [],
      error: "Missing target slug for relationship query",
    });
  }

  const { data, error } = await client
    .from(tableName)
    .select(columns)
    .eq("target_slug", cleanTargetSlug)
    .order(orderBy, { ascending });

  if (error) {
    return createQueryResult({
      ok: false,
      rows: [],
      error: getQueryErrorMessage(error),
    });
  }

  return createQueryResult({
    ok: true,
    rows: data ?? [],
    error: null,
  });
}

export async function fetchMetadataRelationshipsForRecordSlug({
  client,
  recordSlug,
  tableName = DEFAULT_RELATIONSHIP_TABLE,
  columns = DEFAULT_SELECT_COLUMNS,
  orderBy = "created_at",
  ascending = false,
}: {
  client: MetadataRelationshipQueryClient;
  recordSlug: string;
  tableName?: string;
  columns?: string;
  orderBy?: string;
  ascending?: boolean;
}): Promise<MetadataRelationshipRecordQueryResult> {
  const cleanRecordSlug = cleanQueryText(recordSlug);

  if (!cleanRecordSlug) {
    return createRecordQueryResult({
      ok: false,
      rows: [],
      outgoingRows: [],
      incomingRows: [],
      error: "Missing record slug for relationship network query",
    });
  }

  const outgoingResult = await fetchMetadataRelationshipsBySourceSlug({
    client,
    sourceSlug: cleanRecordSlug,
    tableName,
    columns,
    orderBy,
    ascending,
  });

  const incomingResult = await fetchMetadataRelationshipsByTargetSlug({
    client,
    targetSlug: cleanRecordSlug,
    tableName,
    columns,
    orderBy,
    ascending,
  });

  const rows = mergeRelationshipRows(outgoingResult.rows, incomingResult.rows);
  const error = combineQueryErrors([outgoingResult.error, incomingResult.error]);

  return createRecordQueryResult({
    ok: outgoingResult.ok || incomingResult.ok,
    rows,
    outgoingRows: outgoingResult.rows,
    incomingRows: incomingResult.rows,
    error,
  });
}

export async function fetchMetadataRelationshipsBySourceSlugs({
  client,
  sourceSlugs,
  tableName = DEFAULT_RELATIONSHIP_TABLE,
  columns = DEFAULT_SELECT_COLUMNS,
  orderBy = "created_at",
  ascending = false,
}: {
  client: MetadataRelationshipQueryClient;
  sourceSlugs: string[];
  tableName?: string;
  columns?: string;
  orderBy?: string;
  ascending?: boolean;
}): Promise<MetadataRelationshipQueryResult> {
  const cleanSourceSlugs = cleanQueryTexts(sourceSlugs);

  if (cleanSourceSlugs.length === 0) {
    return createQueryResult({
      ok: false,
      rows: [],
      error: "Missing source slugs for relationship query",
    });
  }

  const results = await Promise.all(
    cleanSourceSlugs.map((sourceSlug) =>
      fetchMetadataRelationshipsBySourceSlug({
        client,
        sourceSlug,
        tableName,
        columns,
        orderBy,
        ascending,
      }),
    ),
  );

  return createQueryResult({
    ok: results.some((result) => result.ok),
    rows: results.reduce<MetadataRelationshipDbRow[]>(
      (mergedRows, result) => mergeRelationshipRows(mergedRows, result.rows),
      [],
    ),
    error: combineQueryErrors(results.map((result) => result.error)),
  });
}

export async function fetchRecentMetadataRelationships({
  client,
  limit = 25,
  tableName = DEFAULT_RELATIONSHIP_TABLE,
  columns = DEFAULT_SELECT_COLUMNS,
}: {
  client: MetadataRelationshipQueryClient;
  limit?: number;
  tableName?: string;
  columns?: string;
}): Promise<MetadataRelationshipQueryResult> {
  const safeLimit = Math.max(1, Math.min(limit, 100));

  const { data, error } = await client
    .from(tableName)
    .select(columns)
    .limit(safeLimit);

  if (error) {
    return createQueryResult({
      ok: false,
      rows: [],
      error: getQueryErrorMessage(error),
    });
  }

  return createQueryResult({
    ok: true,
    rows: data ?? [],
    error: null,
  });
}