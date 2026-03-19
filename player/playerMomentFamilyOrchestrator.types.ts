export type FamilyOrchestratorState = {
  familyId: string

  outcomeScore: number | null
  learningScore: number | null
  optimizationScore: number | null
  repairScore: number | null

  outcomeLabel: string | null
  learningLabel: string | null
  optimizationLabel: string | null
  repairLabel: string | null
}

export type RunFamilyOrchestratorParams = {
  familyId: string

  outcomeScore?: number | null
  learningScore?: number | null
  optimizationScore?: number | null
  repairScore?: number | null

  outcomeLabel?: string | null
  learningLabel?: string | null
  optimizationLabel?: string | null
  repairLabel?: string | null
}