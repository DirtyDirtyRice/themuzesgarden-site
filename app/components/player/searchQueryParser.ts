import type { AnyTrack } from "./playerTypes";
import type { SearchMatchedMoment } from "./searchTabHelpers";

export type ParsedSearchQuery = {
  freeText: string[];
  title: string[];
  artist: string[];
  tag: string[];
  moment: string[];
  hasMomentOnly: boolean;
  excludeFreeText: string[];
  excludeTitle: string[];
  excludeArtist: string[];
  excludeTag: string[];
  excludeMoment: string[];
  requireFreeText: string[];
  requireTitle: string[];
  requireArtist: string[];
  requireTag: string[];
  requireMoment: string[];
};

function normalizeToken(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function includesNormalized(value: unknown, query: string): boolean {
  const cleanValue = normalizeToken(value);
  const cleanQuery = normalizeToken(query);
  if (!cleanQuery) return true;
  return cleanValue.includes(cleanQuery);
}

function tokenizeQuery(input: string): string[] {
  const source = String(input ?? "").trim();
  if (!source) return [];

  const tokens: string[] = [];
  const regex = /[+\-]?[^\s",]+:"[^"]*"|[+\-]?"[^"]*"|,|[^\s,]+/g;
  const matches = source.match(regex) ?? [];

  for (const raw of matches) {
    const clean = String(raw ?? "").trim();
    if (!clean) continue;
    tokens.push(clean);
  }

  return tokens;
}

function stripWrappedQuotes(value: string): string {
  const clean = String(value ?? "").trim();
  if (clean.startsWith('"') && clean.endsWith('"') && clean.length >= 2) {
    return clean.slice(1, -1).trim();
  }
  return clean;
}

function getOperatorValue(token: string, prefix: string): string {
  return stripWrappedQuotes(token.slice(prefix.length)).trim();
}

function pushNormalized(target: string[], value: string) {
  const clean = normalizeToken(value);
  if (clean && !target.includes(clean)) target.push(clean);
}

function isOrToken(token: string): boolean {
  const clean = normalizeToken(token);
  return clean === "or" || clean === ",";
}

function anyMatches(values: string[], predicate: (value: string) => boolean): boolean {
  if (!values.length) return true;
  return values.some(predicate);
}

function allMatches(values: string[], predicate: (value: string) => boolean): boolean {
  if (!values.length) return true;
  return values.every(predicate);
}

export function parseSearchQuery(input: string): ParsedSearchQuery {
  const tokens = tokenizeQuery(input);

  const free: string[] = [];
  const title: string[] = [];
  const artist: string[] = [];
  const tag: string[] = [];
  const moment: string[] = [];

  const excludeFree: string[] = [];
  const excludeTitle: string[] = [];
  const excludeArtist: string[] = [];
  const excludeTag: string[] = [];
  const excludeMoment: string[] = [];

  const requireFree: string[] = [];
  const requireTitle: string[] = [];
  const requireArtist: string[] = [];
  const requireTag: string[] = [];
  const requireMoment: string[] = [];

  let hasMomentOnly = false;

  for (const rawToken of tokens) {
    const token = String(rawToken ?? "").trim();
    if (!token || isOrToken(token)) continue;

    const isNegated = token.startsWith("-");
    const isRequired = token.startsWith("+");
    const body = isNegated || isRequired ? token.slice(1) : token;
    const lowered = normalizeToken(body);

    if (!isNegated && !isRequired && (lowered === "has:moment" || lowered === "has:moments")) {
      hasMomentOnly = true;
      continue;
    }

    if (lowered.startsWith('title:"') || lowered.startsWith("title:")) {
      const value = getOperatorValue(body, "title:");
      if (isNegated) pushNormalized(excludeTitle, value);
      else if (isRequired) pushNormalized(requireTitle, value);
      else pushNormalized(title, value);
      continue;
    }

    if (lowered.startsWith('artist:"') || lowered.startsWith("artist:")) {
      const value = getOperatorValue(body, "artist:");
      if (isNegated) pushNormalized(excludeArtist, value);
      else if (isRequired) pushNormalized(requireArtist, value);
      else pushNormalized(artist, value);
      continue;
    }

    if (lowered.startsWith('tag:"') || lowered.startsWith("tag:")) {
      const value = getOperatorValue(body, "tag:");
      if (isNegated) pushNormalized(excludeTag, value);
      else if (isRequired) pushNormalized(requireTag, value);
      else pushNormalized(tag, value);
      continue;
    }

    if (lowered.startsWith('moment:"') || lowered.startsWith("moment:")) {
      const value = getOperatorValue(body, "moment:");
      if (isNegated) pushNormalized(excludeMoment, value);
      else if (isRequired) pushNormalized(requireMoment, value);
      else pushNormalized(moment, value);
      continue;
    }

    const freeValue = stripWrappedQuotes(body);
    if (freeValue) {
      if (isNegated) pushNormalized(excludeFree, freeValue);
      else if (isRequired) pushNormalized(requireFree, freeValue);
      else pushNormalized(free, freeValue);
    }
  }

  return {
    freeText: free,
    title,
    artist,
    tag,
    moment,
    hasMomentOnly,
    excludeFreeText: excludeFree,
    excludeTitle,
    excludeArtist,
    excludeTag,
    excludeMoment,
    requireFreeText: requireFree,
    requireTitle,
    requireArtist,
    requireTag,
    requireMoment,
  };
}

export function getEffectiveSearchQuery(parsed: ParsedSearchQuery): string {
  return (
    parsed.requireFreeText[0] ??
    parsed.requireTitle[0] ??
    parsed.requireArtist[0] ??
    parsed.requireTag[0] ??
    parsed.requireMoment[0] ??
    parsed.freeText[0] ??
    parsed.title[0] ??
    parsed.artist[0] ??
    parsed.tag[0] ??
    parsed.moment[0] ??
    ""
  );
}

export function getPreferredDiscoverySeed(parsed: ParsedSearchQuery): string {
  return (
    parsed.requireTag[0] ??
    parsed.tag[0] ??
    getEffectiveSearchQuery(parsed)
  );
}

export function getPreferredMomentSeed(parsed: ParsedSearchQuery): string {
  return (
    parsed.requireMoment[0] ??
    parsed.moment[0] ??
    getEffectiveSearchQuery(parsed)
  );
}

export function rowMatchesParsedQuery(params: {
  track: AnyTrack;
  tags: string[];
  matchedMoments: SearchMatchedMoment[];
  parsed: ParsedSearchQuery;
  hasAnyMoments: boolean;
}): boolean {
  const { track, tags, matchedMoments, parsed, hasAnyMoments } = params;

  if (parsed.hasMomentOnly && !hasAnyMoments) return false;

  if (!anyMatches(parsed.title, (value) => includesNormalized(track?.title, value))) {
    return false;
  }

  if (!anyMatches(parsed.artist, (value) => includesNormalized(track?.artist, value))) {
    return false;
  }

  if (
    !anyMatches(parsed.tag, (value) =>
      tags.some((tag) => includesNormalized(tag, value))
    )
  ) {
    return false;
  }

  if (
    !anyMatches(parsed.moment, (value) =>
      matchedMoments.some((moment) => includesNormalized(moment.label, value))
    )
  ) {
    return false;
  }

  if (
    !allMatches(parsed.requireTitle, (value) =>
      includesNormalized(track?.title, value)
    )
  ) {
    return false;
  }

  if (
    !allMatches(parsed.requireArtist, (value) =>
      includesNormalized(track?.artist, value)
    )
  ) {
    return false;
  }

  if (
    !allMatches(parsed.requireTag, (value) =>
      tags.some((tag) => includesNormalized(tag, value))
    )
  ) {
    return false;
  }

  if (
    !allMatches(parsed.requireMoment, (value) =>
      matchedMoments.some((moment) => includesNormalized(moment.label, value))
    )
  ) {
    return false;
  }

  if (
    !allMatches(parsed.requireFreeText, (value) => {
      const titleHit = includesNormalized(track?.title, value);
      const artistHit = includesNormalized(track?.artist, value);
      const tagHit = tags.some((tag) => includesNormalized(tag, value));
      const momentHit = matchedMoments.some((moment) =>
        includesNormalized(moment.label, value)
      );
      return titleHit || artistHit || tagHit || momentHit;
    })
  ) {
    return false;
  }

  if (parsed.excludeTitle.some((value) => includesNormalized(track?.title, value))) {
    return false;
  }

  if (parsed.excludeArtist.some((value) => includesNormalized(track?.artist, value))) {
    return false;
  }

  if (
    parsed.excludeTag.some((value) =>
      tags.some((tag) => includesNormalized(tag, value))
    )
  ) {
    return false;
  }

  if (
    parsed.excludeMoment.some((value) =>
      matchedMoments.some((moment) => includesNormalized(moment.label, value))
    )
  ) {
    return false;
  }

  if (
    parsed.excludeFreeText.some((value) => {
      const titleHit = includesNormalized(track?.title, value);
      const artistHit = includesNormalized(track?.artist, value);
      const tagHit = tags.some((tag) => includesNormalized(tag, value));
      const momentHit = matchedMoments.some((moment) =>
        includesNormalized(moment.label, value)
      );
      return titleHit || artistHit || tagHit || momentHit;
    })
  ) {
    return false;
  }

  return true;
}