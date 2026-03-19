"use client";

export default function MomentInspectorFamilySelectorBar(props: {
  familyOptions: string[];
  selectedPhraseFamilyId: string;
  onChangeSelectedPhraseFamilyId: (value: string) => void;
}) {
  const {
    familyOptions,
    selectedPhraseFamilyId,
    onChangeSelectedPhraseFamilyId,
  } = props;

  return (
    <div className="grid gap-2">
      <label className="text-[10px] font-medium text-zinc-600">
        Phrase Family Focus
      </label>

      <select
        value={selectedPhraseFamilyId}
        onChange={(e) => onChangeSelectedPhraseFamilyId(e.target.value)}
        className="rounded border bg-white px-2 py-2 text-[12px] text-zinc-800"
      >
        {familyOptions.map((familyId) => (
          <option key={familyId} value={familyId}>
            {familyId}
          </option>
        ))}
      </select>
    </div>
  );
}