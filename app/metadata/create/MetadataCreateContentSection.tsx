type DescriptionReadiness = {
  trimmedDescription: string;
  wordCount: number;
  characterCount: number;
  hasText: boolean;
  hasEnoughWords: boolean;
  hasEnoughCharacters: boolean;
  isReady: boolean;
  missingMessage: string;
};

function RequiredStar() {
  return <span className="ml-1 text-2xl font-bold text-yellow-300">*</span>;
}

function getDescriptionReadiness(
  summary: string,
  summaryReady: boolean,
): DescriptionReadiness {
  const trimmedDescription = summary.trim();
  const words = trimmedDescription.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const characterCount = trimmedDescription.length;
  const hasText = characterCount > 0;
  const hasEnoughWords = wordCount >= 7;
  const hasEnoughCharacters = characterCount >= 40;
  const isReady = summaryReady && hasEnoughWords && hasEnoughCharacters;

  if (!hasText) {
    return {
      trimmedDescription,
      wordCount,
      characterCount,
      hasText,
      hasEnoughWords,
      hasEnoughCharacters,
      isReady,
      missingMessage: "Description is empty. Add at least 7 meaningful words.",
    };
  }

  if (!hasEnoughWords && !hasEnoughCharacters) {
    return {
      trimmedDescription,
      wordCount,
      characterCount,
      hasText,
      hasEnoughWords,
      hasEnoughCharacters,
      isReady,
      missingMessage:
        "Description needs more detail: at least 7 words and 40 characters.",
    };
  }

  if (!hasEnoughWords) {
    return {
      trimmedDescription,
      wordCount,
      characterCount,
      hasText,
      hasEnoughWords,
      hasEnoughCharacters,
      isReady,
      missingMessage: "Description needs at least 7 meaningful words.",
    };
  }

  if (!hasEnoughCharacters) {
    return {
      trimmedDescription,
      wordCount,
      characterCount,
      hasText,
      hasEnoughWords,
      hasEnoughCharacters,
      isReady,
      missingMessage: "Description needs at least 40 characters.",
    };
  }

  if (!summaryReady) {
    return {
      trimmedDescription,
      wordCount,
      characterCount,
      hasText,
      hasEnoughWords,
      hasEnoughCharacters,
      isReady,
      missingMessage:
        "Description text looks ready here, but the form has not accepted it yet. Press Done with Description.",
    };
  }

  return {
    trimmedDescription,
    wordCount,
    characterCount,
    hasText,
    hasEnoughWords,
    hasEnoughCharacters,
    isReady,
    missingMessage: "",
  };
}

function getRequirementClass(done: boolean) {
  if (done) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  }

  return "border-amber-400/40 bg-amber-400/10 text-amber-100";
}

function RequirementPill({
  label,
  done,
}: {
  label: string;
  done: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between rounded-lg border px-4 py-3 text-base",
        getRequirementClass(done),
      ].join(" ")}
    >
      <span>{label}</span>
      <span className="font-bold tracking-[0.14em]">
        {done ? "DONE" : "NOT DONE"}
      </span>
    </div>
  );
}

export default function MetadataCreateContentSection({
  summary,
  onSummaryChange,
  summaryReady,
}: {
  summary: string;
  onSummaryChange: (value: string) => void;
  summaryReady: boolean;
}) {
  const descriptionReadiness = getDescriptionReadiness(summary, summaryReady);

  return (
    <div
      className={[
        "rounded-2xl border p-4 transition",
        descriptionReadiness.isReady
          ? "border-white/10 bg-black/30"
          : "border-yellow-300/50 bg-yellow-300/10 shadow-[0_0_0_1px_rgba(253,224,71,0.16)]",
      ].join(" ")}
    >
      <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <p className="text-lg font-semibold text-white">
          Description readiness
        </p>

        <p className="mt-1 text-lg leading-7 text-white/80">
          The Description step now uses the same rule as the final validation:
          at least 7 words and at least 40 characters.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <label
          htmlFor="record-summary"
          className="text-2xl font-semibold text-white"
        >
          Description
          <RequiredStar />
        </label>

        <p className="text-lg leading-7 text-white/80">
          Write what this record is, why it matters, and what kind of knowledge
          it holds. When the checklist below says DONE, press Done with
          Description.
        </p>

        <textarea
          id="record-summary"
          value={summary}
          onChange={(event) => onSummaryChange(event.target.value)}
          placeholder="Explain what this record is, why it matters, and what kind of knowledge it holds."
          rows={6}
          className="rounded-xl border border-white/10 bg-black px-4 py-4 text-lg text-white outline-none transition placeholder:text-white/35 focus:border-white/30"
        />

        <div className="mt-2 rounded-xl border border-white/10 bg-black px-3 py-3">
          <p className="text-lg font-semibold text-white">
            Description required checks
          </p>

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <RequirementPill
              label={`${descriptionReadiness.wordCount} / 7 words`}
              done={descriptionReadiness.hasEnoughWords}
            />

            <RequirementPill
              label={`${descriptionReadiness.characterCount} / 40 characters`}
              done={descriptionReadiness.hasEnoughCharacters}
            />

            <RequirementPill
              label="Form accepted"
              done={descriptionReadiness.isReady}
            />
          </div>
        </div>

        <p
          className={[
            "rounded-lg border px-4 py-3 text-xl font-semibold leading-7",
            descriptionReadiness.isReady
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
              : "border-amber-400/40 bg-amber-400/10 text-amber-100",
          ].join(" ")}
        >
          {descriptionReadiness.isReady
            ? "Description is ready. Press Done with Description to continue."
            : `Finish required field first: Description * — ${descriptionReadiness.missingMessage}`}
        </p>

        <p className="text-base leading-6 text-white/60">
          This removes the old temporary double-entry warning. If this field is
          still blocked, the checklist above shows the exact reason.
        </p>
      </div>
    </div>
  );
}