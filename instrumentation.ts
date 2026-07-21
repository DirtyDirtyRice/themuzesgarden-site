export async function register(): Promise<void> {
  if (process.env.NODE_ENV !== "development" || process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startWorkspaceRuntimeSupervisor } = await import(
    "./lib/developer-workspace/workspaceRuntimeSupervisor"
  );
  startWorkspaceRuntimeSupervisor(undefined, "instrumentation");
}
