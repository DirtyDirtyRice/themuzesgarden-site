import type { LyricImportReport } from "./lyricsImportTypes";

type LyricsLibraryImportStatusPanelProps = {
  importReport: LyricImportReport;
};

export default function LyricsLibraryImportStatusPanel({
  importReport,
}: LyricsLibraryImportStatusPanelProps) {
  return (
    <section className="rounded-2xl border border-white/15 bg-black p-5">
      <h2 className="text-xl font-semibold text-white">
        Lyrics Import Status
      </h2>

      <p className="mt-2 text-sm text-white/70">{importReport.status}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <ImportStatCard label="Selected" value={importReport.selectedFiles} />
        <ImportStatCard label="Readable" value={importReport.readableFiles} />
        <ImportStatCard label="TXT/MD" value={importReport.txtFiles} />
        <ImportStatCard label="DOCX" value={importReport.docxFiles} />
        <ImportStatCard label="PDF Later" value={importReport.pdfFiles} />
        <ImportStatCard label="Future Later" value={importReport.futureFiles} />
        <ImportStatCard label="Imported" value={importReport.importedFiles} />
        <ImportStatCard label="Failed" value={importReport.failedFiles} />
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/55">
          Skipped Extensions
        </p>

        <p className="mt-2 text-sm leading-6 text-white/70">
          {importReport.skippedExtensions}
        </p>
      </div>
    </section>
  );
}

type ImportStatCardProps = {
  label: string;
  value: number;
};

function ImportStatCard({ label, value }: ImportStatCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-white/55">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}