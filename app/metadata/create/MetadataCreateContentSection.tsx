import { getFieldStatusMessage } from "./metadataCreateUtils";

export default function MetadataCreateContentSection({
  summary,
  onSummaryChange,
  summaryReady,
}: {
  summary: string;
  onSummaryChange: (value: string) => void;
  summaryReady: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="record-summary"
          className="text-sm font-semibold text-white"
        >
          Explanation
        </label>

        <p className="text-sm leading-6 text-white/65">
          Write enough information so the record can stand on its own. This
          keeps the system from becoming fake hierarchy and gives the final
          record output real substance.
        </p>

        <textarea
          id="record-summary"
          value={summary}
          onChange={(event) => onSummaryChange(event.target.value)}
          placeholder="Explain what this record is, why it matters, and what kind of knowledge it holds."
          rows={6}
          className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/30"
        />

        <p className="text-xs text-white/45">
          {getFieldStatusMessage(
            summaryReady,
            "Explanation has enough substance to support a real record.",
            "Explanation still needs more substance before this becomes a real record."
          )}
        </p>
      </div>
    </div>
  );
}