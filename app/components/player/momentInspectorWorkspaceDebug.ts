export function logWorkspaceData(label: string, data: any) {
  if (typeof window === "undefined") return;

  try {
    console.log(`[Workspace Debug] ${label}`, data);
  } catch {}
}