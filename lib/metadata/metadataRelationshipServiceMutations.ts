import type { MetadataRelationshipInput } from "./metadataRelationshipEngine";
import {
  createManyMetadataRelationships,
  createMetadataRelationship,
  createValidMetadataRelationships,
  deleteManyMetadataRelationships,
  deleteMetadataRelationship,
  updateMetadataRelationship,
} from "./metadataRelationshipMutations";
import type {
  MetadataRelationshipBatchMutationResult,
  MetadataRelationshipMutationClient,
  MetadataRelationshipMutationResult,
} from "./metadataRelationshipMutations";
import {
  clearCacheForSlug,
  clearCacheForSlugs,
  clearMetadataRelationshipServiceCache,
  getRelationshipServiceGlobalCacheSlug,
} from "./metadataRelationshipServiceCache";

function getRelationshipInputCacheSlugs(input: MetadataRelationshipInput) {
  return [input.sourceSlug, input.targetSlug];
}

function getRelationshipInputsCacheSlugs(inputs: MetadataRelationshipInput[]) {
  return inputs.flatMap((input) => getRelationshipInputCacheSlugs(input));
}

function clearRelationshipCacheForInputs(inputs: MetadataRelationshipInput[]) {
  clearCacheForSlugs([
    getRelationshipServiceGlobalCacheSlug(),
    ...getRelationshipInputsCacheSlugs(inputs),
  ]);
}

function clearRelationshipCacheForInput(input: MetadataRelationshipInput) {
  clearRelationshipCacheForInputs([input]);
}

function clearRelationshipCacheAfterInputMutation<
  TResult extends
    | MetadataRelationshipMutationResult
    | MetadataRelationshipBatchMutationResult,
>(result: TResult, inputs: MetadataRelationshipInput[]) {
  if (result.ok) {
    clearRelationshipCacheForInputs(inputs);
  }

  return result;
}

function clearRelationshipCacheAfterUnknownSlugMutation<
  TResult extends
    | MetadataRelationshipMutationResult
    | MetadataRelationshipBatchMutationResult,
>(result: TResult) {
  if (result.ok) {
    clearMetadataRelationshipServiceCache();
  }

  return result;
}

export async function createRelationshipThroughService({
  client,
  input,
  tableName,
}: {
  client: MetadataRelationshipMutationClient;
  input: MetadataRelationshipInput;
  tableName?: string;
}): Promise<MetadataRelationshipMutationResult> {
  const result = await createMetadataRelationship({ client, input, tableName });

  return clearRelationshipCacheAfterInputMutation(result, [input]);
}

export async function createRelationshipsThroughService({
  client,
  inputs,
  tableName,
}: {
  client: MetadataRelationshipMutationClient;
  inputs: MetadataRelationshipInput[];
  tableName?: string;
}): Promise<MetadataRelationshipBatchMutationResult> {
  const result = await createManyMetadataRelationships({
    client,
    inputs,
    tableName,
  });

  return clearRelationshipCacheAfterInputMutation(result, inputs);
}

export async function createValidRelationshipsThroughService({
  client,
  inputs,
  tableName,
}: {
  client: MetadataRelationshipMutationClient;
  inputs: MetadataRelationshipInput[];
  tableName?: string;
}): Promise<MetadataRelationshipBatchMutationResult> {
  const result = await createValidMetadataRelationships({
    client,
    inputs,
    tableName,
  });

  return clearRelationshipCacheAfterInputMutation(result, inputs);
}

export async function updateRelationshipThroughService({
  client,
  relationshipId,
  input,
  tableName,
}: {
  client: MetadataRelationshipMutationClient;
  relationshipId: string;
  input: MetadataRelationshipInput;
  tableName?: string;
}): Promise<MetadataRelationshipMutationResult> {
  const result = await updateMetadataRelationship({
    client,
    relationshipId,
    input,
    tableName,
  });

  return clearRelationshipCacheAfterInputMutation(result, [input]);
}

export async function deleteRelationshipThroughService({
  client,
  relationshipId,
  tableName,
}: {
  client: MetadataRelationshipMutationClient;
  relationshipId: string;
  tableName?: string;
}): Promise<MetadataRelationshipMutationResult> {
  const result = await deleteMetadataRelationship({
    client,
    relationshipId,
    tableName,
  });

  return clearRelationshipCacheAfterUnknownSlugMutation(result);
}

export async function deleteRelationshipsThroughService({
  client,
  relationshipIds,
  tableName,
}: {
  client: MetadataRelationshipMutationClient;
  relationshipIds: string[];
  tableName?: string;
}): Promise<MetadataRelationshipBatchMutationResult> {
  const result = await deleteManyMetadataRelationships({
    client,
    relationshipIds,
    tableName,
  });

  return clearRelationshipCacheAfterUnknownSlugMutation(result);
}