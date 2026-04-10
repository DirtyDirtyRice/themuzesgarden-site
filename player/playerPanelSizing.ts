export const PLAYER_EDGE_GAP_PX = 24;
export const PLAYER_COMPACT_WIDTH_PX = 320;
export const PLAYER_FULL_WIDTH_PX = 420;
export const PLAYER_MIN_RESPONSIVE_WIDTH_PX = 280;
export const PLAYER_RESERVE_BREAKPOINT_PX = 1024;

export function getPlayerPanelWidthPx(
  compact: boolean,
  viewportWidth: number
): number {
  const targetWidth = compact ? PLAYER_COMPACT_WIDTH_PX : PLAYER_FULL_WIDTH_PX;
  const maxByViewport = Math.floor(viewportWidth * 0.92);

  return Math.max(
    PLAYER_MIN_RESPONSIVE_WIDTH_PX,
    Math.min(targetWidth, maxByViewport)
  );
}

export function getReservedRightSpacePx(
  open: boolean,
  compact: boolean,
  viewportWidth: number
): number {
  if (!open) return 0;
  if (viewportWidth < PLAYER_RESERVE_BREAKPOINT_PX) return 0;

  return getPlayerPanelWidthPx(compact, viewportWidth) + PLAYER_EDGE_GAP_PX;
}