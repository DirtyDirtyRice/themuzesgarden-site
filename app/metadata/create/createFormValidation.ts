import type { FormStep } from "./createFormStepSystem";

export type CreateFormValidationInput = {
  title: string;
  selectedShelfId: string;
  selectedSectionId: string;
  summary: string;
  belongsReason: string;
  titleReady: boolean;
  slugReady: boolean;
  summaryReady: boolean;
  belongsReady: boolean;
  canContinue: boolean;
  missingItems: string[];
};

export type StepStatus = {
  complete: boolean;
  missing: string[];
  doneMessage: string;
  neededMessage: string;
};

export function cleanCreateFormText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function hasMinimumWords(value: string, minimumWords: number) {
  const words = cleanCreateFormText(value)
    .split(" ")
    .filter(Boolean);

  return words.length >= minimumWords;
}

function getDuplicateTitleMessage(input: CreateFormValidationInput) {
  const duplicateMessage = input.missingItems.find((item) => {
    const normalizedItem = item.toLowerCase();

    return (
      normalizedItem.includes("already been used") ||
      normalizedItem.includes("already exists")
    );
  });

  return duplicateMessage ?? "";
}

function isTitleComplete(input: CreateFormValidationInput) {
  return input.titleReady;
}

function isPlacementComplete(input: CreateFormValidationInput) {
  return (
    Boolean(input.selectedShelfId) &&
    Boolean(input.selectedSectionId) &&
    (input.belongsReady || hasMinimumWords(input.belongsReason, 5))
  );
}

function isDescriptionComplete(input: CreateFormValidationInput) {
  return input.summaryReady || hasMinimumWords(input.summary, 7);
}

function uniqueItems(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

export function getMissingForStep(
  step: FormStep,
  input: CreateFormValidationInput,
) {
  if (step === "identity") {
    if (isTitleComplete(input)) return [];

    const duplicateTitleMessage = getDuplicateTitleMessage(input);

    if (duplicateTitleMessage) {
      return [duplicateTitleMessage];
    }

    return ["Title"];
  }

  if (step === "placement") {
    const missing: string[] = [];

    if (!input.selectedShelfId) missing.push("Shelf");
    if (!input.selectedSectionId) missing.push("Section");
    if (!isPlacementComplete(input)) missing.push("Why this belongs here");

    return uniqueItems(missing);
  }

  if (step === "content") {
    return isDescriptionComplete(input) ? [] : ["Description"];
  }

  if (step === "review") {
    return uniqueItems(input.missingItems);
  }

  return [];
}

export function isStepComplete(
  step: FormStep,
  input: CreateFormValidationInput,
) {
  if (step === "identity") return isTitleComplete(input);
  if (step === "placement") return isPlacementComplete(input);
  if (step === "content") return isDescriptionComplete(input);
  if (step === "review") return input.canContinue;

  return true;
}

export function getStepStatus(
  step: FormStep,
  input: CreateFormValidationInput,
): StepStatus {
  const missing = getMissingForStep(step, input);
  const complete = isStepComplete(step, input);

  if (step === "relationship") {
    return {
      complete: true,
      missing: [],
      doneMessage: "Optional step. You can continue.",
      neededMessage: "Relationship is optional.",
    };
  }

  return {
    complete,
    missing,
    doneMessage: getDoneMessage(step),
    neededMessage: getNeededMessage(missing),
  };
}

export function getGlobalMissingItems(input: CreateFormValidationInput) {
  return uniqueItems(input.missingItems);
}

export function formatMissingItems(items: string[]) {
  if (items.length === 0) return "None";

  return items.map((item) => `${item} *`).join(", ");
}

function getDoneMessage(step: FormStep) {
  if (step === "identity") return "Title is complete.";
  if (step === "placement") return "Placement is complete.";
  if (step === "content") return "Description is complete.";
  if (step === "review") return "Required fields are complete.";

  return "Step complete.";
}

function getNeededMessage(missing: string[]) {
  if (missing.length === 0) return "Required fields complete.";

  return `Required fields still needed: ${formatMissingItems(missing)}`;
}