import {
  RECORD_TYPE_OPTIONS,
  VISIBILITY_OPTIONS,
} from "./metadataCreateConfig";
import { getFieldStatusMessage } from "./metadataCreateUtils";

type VisibilityOption = (typeof VISIBILITY_OPTIONS)[number]["value"];
type RecordTypeOption = (typeof RECORD_TYPE_OPTIONS)[number]["value"];

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
  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="record-type"
              className="text-sm font-semibold text-white"
            >
              Record type
            </label>

            <p className="text-sm leading-6 text-white/65">
              Choose the kind of knowledge object this record is becoming. This
              helps the system grow with intention instead of vague names.
            </p>

            <select
              id="record-type"
              value={recordType}
              onChange={(event) =>
                onRecordTypeChange(event.target.value as RecordTypeOption)
              }
              className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
            >
              {RECORD_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <p className="text-xs text-white/45">
              Record type helps define how this entry should behave later.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Type guidance
            </p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              A concept explains an idea, a person explains a human source, a
              work points to a song or piece, a tool points to something used,
              and a structure helps describe how pieces fit together.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="record-title"
            className="text-sm font-semibold text-white"
          >
            Record title
          </label>

          <p className="text-sm leading-6 text-white/65">
            Give the record a real name. This should identify a concept, person,
            work, structure, tool, technique, or another real knowledge unit.
          </p>

          <input
            id="record-title"
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Example: Groove Density"
            className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/30"
          />

          <p className="text-xs text-white/45">
            {getFieldStatusMessage(
              titleReady,
              "Title looks real enough to continue using.",
              "Title still needs to become a real record name."
            )}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="record-visibility"
              className="text-sm font-semibold text-white"
            >
              Visibility
            </label>

            <p className="text-sm leading-6 text-white/65">
              Choose how this record should be treated in the future system.
            </p>

            <select
              id="record-visibility"
              value={visibility}
              onChange={(event) =>
                onVisibilityChange(event.target.value as VisibilityOption)
              }
              className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <p className="text-xs text-white/45">
              Public is library-open, private is restricted, shared is selective
              access.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="record-slug"
              className="text-sm font-semibold text-white"
            >
              Slug preview
            </label>

            <p className="text-sm leading-6 text-white/65">
              This shows how the URL path would look if the record were created
              from the current title and pushed into the structural output
              model.
            </p>

            <div
              id="record-slug"
              className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white/85"
            >
              {generatedSlug ? `/metadata/${generatedSlug}` : "/metadata/"}
            </div>

            <p className="text-xs text-white/45">
              {getFieldStatusMessage(
                slugReady,
                "Slug is clean enough for a future record path.",
                "Slug is not ready yet because the title is still too weak."
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}