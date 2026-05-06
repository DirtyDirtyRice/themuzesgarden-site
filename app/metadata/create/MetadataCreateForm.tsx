"use client";

import { useMemo, useState } from "react";

import {
  RECORD_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  VISIBILITY_OPTIONS,
} from "./metadataCreateConfig";

import CreateFormHeader from "./CreateFormHeader";
import CreateFormMissingAlert from "./CreateFormMissingAlert";
import CreateFormNavigation from "./CreateFormNavigation";
import {
  getNextStep,
  getPrevStep,
} from "./createFormStepSystem";
import type { FormStep } from "./createFormStepSystem";
import {
  getStepStatus,
  isStepComplete,
} from "./createFormValidation";
import type { CreateFormValidationInput } from "./createFormValidation";
import MetadataCreateContentSection from "./MetadataCreateContentSection";
import MetadataCreateIdentitySection from "./MetadataCreateIdentitySection";
import MetadataCreatePlacementSection from "./MetadataCreatePlacementSection";
import MetadataCreateRelationshipSection from "./MetadataCreateRelationshipSection";
import MetadataCreateReviewSection from "./MetadataCreateReviewSection";

type VisibilityOption = (typeof VISIBILITY_OPTIONS)[number]["value"];
type RecordTypeOption = (typeof RECORD_TYPE_OPTIONS)[number]["value"];
type RelationshipType = (typeof RELATIONSHIP_OPTIONS)[number]["value"];

type ShelfOption = {
  id: string;
  key?: string;
  label: string;
  description: string;
  sections: {
    id: string;
    key?: string;
    label: string;
  }[];
};

type RelationshipOption = {
  id: string;
  title: string;
  slug: string;
};

type MetadataCreateFormProps = {
  title: string;
  onTitleChange: (value: string) => void;
  selectedShelfId: string;
  onShelfChange: (value: string) => void;
  selectedSectionId: string;
  onSectionChange: (value: string) => void;
  recordType: RecordTypeOption;
  onRecordTypeChange: (value: RecordTypeOption) => void;
  visibility: VisibilityOption;
  onVisibilityChange: (value: VisibilityOption) => void;
  summary: string;
  onSummaryChange: (value: string) => void;
  belongsReason: string;
  onBelongsReasonChange: (value: string) => void;
  relationshipType: RelationshipType;
  onRelationshipTypeChange: (value: RelationshipType) => void;
  relatedRecordId: string;
  onRelatedRecordChange: (value: string) => void;
  shelfOptions: ShelfOption[];
  activeShelfDescription: string;
  activeSections: { id: string; key?: string; label: string }[];
  generatedSlug: string;
  relationshipOptions: RelationshipOption[];
  requiredReadyCount: number;
  hasRelationshipStarter: boolean;
  missingItems: string[];
  canContinue: boolean;
  titleReady: boolean;
  slugReady: boolean;
  summaryReady: boolean;
  belongsReady: boolean;
  activeShelfLabel: string;
  activeSectionLabel: string;
  onFinishReview?: () => void;
};

export default function MetadataCreateForm(props: MetadataCreateFormProps) {
  const [step, setStep] = useState<FormStep>("identity");
  const [attemptedNext, setAttemptedNext] = useState(false);

  const validationInput = useMemo<CreateFormValidationInput>(
    () => ({
      title: props.title,
      selectedShelfId: props.selectedShelfId,
      selectedSectionId: props.selectedSectionId,
      summary: props.summary,
      belongsReason: props.belongsReason,
      titleReady: props.titleReady,
      slugReady: props.slugReady,
      summaryReady: props.summaryReady,
      belongsReady: props.belongsReady,
      canContinue: props.canContinue,
      missingItems: props.missingItems,
    }),
    [
      props.belongsReady,
      props.belongsReason,
      props.canContinue,
      props.missingItems,
      props.selectedSectionId,
      props.selectedShelfId,
      props.slugReady,
      props.summary,
      props.summaryReady,
      props.title,
      props.titleReady,
    ],
  );

  const stepStatus = getStepStatus(step, validationInput);

  function moveToStep(nextStep: FormStep) {
    setAttemptedNext(false);
    setStep(nextStep);
  }

  function scrollToFirstMissing(missing: string[]) {
    const map: Record<string, string> = {
      Title: "title-input",
      Shelf: "shelf-select",
      Section: "section-select",
      Description: "summary-input",
      "Placement reason": "belongs-input",
    };

    for (const item of missing) {
      const id = map[item];
      if (!id) continue;

      const el = document.getElementById(id);
      if (el) {
        const yOffset = -120;
        const y =
          el.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;

        window.scrollTo({
          top: y,
          behavior: "smooth",
        });

        if ("focus" in el) {
          (el as HTMLElement).focus();
        }

        break;
      }
    }
  }

  function handleNext() {
    const freshStatus = getStepStatus(step, validationInput);

    if (!isStepComplete(step, validationInput)) {
      setAttemptedNext(true);

      scrollToFirstMissing(freshStatus.missing);

      return;
    }

    const nextStep = getNextStep(step);

    if (nextStep) {
      moveToStep(nextStep);
      return;
    }

    if (step === "review") {
      props.onFinishReview?.();
    }
  }

  function handleBack() {
    const prevStep = getPrevStep(step);

    if (prevStep) {
      moveToStep(prevStep);
    }
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <CreateFormHeader step={step} status={stepStatus} />

      <div className="mt-5 flex flex-col gap-5">
        <div className={step === "identity" ? "block" : "hidden"}>
          <MetadataCreateIdentitySection {...props} />
        </div>

        <div className={step === "placement" ? "block" : "hidden"}>
          <MetadataCreatePlacementSection {...props} />
        </div>

        <div className={step === "content" ? "block" : "hidden"}>
          <MetadataCreateContentSection {...props} />
        </div>

        <div className={step === "relationship" ? "block" : "hidden"}>
          <MetadataCreateRelationshipSection {...props} />
        </div>

        <div className={step === "review" ? "block" : "hidden"}>
          <MetadataCreateReviewSection
            {...props}
            onContinue={props.onFinishReview}
          />
        </div>
      </div>

      <div className="mt-5">
        {stepStatus.complete ? (
          <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-3">
            <p className="text-sm font-bold text-emerald-100">
              ✓ {stepStatus.doneMessage}
            </p>

            <p className="mt-1 text-xs leading-5 text-emerald-50/75">
              You can press Next.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-yellow-300/25 bg-yellow-300/10 px-3 py-3">
            <p className="text-sm font-bold text-yellow-100">
              {stepStatus.neededMessage}
            </p>

            <p className="mt-1 text-xs leading-5 text-yellow-50/75">
              Missing now: {stepStatus.missing.join(", ")}
            </p>
          </div>
        )}
      </div>

      <CreateFormMissingAlert
        show={attemptedNext && !stepStatus.complete}
        missingItems={stepStatus.missing}
      />

      <CreateFormNavigation
        step={step}
        status={stepStatus}
        onBack={handleBack}
        onNext={handleNext}
      />
    </article>
  );
}