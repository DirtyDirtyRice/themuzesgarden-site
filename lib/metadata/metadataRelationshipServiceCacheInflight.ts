import type { MetadataRelationshipServiceResult } from "./metadataRelationshipServiceResults";
import {
  RELATIONSHIP_SERVICE_REFRESH_COOLDOWN_MS,
  logRelationshipServiceCacheEvent,
} from "./metadataRelationshipServiceCacheConfig";

export const relationshipServiceInflightRequests = new Map<
  string,
  Promise<MetadataRelationshipServiceResult>
>();
export const relationshipServiceRefreshCooldowns = new Map<string, number>();

export function pruneRelationshipServiceRefreshCooldowns() {
  const now = Date.now();

  relationshipServiceRefreshCooldowns.forEach((cooldownUntil, cacheKey) => {
    if (cooldownUntil <= now) {
      relationshipServiceRefreshCooldowns.delete(cacheKey);
    }
  });
}

export function canRefreshRelationshipServiceCacheKey(cacheKey: string) {
  const cooldownUntil = relationshipServiceRefreshCooldowns.get(cacheKey);

  if (!cooldownUntil) {
    return true;
  }

  if (cooldownUntil <= Date.now()) {
    relationshipServiceRefreshCooldowns.delete(cacheKey);
    return true;
  }

  return false;
}

export function markRelationshipServiceCacheRefreshCooldown(cacheKey: string) {
  relationshipServiceRefreshCooldowns.set(
    cacheKey,
    Date.now() + RELATIONSHIP_SERVICE_REFRESH_COOLDOWN_MS,
  );
}

export function getInflightRelationshipServiceRequest(cacheKey: string) {
  return relationshipServiceInflightRequests.get(cacheKey) ?? null;
}

export function setInflightRelationshipServiceRequest(
  cacheKey: string,
  request: Promise<MetadataRelationshipServiceResult>,
) {
  relationshipServiceInflightRequests.set(cacheKey, request);

  request.finally(() => {
    if (relationshipServiceInflightRequests.get(cacheKey) === request) {
      relationshipServiceInflightRequests.delete(cacheKey);
    }
  });

  logRelationshipServiceCacheEvent("inflight-set", cacheKey);

  return request;
}

export function getOrSetInflightRelationshipServiceRequest(
  cacheKey: string,
  createRequest: () => Promise<MetadataRelationshipServiceResult>,
) {
  const existingRequest = getInflightRelationshipServiceRequest(cacheKey);

  if (existingRequest) {
    logRelationshipServiceCacheEvent("inflight-hit", cacheKey);
    return existingRequest;
  }

  return setInflightRelationshipServiceRequest(cacheKey, createRequest());
}

export function deleteRelationshipServiceInflightState(cacheKey: string) {
  relationshipServiceInflightRequests.delete(cacheKey);
  relationshipServiceRefreshCooldowns.delete(cacheKey);
}

export function getRelationshipServiceInflightStats() {
  pruneRelationshipServiceRefreshCooldowns();

  return {
    inflightRequests: relationshipServiceInflightRequests.size,
    refreshCooldowns: relationshipServiceRefreshCooldowns.size,
  };
}

export function clearRelationshipServiceInflightState() {
  relationshipServiceInflightRequests.clear();
  relationshipServiceRefreshCooldowns.clear();
}