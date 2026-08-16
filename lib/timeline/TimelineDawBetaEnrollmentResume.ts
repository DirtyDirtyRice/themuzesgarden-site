export type TimelineDawBetaEnrollmentResumeRow = {
  id: string;
  session_id: string;
  project_id: string;
  state: string;
  acknowledgement_version: string | null;
  environment: Record<string, boolean> | null;
  created_at: string;
};

export function selectTimelineDawBetaEnrollmentToResume(rows: TimelineDawBetaEnrollmentResumeRow[]) {
  return rows
    .filter((row) => row.state === "active")
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))[0] ?? null;
}

export function timelineDawBetaEnrollmentProgress(row: TimelineDawBetaEnrollmentResumeRow) {
  return {
    acknowledged: Boolean(row.acknowledgement_version),
    environmentReady: Boolean(row.environment) && Object.values(row.environment ?? {}).every(Boolean),
  };
}
