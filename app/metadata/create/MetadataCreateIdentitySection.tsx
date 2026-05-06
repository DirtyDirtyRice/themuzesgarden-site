import {
  RECORD_TYPE_OPTIONS,
  VISIBILITY_OPTIONS,
} from "./metadataCreateConfig";
import { getFieldStatusMessage } from "./metadataCreateUtils";

type VisibilityOption = (typeof VISIBILITY_OPTIONS)[number]["value"];
type RecordTypeOption = (typeof RECORD_TYPE_OPTIONS)[number]["value"];

function RequiredStar() {
  return (
    <span className="ml-1 text-2xl font-bold text-yellow-300">*</span>
  );
}

function isDuplicateTitleBlocked({
  title,
  titleReady,
  generatedSlug,
  slugReady,
}: {
  title: string;
  titleReady: boolean;
  generatedSlug: string;
  slugReady: boolean;
}) {
  return title.trim().length >= 3 && Boolean(generatedSlug) && slugReady && !titleReady;
}

export default function MetadataCreateIdentitySection({
  recordType,
  onRecordTypeChange,
  title,
  onTitleChange,
  titleReady,
  visibility,
  onVisibilityChange,
  generatedSlug,
  slugReady,
}: {
  recordType: RecordTypeOption;
  onRecordTypeChange: (value: RecordTypeOption) => void;
  title: string;
  onTitleChange: (value: string) => void;
  titleReady: boolean;
  visibility: VisibilityOption;
  onVisibilityChange: (value: VisibilityOption) => void;
  generatedSlug: string;
  slugReady: boolean;
}) {
  const duplicateTitleBlocked = isDuplicateTitleBlocked({
    title,
    titleReady,
    generatedSlug,
    slugReady,
  });

  const titleNeedsAttention = !titleReady || duplicateTitleBlocked;

  return (
    <>
      {/* TITLE FIRST */}
      <div
        className={[
          "rounded-2xl border p-4 transition",
          titleNeedsAttention
            ? "border-yellow-300/50 bg-yellow-300/10 shadow-[0_0_0_1px_rgba(253,224,71,0.16)]"
            : "border-white/10 bg-black/30",
        ].join(" ")}
      >
        <div className="flex flex-col gap-4">
          <label
            htmlFor="record-title"
            className="text-2xl font-semibold text-white"
          >
            Record title
            <RequiredStar />
          </label>

          <p className="text-lg leading-7 text-white/80">
            Give the record a real name. This should identify a concept, person,
            work, structure, tool, technique, or another real knowledge unit.
          </p>

          <input
            id="record-title"
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Example: Groove Density"
            className={[
              "rounded-xl border bg-black px-4 py-4 text-lg text-white outline-none transition placeholder:text-white/35 focus:border-white/30",
              duplicateTitleBlocked ? "border-red-400/50" : "border-white/10",
            ].join(" ")}
          />

          {duplicateTitleBlocked ? (
            <p className="text-xl font-semibold text-red-300">
              Sorry, this title has already been used.
            </p>
          ) : (
            <p className="text-xl font-semibold text-yellow-200">
              {getFieldStatusMessage(
                titleReady,
                "Title looks real enough to continue using.",
                "Finish required field first: Title *"
              )}
            </p>
          )}
        </div>
      </div>

      {/* RECORD TYPE */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <label
              htmlFor="record-type"
              className="text-xl font-semibold text-white"
            >
              Record type
            </label>

            <p className="text-lg leading-7 text-white/80">
              Choose the kind of knowledge object this record is becoming.
            </p>

            <select
              id="record-type"
              value={recordType}
              onChange={(event) =>
                onRecordTypeChange(event.target.value as RecordTypeOption)
              }
              className="rounded-xl border border-white/10 bg-black px-4 py-4 text-lg text-white outline-none transition focus:border-white/30"
            >
              {RECORD_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <p className="text-base leading-6 text-white/70">
              Record type helps define behavior later.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black p-4">
            <p className="text-base font-semibold uppercase tracking-[0.18em] text-white/65">
              Type guidance
            </p>
            <p className="mt-2 text-lg leading-7 text-white/80">
              A concept explains an idea, a person explains a human source, a
              work points to a song or piece, a tool points to something used,
              and a structure helps describe how pieces fit together.
            </p>
          </div>
        </div>
      </div>

      {/* VISIBILITY + SLUG */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <label
              htmlFor="record-visibility"
              className="text-xl font-semibold text-white"
            >
              Visibility
            </label>

            <p className="text-lg leading-7 text-white/80">
              Choose how this record should be treated.
            </p>

            <select
              id="record-visibility"
              value={visibility}
              onChange={(event) =>
                onVisibilityChange(event.target.value as VisibilityOption)
              }
              className="rounded-xl border border-white/10 bg-black px-4 py-4 text-lg text-white outline-none transition focus:border-white/30"
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <p className="text-base leading-6 text-white/70">
              Public = open, private = restricted.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <label
              htmlFor="record-slug"
              className="text-xl font-semibold text-white"
            >
              Slug preview
            </label>

            <p className="text-lg leading-7 text-white/80">
              URL path preview based on title.
            </p>

            <div
              id="record-slug"
              className="rounded-xl border border-white/10 bg-black px-4 py-4 text-lg text-white/90"
            >
              {generatedSlug ? `/metadata/${generatedSlug}` : "/metadata/"}
            </div>

            <p className="text-base leading-6 text-white/70">
              {getFieldStatusMessage(
                slugReady,
                "Slug is clean.",
                "Slug is not ready yet."
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}