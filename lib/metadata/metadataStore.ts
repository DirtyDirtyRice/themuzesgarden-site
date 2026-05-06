import type { MetadataEntry, MetadataLink } from "./metadataTypes";

let workingMetadataRegistry: MetadataEntry[] = [];
let workingMetadataLinks: MetadataLink[] = [];

export function getWorkingMetadataRegistry(): MetadataEntry[] {
  return workingMetadataRegistry.slice();
}

export function setWorkingMetadataRegistry(entries: MetadataEntry[]) {
  workingMetadataRegistry = Array.isArray(entries) ? entries.slice() : [];
  return getWorkingMetadataRegistry();
}

export function replaceWorkingMetadataEntry(entry: MetadataEntry) {
  const id = String(entry?.id ?? "").trim();
  if (!id) return getWorkingMetadataRegistry();

  const next = workingMetadataRegistry.slice();
  const index = next.findIndex((m) => String(m?.id ?? "").trim() === id);

  if (index === -1) {
    next.push(entry);
  } else {
    next[index] = entry;
  }

  workingMetadataRegistry = next;
  return getWorkingMetadataRegistry();
}

/* =========================
   LINKS
========================= */

export function getWorkingMetadataLinks(): MetadataLink[] {
  return workingMetadataLinks.slice();
}

export function setWorkingMetadataLinks(links: MetadataLink[]) {
  workingMetadataLinks = Array.isArray(links) ? links.slice() : [];
  return getWorkingMetadataLinks();
}

export function replaceWorkingMetadataLink(link: MetadataLink) {
  const id = String(link?.id ?? "").trim();
  if (!id) return getWorkingMetadataLinks();

  const next = workingMetadataLinks.slice();
  const index = next.findIndex((l) => String(l?.id ?? "").trim() === id);

  if (index === -1) {
    next.push(link);
  } else {
    next[index] = link;
  }

  workingMetadataLinks = next;
  return getWorkingMetadataLinks();
}

export function removeWorkingMetadataLink(id: string) {
  const clean = String(id ?? "").trim();
  if (!clean) return getWorkingMetadataLinks();

  workingMetadataLinks = workingMetadataLinks.filter(
    (l) => String(l?.id ?? "").trim() !== clean
  );

  return getWorkingMetadataLinks();
}