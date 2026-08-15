const SAFE_MEMBER_DESTINATIONS = new Set([
  "/workspace",
  "/workspace/projects",
  "/library",
]);

export function memberSignInDestination(search: string): string {
  const requested = new URLSearchParams(search).get("next") ?? "";
  return SAFE_MEMBER_DESTINATIONS.has(requested) ? requested : "/workspace";
}
