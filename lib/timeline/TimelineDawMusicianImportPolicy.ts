export type TimelineDawMusicianImportKind = "full-song" | "stems" | "alternate-versions";

export type TimelineDawMusicianImportPlan = {
  familyName: string;
  role: "finished" | "stem" | "demo";
  laneMode: "aligned" | "sequential";
  fileNames: string[];
};

const AUDIO_EXTENSION = /\.(wav|mp3)$/i;

function withoutExtension(name: string): string {
  return name.replace(AUDIO_EXTENSION, "").trim();
}

export function createTimelineDawMusicianImportPlan(input: {
  kind: TimelineDawMusicianImportKind;
  files: Array<{ name: string; size: number }>;
  requestedName?: string;
}): TimelineDawMusicianImportPlan {
  if (!input.files.length) throw new Error("Choose at least one WAV or MP3 file.");
  if (input.files.some((file) => !AUDIO_EXTENSION.test(file.name))) {
    throw new Error("Arrangement imports currently accept WAV and MP3 audio files.");
  }
  if (input.files.some((file) => !Number.isFinite(file.size) || file.size <= 0)) {
    throw new Error("Every imported audio file must contain audio data.");
  }
  if (input.kind === "full-song" && input.files.length !== 1) {
    throw new Error("Full Song accepts one mixed audio file. Choose Stems for multiple synchronized files.");
  }

  const requestedName = input.requestedName?.trim();
  const firstName = withoutExtension(input.files[0].name) || "Musician Import";
  const familyName = (requestedName || firstName).slice(0, 120);
  const role = input.kind === "stems" ? "stem" : input.kind === "full-song" ? "finished" : "demo";
  const laneMode = input.kind === "alternate-versions" ? "sequential" : "aligned";

  return {
    familyName,
    role,
    laneMode,
    fileNames: input.files.map((file) => file.name),
  };
}

export function timelineDawMusicianImportDescription(kind: TimelineDawMusicianImportKind): string {
  if (kind === "full-song") return "One complete mix placed at the start of the arrangement.";
  if (kind === "stems") return "Multiple synchronized files placed on separate lanes at the same start time.";
  return "Different performances or mixes placed one after another for comparison.";
}
