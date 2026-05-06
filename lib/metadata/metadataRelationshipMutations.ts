import {
  metadataRelationshipInputToDbInsertPayload,
  metadataRelationshipInputToDbUpdatePayload,
  validateRelationshipDbPayload,
} from "./metadataRelationshipAdapter";
import type {
  MetadataRelationshipDbInsertPayload,
  MetadataRelationshipDbRow,
  MetadataRelationshipDbUpdatePayload,
} from "./metadataRelationshipAdapter";
import type { MetadataRelationshipInput } from "./metadataRelationshipEngine";

export type MetadataRelationshipMutationClient = {
  from: (tableName: string) => {
    insert: (
      payload: MetadataRelationshipDbInsertPayload,
    ) => {
      select: () => {
        single: () => Promise<{
          data: MetadataRelationshipDbRow | null;
          error: { message?: string } | null;
        }>;
      };
    };
    update: (
      payload: MetadataRelationshipDbUpdatePayload,
    ) => {
      eq: (
        column: string,
        value: string,
      ) => {
        select: () => {
          single: () => Promise<{
            data: MetadataRelationshipDbRow | null;
            error: { message?: string } | null;
          }>;
        };
      };
    };
    delete: () => {
      eq: (
        column: string,
        value: string,
      ) => Promise<{
        data: MetadataRelationshipDbRow[] | null;
        error: { message?: string } | null;
      }>;
    };
  };
};

export type MetadataRelationshipMutationResult = {
  ok: boolean;
  action: "create" | "update" | "delete";
  data: MetadataRelationshipDbRow | MetadataRelationshipDbRow[] | null;
  error: string | null;
};

export type MetadataRelationshipBatchMutationResult = {
  ok: boolean;
  results: MetadataRelationshipMutationResult[];
  attemptedCount: number;
  succeededCount: number;
  failedCount: number;
  skippedCount: number;
};

const DEFAULT_RELATIONSHIP_TABLE = "metadata_relationships";

function getMutationErrorMessage(error: { message?: string } | null) {
  return error?.message ?? "Unknown relationship mutation error";
}

function cleanMutationText(value: string) {
  return value.trim();
}

function uniqueCleanMutationTexts(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => cleanMutationText(value))
        .filter((value) => value.length > 0),
    ),
  );
}

function validateInsertPayloadOrReturnError(
  payload: MetadataRelationshipDbInsertPayload,
): string | null {
  const validation = validateRelationshipDbPayload(payload);

  if (validation.valid) return null;

  return `Missing relationship fields: ${validation.missingFields.join(", ")}`;
}

function createMutationResult({
  ok,
  action,
  data,
  error,
}: MetadataRelationshipMutationResult): MetadataRelationshipMutationResult {
  return {
    ok,
    action,
    data,
    error,
  };
}

function createBatchMutationResult({
  results,
  attemptedCount,
  skippedCount,
}: {
  results: MetadataRelationshipMutationResult[];
  attemptedCount: number;
  skippedCount: number;
}): MetadataRelationshipBatchMutationResult {
  const succeededCount = results.filter((result) => result.ok).length;
  const failedCount = results.filter((result) => !result.ok).length;

  return {
    ok: failedCount === 0,
    results,
    attemptedCount,
    succeededCount,
    failedCount,
    skippedCount,
  };
}

export async function createMetadataRelationship({
  client,
  input,
  tableName = DEFAULT_RELATIONSHIP_TABLE,
}: {
  client: MetadataRelationshipMutationClient;
  input: MetadataRelationshipInput;
  tableName?: string;
}): Promise<MetadataRelationshipMutationResult> {
  const payload = metadataRelationshipInputToDbInsertPayload(input);
  const validationError = validateInsertPayloadOrReturnError(payload);

  if (validationError) {
    return createMutationResult({
      ok: false,
      action: "create",
      data: null,
      error: validationError,
    });
  }

  const { data, error } = await client
    .from(tableName)
    .insert(payload)
    .select()
    .single();

  if (error) {
    return createMutationResult({
      ok: false,
      action: "create",
      data: null,
      error: getMutationErrorMessage(error),
    });
  }

  return createMutationResult({
    ok: true,
    action: "create",
    data,
    error: null,
  });
}

