export default function FindItMoreInfoPreview() {
  return (
    <div className="rounded-xl border border-white/10 bg-black px-3 py-3">
      <button
        type="button"
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:opacity-85 active:scale-[0.98]"
      >
        More info?
      </button>

      <p className="mt-2 text-sm leading-6 text-white/60">
        Find It reads from the shared navigation tree. Search results stay safe:
        Enter does not navigate, Clear resets the panel, and the selected target
        path appears before the result grid.
      </p>
    </div>
  );
}