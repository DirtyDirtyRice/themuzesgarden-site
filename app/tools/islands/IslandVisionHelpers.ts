// app/tools/islands/IslandVisionHelpers.ts

import type {
  IslandWorkspaceToolCategory,
  IslandWorkspacePrinciple,
} from "./IslandVisionTypes";

export function sortToolCategories(
  categories: IslandWorkspaceToolCategory[]
): IslandWorkspaceToolCategory[] {
  return [...categories].sort((a, b) =>
    a.title.localeCompare(b.title)
  );
}

export function sortPrinciples(
  principles: IslandWorkspacePrinciple[]
): IslandWorkspacePrinciple[] {
  return [...principles].sort((a, b) =>
    a.title.localeCompare(b.title)
  );
}

export function countTools(
  categories: IslandWorkspaceToolCategory[]
): number {
  return categories.reduce(
    (total, category) => total + category.tools.length,
    0
  );
}

export function countCategories(
  categories: IslandWorkspaceToolCategory[]
): number {
  return categories.length;
}

export function buildToolSummary(
  categories: IslandWorkspaceToolCategory[]
): string {
  const categoryCount = countCategories(categories);
  const toolCount = countTools(categories);

  return `${categoryCount} categories • ${toolCount} tools`;
}

export function buildPrincipleSummary(
  principles: IslandWorkspacePrinciple[]
): string {
  return `${principles.length} guiding principles`;
}