export async function updateMetadataRelationship({
  client,
  relationshipId,
  input,
  tableName = DEFAULT_RELATIONSHIP_TABLE,
}: {
  client: MetadataRelationshipMutationClient;
  relationshipId: string;
  input: MetadataRelationshipInput;
  tableName?: string;
}): Promise<MetadataRelationshipMutationResult> {
  const cleanRelationshipId = cleanMutationText(relationshipId);

  if (!cleanRelationshipId) {
    return createMutationResult({
      ok: false,
      action: "update",
      data: null,
      error: "Missing relationship id for update",
    });
  }

  const payload = metadataRelationshipInputToDbUpdatePayload(input);

  const { data, error } = await client
    .from(tableName)
    .update(payload)
    .eq("id", cleanRelationshipId)
    .select()
    .single();

  if (error) {
    return createMutationResult({
      ok: false,
      action: "update",
      data: null,
      error: getMutationErrorMessage(error),
    });
  }

  return createMutationResult({
    ok: true,
    action: "update",
    data,
    error: null,
  });
}

export async function deleteMetadataRelationship({
  client,
  relationshipId,
  tableName = DEFAULT_RELATIONSHIP_TABLE,
}: {
  client: MetadataRelationshipMutationClient;
  relationshipId: string;
  tableName?: string;
}): Promise<MetadataRelationshipMutationResult> {
  const cleanRelationshipId = cleanMutationText(relationshipId);

  if (!cleanRelationshipId) {
    return createMutationResult({
      ok: false,
      action: "delete",
      data: null,
      error: "Missing relationship id for delete",
    });
  }

  const { data, error } = await client
    .from(tableName)
    .delete()
    .eq("id", cleanRelationshipId);

  if (error) {
    return createMutationResult({
      ok: false,
      action: "delete",
      data: null,
      error: getMutationErrorMessage(error),
    });
  }

  return createMutationResult({
    ok: true,
    action: "delete",
    data,
    error: null,
  });
}

export async function createManyMetadataRelationships({
  client,
  inputs,
  tableName = DEFAULT_RELATIONSHIP_TABLE,
}: {
  client: MetadataRelationshipMutationClient;
  inputs: MetadataRelationshipInput[];
  tableName?: string;
}): Promise<MetadataRelationshipBatchMutationResult> {
  const results: MetadataRelationshipMutationResult[] = [];

  for (const input of inputs) {
    results.push(
      await createMetadataRelationship({
        client,
        input,
        tableName,
      }),
    );
  }

  return createBatchMutationResult({
    results,
    attemptedCount: inputs.length,
    skippedCount: 0,
  });
}

export async function createValidMetadataRelationships({
  client,
  inputs,
  tableName = DEFAULT_RELATIONSHIP_TABLE,
}: {
  client: MetadataRelationshipMutationClient;
  inputs: MetadataRelationshipInput[];
  tableName?: string;
}): Promise<MetadataRelationshipBatchMutationResult> {
  const results: MetadataRelationshipMutationResult[] = [];
  let skippedCount = 0;

  for (const input of inputs) {
    const payload = metadataRelationshipInputToDbInsertPayload(input);
    const validationError = validateInsertPayloadOrReturnError(payload);

    if (validationError) {
      skippedCount += 1;
      continue;
    }

    results.push(
      await createMetadataRelationship({
        client,
        input,
        tableName,
      }),
    );
  }

  return createBatchMutationResult({
    results,
    attemptedCount: inputs.length,
    skippedCount,
  });
}

export async function deleteManyMetadataRelationships({
  client,
  relationshipIds,
  tableName = DEFAULT_RELATIONSHIP_TABLE,
}: {
  client: MetadataRelationshipMutationClient;
  relationshipIds: string[];
  tableName?: string;
}): Promise<MetadataRelationshipBatchMutationResult> {
  const cleanRelationshipIds = uniqueCleanMutationTexts(relationshipIds);
  const results: MetadataRelationshipMutationResult[] = [];

  for (const relationshipId of cleanRelationshipIds) {
    results.push(
      await deleteMetadataRelationship({
        client,
        relationshipId,
        tableName,
      }),
    );
  }

  return createBatchMutationResult({
    results,
    attemptedCount: relationshipIds.length,
    skippedCount: relationshipIds.length - cleanRelationshipIds.length,
  });
}