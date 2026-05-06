import { formatMissingItems } from "./createFormValidation";

export default function CreateFormMissingAlert({
  show,
  missingItems,
}: {
  show: boolean;
  missingItems: string[];
}) {
  if (!show || missingItems.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-4">
      <p className="text-sm font-bold text-red-100">
        Finish required fields first:
      </p>

      <p className="mt-1 text-sm leading-6 text-red-50/80">
        {formatMissingItems(missingItems)}
      </p>

      <ul className="mt-3 grid gap-2 md:grid-cols-2">
        {missingItems.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-red-200/20 bg-black/40 px-3 py-2 text-sm font-semibold text-red-50"
          >
            {item} *
          </li>
        ))}
      </ul>
    </div>
  );
}