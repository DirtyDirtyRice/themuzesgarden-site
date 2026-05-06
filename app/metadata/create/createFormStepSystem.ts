export type FormStep =
  | "identity"
  | "placement"
  | "content"
  | "relationship"
  | "review";

export const STEP_ORDER: FormStep[] = [
  "identity",
  "placement",
  "content",
  "relationship",
  "review",
];

export const STEP_LABELS: Record<FormStep, string> = {
  identity: "Title & Identity *",
  placement: "Placement & Reason *",
  content: "Description *",
  relationship: "Relationship",
  review: "Review & Create *",
};

export const STEP_HELP: Record<FormStep, string> = {
  identity: "Choose the record type, enter the title, and confirm the slug.",
  placement:
    "Choose the shelf and section, then explain why it belongs there.",
  content:
    "Description * is required. Use one clear rule: the description is done when the Description status says ready.",
  relationship:
    "Optional step. Add a connection if it helps, or press Next to review.",
  review: "Confirm the required fields are complete, then continue to Save.",
};

export const STEP_REQUIREMENT_COPY: Record<FormStep, string> = {
  identity: "Title * is required before moving forward.",
  placement: "Placement reason * is required before moving forward.",
  content: "Description * is required before moving forward.",
  relationship: "Relationship is optional. No required fields on this step.",
  review: "All required fields must be complete before saving.",
};

export function getStepIndex(step: FormStep) {
  return STEP_ORDER.indexOf(step);
}

export function getNextStep(step: FormStep): FormStep | null {
  const index = getStepIndex(step);
  return STEP_ORDER[index + 1] ?? null;
}

export function getPrevStep(step: FormStep): FormStep | null {
  const index = getStepIndex(step);
  return STEP_ORDER[index - 1] ?? null;
}

export function isRequiredStep(step: FormStep) {
  return step !== "relationship";
}

export function getForwardButtonText(step: FormStep) {
  if (step === "review") return "Continue to Save";
  return "Next";
}

export function getStepProgressLabel(step: FormStep) {
  return `Step ${getStepIndex(step) + 1} of ${STEP_ORDER.length}`;
}