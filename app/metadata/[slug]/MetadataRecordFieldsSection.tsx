type MetadataFieldValue = string | number | boolean | string[];

type MetadataFieldLike = {
  id?: string | number | null;
  label?: string | null;
  value?: MetadataFieldValue | null;
};

type NormalizedField = MetadataFieldLike & {
  displayLabel: string;
  displayValue: string;
  valueKind: string;
};

type MetadataRecordFieldsSectionProps = {
  fields: unknown[];
};

function isMetadataFieldValue(value: unknown): value is MetadataFieldValue {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

function asFieldObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
}

function getValueKind(value: MetadataFieldValue | null | undefined) {
  if (Array.isArray(value)) return "List";
  if (typeof value === "boolean") return "Yes / No";
  if (typeof value === "number") return "Number";
  if (typeof value === "string") return "Text";
  return "Empty";
}

function renderFieldValue(value: MetadataFieldValue | null | undefined) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.trim() || "Empty";
  return "Empty";
}

function normalizeField(value: unknown, index: number): NormalizedField {
  const field = asFieldObject(value);
  const rawValue = field.value;
  const safeValue = isMetadataFieldValue(rawValue) ? rawValue : null;
  const label =
    typeof field.label === "string" && field.label.trim()
      ? field.label.trim()
      : `Field ${index + 1}`;

  return {
    id:
      typeof field.id === "string" || typeof field.id === "number"
        ? field.id
        : `metadata-field-${index}`,
    label,
    value: safeValue,
    displayLabel: label,
    displayValue: renderFieldValue(safeValue),
    valueKind: getValueKind(safeValue),
  };
}

function getFieldKey(field: NormalizedField, index: number) {
  const id = String(field.id ?? "").trim();
  if (id) return id;
  return `metadata-field-${index}`;
}

function FieldSummaryPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/[0.04] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-white/95">{value}</p>
    </div>
  );
}

function MetadataFieldCard({ field }: { field: NormalizedField }) {
  return (
    <article className="rounded-xl border border-white/20 bg-white/[0.04] p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
          {field.displayLabel}
        </p>

        <span className="shrink-0 rounded-lg border border-white/20 px-2 py-1 text-[10px] font-bold text-white/75">
          {field.valueKind}
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-white/90">
        {field.displayValue}
      </p>
    </article>
  );
}

function EmptyFieldsState() {
  return (
    <div className="rounded-xl border border-white/20 bg-white/[0.04] p-3">
      <p className="text-sm font-black text-white/95">No fields yet.</p>

      <p className="mt-1 text-sm leading-6 text-white/80">
        Deeper structured metadata will appear here when this record has saved
        detail fields.
      </p>
    </div>
  );
}

function getFieldKindCount(fields: NormalizedField[], kind: string) {
  return fields.filter((field) => field.valueKind === kind).length;
}

export default function MetadataRecordFieldsSection({
  fields,
}: MetadataRecordFieldsSectionProps) {
  const safeFields = Array.isArray(fields)
    ? fields.map((field, index) => normalizeField(field, index))
    : [];

  const textCount = getFieldKindCount(safeFields, "Text");
  const listCount = getFieldKindCount(safeFields, "List");

  return (
    <section
      id="fields"
      className="rounded-2xl border border-white/20 bg-black p-4 text-white"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
              Fields
            </p>

            <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-white/95">
              Record details
            </h2>

            <p className="mt-1 text-sm leading-6 text-white/80">
              Supporting details stay compact here so relationships remain the
              main focus.
            </p>
          </div>

          <a
            href="#top"
            className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-white/85 hover:bg-white/[0.06]"
          >
            Back to top
          </a>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <FieldSummaryPill label="Total" value={safeFields.length} />
          <FieldSummaryPill label="Text" value={textCount} />
          <FieldSummaryPill label="Lists" value={listCount} />
        </div>

        <div className="grid gap-2">
          {safeFields.length > 0 ? (
            safeFields.map((field, index) => (
              <MetadataFieldCard
                key={getFieldKey(field, index)}
                field={field}
              />
            ))
          ) : (
            <EmptyFieldsState />
          )}
        </div>
      </div>
    </section>
  );
}