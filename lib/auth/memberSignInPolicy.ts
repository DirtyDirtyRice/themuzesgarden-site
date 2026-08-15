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

export function memberRecoveryEmailError(email: string): string | null {
  const cleanEmail = email.trim();
  return cleanEmail && cleanEmail.includes("@")
    ? null
    : "Enter the email address for your existing owner account.";
}

export function memberRecoveryRedirect(origin: string): string {
  const url = new URL(origin);
  return `${url.origin}/members/reset-password`;
}

export function memberNewPasswordError(
  password: string,
  confirmation: string,
): string | null {
  if (password.length < 8) return "New password must contain at least 8 characters.";
  if (password !== confirmation) return "The two new-password entries do not match.";
  return null;
}
