export type FamilyRepairSignals = {
  repairDrift: boolean
  repairStructure: boolean
  repairRepeat: boolean
  repairStability: boolean
}

export type FamilyRepairResult = {
  familyId: string

  repairScore: number | null

  signals: FamilyRepairSignals

  repairLabel:
    | "major-repair"
    | "moderate-repair"
    | "minor-repair"
    | "stable"
    | null

  reasons: string[]
}

export type BuildFamilyRepairParams = {
  familyId: string

  driftSeverity?: number | null
  stabilityScore?: number | null

  adjustPlanning?: boolean
  avoidStrategy?: boolean

  learningScore?: number | null
  optimizationScore?: number | null
}