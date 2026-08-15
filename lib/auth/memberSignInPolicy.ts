const SAFE_MEMBER_DESTINATIONS = new Set([
  "/workspace",
  "/workspace/projects",
  "/library",
]);

export function memberSignInDestination(search: string): string {
  const requested = new URLSearchParams(search).get("next") ?? "";
  return SAFE_MEMBER_DESTINATIONS.has(requested) ? requested : "/workspace";
}

export function memberSignInErrorMessage(message: string): string {
  if (message.trim().toLowerCase().includes("invalid login credentials")) {
    return "That email and password do not match the existing owner account. Check them and try again, or open the public Library without signing in.";
  }
  return message.trim() || "Member authentication failed.";
}
