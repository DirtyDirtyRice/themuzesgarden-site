import type { RelatedRecordSignal } from "./relationshipExplorerTypes";

export function getConfidenceLabel(confidence: string) {
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  return "Low confidence";
}

export function getConfidenceDescription(confidence: string) {
  if (confidence === "high") {
    return "Several signals agree, so this card is probably close to the active record.";
  }

  if (confidence === "medium") {
    return "Enough signals match to make this useful for nearby exploration.";
  }

  return "This is a lighter suggestion that may still reveal a useful connection.";
}

export function getSignalStrengthSentence(signal: RelatedRecordSignal | null) {
  if (!signal) return "No strongest relationship signal has been found yet.";

  if (signal.score >= 90) {
    return "This is a very strong match because multiple relationship signals agree.";
  }

  if (signal.score >= 55) {
    return "This is a strong match and should be useful for exploring nearby meaning.";
  }

  if (signal.score >= 45) {
    return "This is a useful match based on one clear relationship signal.";
  }

  return "This is a light match that may still help widen the relationship map.";
}