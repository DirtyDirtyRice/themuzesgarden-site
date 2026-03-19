import {
  buildFamilyPortfolio,
  buildFamilyPortfolioItem,
} from "./playerMomentFamilyPortfolio.builders";

import type {
  BuildFamilyPortfolioItemParams,
  BuildFamilyPortfolioParams,
  FamilyPortfolioHealth,
  FamilyPortfolioItem,
  FamilyPortfolioReason,
  FamilyPortfolioResult,
  FamilyPortfolioTier,
} from "./playerMomentFamilyPortfolio.types";

/*
Family Portfolio Engine — Public API

This file exposes the stable entry points for the Family Portfolio Engine
while keeping builder internals private.
*/

export type {
  BuildFamilyPortfolioItemParams,
  BuildFamilyPortfolioParams,
  FamilyPortfolioHealth,
  FamilyPortfolioItem,
  FamilyPortfolioReason,
  FamilyPortfolioResult,
  FamilyPortfolioTier,
} from "./playerMomentFamilyPortfolio.types";

export function buildMomentFamilyPortfolioItem(
  params: BuildFamilyPortfolioItemParams
): FamilyPortfolioItem {
  return buildFamilyPortfolioItem(params);
}

export function buildMomentFamilyPortfolio(
  params: BuildFamilyPortfolioParams
): FamilyPortfolioResult {
  return buildFamilyPortfolio(params);
}