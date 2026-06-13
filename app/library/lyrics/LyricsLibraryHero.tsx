type LyricsLibraryHeroProps = {
  entryCount: number;
  saveStatus: string;
};

export default function LyricsLibraryHero({
  entryCount,
  saveStatus,
}: LyricsLibraryHeroProps) {
  return (
    <section className="rounded-2xl border border-white/15 bg-black p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/65">
        Library
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
        Lyrics
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
        Write lyric text, search your lyrics, import TXT files, edit saved
        lyrics, duplicate entries, and download clean text files.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
          {entryCount} total lyric entr{entryCount === 1 ? "y" : "ies"}
        </div>
        <div className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
          {saveStatus}
        </div>
      </div>
    </section>
  );
}