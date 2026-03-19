export type FamilyOptimizationSignals = {
  reinforceFamily: boolean
  reuseFamily: boolean
  repairFamily: boolean
  avoidFamily: boolean
}

export type FamilyOptimizationResult = {
  familyId: string

  optimizationScore: number | null

  signals: FamilyOptimizationSignals

  optimizationLabel:
    | "strong-reinforce"
    | "reinforce"
    | "neutral"
    | "repair"
    | "avoid"
    | null

  reasons: string[]
}

export type BuildFamilyOptimizationParams = {
  familyId: string

  learningScore?: number | null

  reinforceStrategy?: boolean
  reinforceStructure?: boolean
  reinforceRepeat?: boolean

  adjustPlanning?: boolean
  avoidStrategy?: boolean

  trustScore?: number | null
  stabilityScore?: number | null
}
