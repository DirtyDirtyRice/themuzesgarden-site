import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineLyricDirective = {
  id: TimelineId;
  lineNumber: number;
  target: string;
  occurrence: number;
  sense?: string;
  phonemes?: string;
  holdBars?: number;
  crescendoBeats?: number;
  octaveEnd?: number;
  referenceAssetId?: TimelineId;
  note?: string;
};

export type TimelineLyricWord = {
  id: TimelineId;
  lineNumber: number;
  position: number;
  text: string;
  normalized: string;
};

export type TimelinePronunciationLexiconEntry = {
  word: string;
  sense: string;
  phonemes: string;
  contextWords: string[];
};

export type TimelineLyricValidationIssue = {
  id: TimelineId;
  lineNumber: number;
  word?: string;
  gate: "structure" | "context" | "phoneme";
  message: string;
  status: "open" | "resolved";
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: TimelineUserId;
};

export type TimelineLyricValidationPass = {
  gate: "structure" | "context" | "phoneme";
  checkedAt: string;
  passed: boolean;
  issueIds: TimelineId[];
};

export type TimelineLyricPronunciationPackage = {
  id: TimelineId;
  projectId: TimelineId;
  name: string;
  sourceText: string;
  plainLyrics: string;
  words: TimelineLyricWord[];
  directives: TimelineLyricDirective[];
  issues: TimelineLyricValidationIssue[];
  passes: TimelineLyricValidationPass[];
  revision: number;
  parentPackageId: TimelineId | null;
  status:
    | "draft"
    | "incomplete"
    | "held"
    | "validated"
    | "approved"
    | "active"
    | "rejected"
    | "archived";
  fingerprint: string;
  createdAt: string;
  createdBy: TimelineUserId;
  approvedAt?: string;
  approvedBy?: TimelineUserId;
  activatedAt?: string;
  activatedBy?: TimelineUserId;
};

export type TimelineLyricPronunciationReceipt = {
  id: TimelineId;
  projectId: TimelineId;
  packageId: TimelineId;
  action:
    | "created"
    | "validated"
    | "held"
    | "resolved"
    | "approved"
    | "activated"
    | "rejected"
    | "archived";
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineLyricPronunciationArchive = {
  packages: TimelineLyricPronunciationPackage[];
  lexicon: TimelinePronunciationLexiconEntry[];
  receipts: TimelineLyricPronunciationReceipt[];
};

type ParsedSource = {
  plainLyrics: string;
  words: TimelineLyricWord[];
  directives: TimelineLyricDirective[];
  structureIssues: TimelineLyricValidationIssue[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function text(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function fingerprint(value: unknown): string {
  let hash = 2166136261;
  for (const character of JSON.stringify(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `lyrics-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export class TimelineLyricPronunciationEngine {
  private readonly packages = new Map<TimelineId, TimelineLyricPronunciationPackage>();
  private readonly lexicon = new Map<string, TimelinePronunciationLexiconEntry[]>();
  private readonly receipts: TimelineLyricPronunciationReceipt[] = [];
  private packageSequence = 0;
  private wordSequence = 0;
  private directiveSequence = 0;
  private issueSequence = 0;
  private receiptSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  registerLexicon(entries: TimelinePronunciationLexiconEntry[]): void {
    for (const entry of entries) {
      const word = this.normalizeWord(entry.word);
      const normalized: TimelinePronunciationLexiconEntry = {
        word,
        sense: text(entry.sense, "Lexicon sense").toLowerCase(),
        phonemes: this.validatePhonemes(entry.phonemes),
        contextWords: [...new Set(entry.contextWords.map((value) => this.normalizeWord(value)))],
      };
      const current = this.lexicon.get(word) ?? [];
      const existing = current.findIndex((value) => value.sense === normalized.sense);
      if (existing >= 0) current[existing] = normalized;
      else current.push(normalized);
      this.lexicon.set(word, current);
    }
  }

  createPackage(input: {
    projectId: TimelineId;
    name: string;
    sourceText: string;
    createdBy: TimelineUserId;
  }): TimelineLyricPronunciationPackage {
    const parsed = this.parseSource(text(input.sourceText, "Lyric source text"));
    const value: TimelineLyricPronunciationPackage = {
      id: `timeline-lyric-package-${++this.packageSequence}`,
      projectId: text(input.projectId, "Project ID"),
      name: text(input.name, "Lyric package name"),
      sourceText: input.sourceText,
      plainLyrics: parsed.plainLyrics,
      words: parsed.words,
      directives: parsed.directives,
      issues: parsed.structureIssues,
      passes: [],
      revision: 1,
      parentPackageId: null,
      status: "draft",
      fingerprint: "",
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    value.fingerprint = this.packageFingerprint(value);
    this.packages.set(value.id, clone(value));
    this.record(value, "created", "Lyric and performance instructions captured as a draft.", input.createdBy);
    return clone(value);
  }

  validate(input: {
    packageId: TimelineId;
    validatedBy: TimelineUserId;
  }): TimelineLyricPronunciationPackage {
    const value = this.required(input.packageId);
    if (!["draft", "incomplete", "held"].includes(value.status)) {
      throw new Error("Only a draft or held lyric package can be validated.");
    }
    const retainedResolutions = new Map(
      value.issues
        .filter((issue) => issue.status === "resolved")
        .map((issue) => [this.issueKey(issue), issue]),
    );
    const parsed = this.parseSource(value.sourceText);
    const structureIssues = parsed.structureIssues;
    const contextIssues = this.contextIssues(parsed.words, parsed.directives);
    const phonemeIssues = this.phonemeIssues(parsed.words, parsed.directives);
    const issues = [...structureIssues, ...contextIssues, ...phonemeIssues].map((issue) => {
      const resolved = retainedResolutions.get(this.issueKey(issue));
      return resolved ? { ...issue, ...resolved, id: issue.id } : issue;
    });
    const open = issues.filter((issue) => issue.status === "open");
    const passes: TimelineLyricValidationPass[] = (
      ["structure", "context", "phoneme"] as const
    ).map((gate) => {
      const gateIssues = issues.filter((issue) => issue.gate === gate && issue.status === "open");
      return {
        gate,
        checkedAt: this.now().toISOString(),
        passed: gateIssues.length === 0,
        issueIds: gateIssues.map((issue) => issue.id),
      };
    });
    const updated: TimelineLyricPronunciationPackage = {
      ...value,
      plainLyrics: parsed.plainLyrics,
      words: parsed.words,
      directives: parsed.directives,
      issues,
      passes,
      status: open.length ? "held" : "validated",
      fingerprint: "",
    };
    updated.fingerprint = this.packageFingerprint(updated);
    this.packages.set(updated.id, clone(updated));
    this.record(
      updated,
      open.length ? "held" : "validated",
      open.length
        ? `${open.length} ambiguity or pronunciation issue(s) require human resolution.`
        : "All three lyric validation gates passed.",
      input.validatedBy,
    );
    return clone(updated);
  }

  resolveIssue(input: {
    packageId: TimelineId;
    issueId: TimelineId;
    resolution: string;
    resolvedBy: TimelineUserId;
    correctedSourceText?: string;
  }): TimelineLyricPronunciationPackage {
    const source = this.required(input.packageId);
    if (source.status !== "held") throw new Error("Only a held lyric package has resolvable issues.");
    const issue = source.issues.find((candidate) => candidate.id === input.issueId);
    if (!issue || issue.status !== "open") throw new Error("Open lyric validation issue was not found.");
    const value: TimelineLyricPronunciationPackage = {
      ...source,
      id: `timeline-lyric-package-${++this.packageSequence}`,
      sourceText: input.correctedSourceText ?? source.sourceText,
      issues: source.issues.map((candidate) =>
        candidate.id === issue.id
          ? {
              ...candidate,
              status: "resolved" as const,
              resolution: text(input.resolution, "Human resolution"),
              resolvedAt: this.now().toISOString(),
              resolvedBy: input.resolvedBy,
            }
          : clone(candidate),
      ),
      passes: [],
      revision: source.revision + 1,
      parentPackageId: source.id,
      status: "incomplete",
      fingerprint: "",
      createdAt: this.now().toISOString(),
      createdBy: input.resolvedBy,
      approvedAt: undefined,
      approvedBy: undefined,
      activatedAt: undefined,
      activatedBy: undefined,
    };
    value.fingerprint = this.packageFingerprint(value);
    this.packages.set(value.id, clone(value));
    this.record(value, "resolved", "Human supplied a lyric validation answer; revalidation is required.", input.resolvedBy);
    return clone(value);
  }

  approve(input: {
    packageId: TimelineId;
    approvedBy: TimelineUserId;
  }): TimelineLyricPronunciationPackage {
    const value = this.required(input.packageId);
    if (value.status !== "validated" || value.passes.length !== 3 || value.passes.some((pass) => !pass.passed)) {
      throw new Error("All three lyric validation gates must pass before approval.");
    }
    if (value.createdBy === input.approvedBy) {
      throw new Error("Lyric pronunciation approval requires an independent human reviewer.");
    }
    return this.update(
      {
        ...value,
        status: "approved",
        approvedAt: this.now().toISOString(),
        approvedBy: input.approvedBy,
      },
      "approved",
      "Independent human approved meaning, pronunciation, and performance instructions.",
      input.approvedBy,
    );
  }

  activate(input: {
    packageId: TimelineId;
    activatedBy: TimelineUserId;
  }): TimelineLyricPronunciationPackage {
    const value = this.required(input.packageId);
    if (value.status !== "approved") {
      throw new Error("Only an approved lyric pronunciation package can become active.");
    }
    for (const current of this.packages.values()) {
      if (current.projectId === value.projectId && current.status === "active") {
        this.packages.set(current.id, clone({ ...current, status: "archived" as const }));
        this.record(current, "archived", "Superseded by a newly activated lyric package.", input.activatedBy);
      }
    }
    return this.update(
      {
        ...value,
        status: "active",
        activatedAt: this.now().toISOString(),
        activatedBy: input.activatedBy,
      },
      "activated",
      "Triple-validated lyric pronunciation package activated for singing.",
      input.activatedBy,
    );
  }

  reject(input: {
    packageId: TimelineId;
    reason: string;
    rejectedBy: TimelineUserId;
  }): TimelineLyricPronunciationPackage {
    const value = this.required(input.packageId);
    if (!["held", "validated"].includes(value.status)) {
      throw new Error("Only a held or validated lyric package can be rejected.");
    }
    return this.update(
      { ...value, status: "rejected" },
      "rejected",
      text(input.reason, "Rejection reason"),
      input.rejectedBy,
    );
  }

  getPackage(id: TimelineId): TimelineLyricPronunciationPackage | null {
    const value = this.packages.get(id);
    return value ? clone(value) : null;
  }

  listPackages(projectId?: TimelineId): TimelineLyricPronunciationPackage[] {
    return [...this.packages.values()]
      .filter((value) => !projectId || value.projectId === projectId)
      .map(clone);
  }

  activePackage(projectId: TimelineId): TimelineLyricPronunciationPackage | null {
    return this.listPackages(projectId).find((value) => value.status === "active") ?? null;
  }

  listReceipts(projectId?: TimelineId): TimelineLyricPronunciationReceipt[] {
    return this.receipts
      .filter((value) => !projectId || value.projectId === projectId)
      .map(clone);
  }

  exportArchive(): TimelineLyricPronunciationArchive {
    return {
      packages: this.listPackages(),
      lexicon: [...this.lexicon.values()].flat().map(clone),
      receipts: this.receipts.map(clone),
    };
  }

  restoreArchive(archive: TimelineLyricPronunciationArchive): void {
    const ids = new Set<TimelineId>();
    const activeProjects = new Set<TimelineId>();
    this.packages.clear();
    this.lexicon.clear();
    this.receipts.length = 0;
    this.registerLexicon(archive.lexicon);
    for (const value of archive.packages) {
      if (ids.has(value.id)) throw new Error("Duplicate lyric package ID.");
      ids.add(value.id);
      if (value.fingerprint !== this.packageFingerprint(value)) {
        throw new Error(`Lyric package ${value.id} fingerprint is invalid.`);
      }
      if (value.status === "active") {
        if (activeProjects.has(value.projectId)) {
          throw new Error("A project cannot restore multiple active lyric packages.");
        }
        activeProjects.add(value.projectId);
      }
      this.packages.set(value.id, clone(value));
    }
    this.receipts.push(...archive.receipts.map(clone));
    this.packageSequence = this.highest(archive.packages.map((value) => value.id));
    this.wordSequence = this.highest(
      archive.packages.flatMap((value) => value.words.map((word) => word.id)),
    );
    this.directiveSequence = this.highest(
      archive.packages.flatMap((value) => value.directives.map((directive) => directive.id)),
    );
    this.issueSequence = this.highest(
      archive.packages.flatMap((value) => value.issues.map((issue) => issue.id)),
    );
    this.receiptSequence = this.highest(archive.receipts.map((value) => value.id));
  }

  private parseSource(sourceText: string): ParsedSource {
    const plainLines: string[] = [];
    const words: TimelineLyricWord[] = [];
    const directives: TimelineLyricDirective[] = [];
    const structureIssues: TimelineLyricValidationIssue[] = [];
    sourceText.split(/\r?\n/).forEach((sourceLine, lineIndex) => {
      const lineNumber = lineIndex + 1;
      const opens = [...sourceLine].filter((character) => character === "[").length;
      const closes = [...sourceLine].filter((character) => character === "]").length;
      if (opens !== closes) {
        structureIssues.push(
          this.issue(lineNumber, "structure", "Bracketed lyric instruction is not closed."),
        );
      }
      const matches = [...sourceLine.matchAll(/\[([^\]]*)\]/g)];
      for (const match of matches) {
        try {
          directives.push(this.parseDirective(match[1], lineNumber));
        } catch (error) {
          structureIssues.push(
            this.issue(
              lineNumber,
              "structure",
              error instanceof Error ? error.message : "Invalid lyric instruction.",
            ),
          );
        }
      }
      const plainLine = sourceLine.replace(/\[[^\]]*\]/g, "").trim();
      plainLines.push(plainLine);
      const tokens = plainLine.match(/[\p{L}\p{N}'’-]+/gu) ?? [];
      tokens.forEach((token, position) => {
        words.push({
          id: `timeline-lyric-word-${++this.wordSequence}`,
          lineNumber,
          position,
          text: token,
          normalized: this.normalizeWord(token),
        });
      });
    });
    if (!words.length) {
      structureIssues.push(this.issue(1, "structure", "Lyric package contains no singable words."));
    }
    return { plainLyrics: plainLines.join("\n"), words, directives, structureIssues };
  }

  private parseDirective(raw: string, lineNumber: number): TimelineLyricDirective {
    const fields = new Map<string, string>();
    for (const pair of raw.split(";")) {
      const separator = pair.indexOf("=");
      if (separator < 1) throw new Error("Lyric instructions must use key=value fields.");
      fields.set(pair.slice(0, separator).trim().toLowerCase(), pair.slice(separator + 1).trim());
    }
    const target = text(fields.get("target") ?? "", "Instruction target");
    const directive: TimelineLyricDirective = {
      id: `timeline-lyric-directive-${++this.directiveSequence}`,
      lineNumber,
      target: this.normalizeWord(target),
      occurrence: this.optionalWhole(fields.get("occurrence"), 1, 100, 1, "Target occurrence"),
    };
    if (fields.has("sense")) directive.sense = text(fields.get("sense")!, "Word sense").toLowerCase();
    if (fields.has("phonemes")) directive.phonemes = this.validatePhonemes(fields.get("phonemes")!);
    if (fields.has("holdbars")) {
      directive.holdBars = this.optionalNumber(fields.get("holdbars"), 0, 128, "Hold bars");
    }
    if (fields.has("crescendobeats")) {
      directive.crescendoBeats = this.optionalNumber(
        fields.get("crescendobeats"),
        0,
        512,
        "Crescendo beats",
      );
    }
    if (fields.has("octaveend")) {
      directive.octaveEnd = this.optionalWhole(fields.get("octaveend"), -4, 4, 0, "Ending octave");
    }
    if (fields.has("reference")) {
      directive.referenceAssetId = text(fields.get("reference")!, "Reference recording");
    }
    if (fields.has("note")) directive.note = text(fields.get("note")!, "Instruction note");
    return directive;
  }

  private contextIssues(
    words: TimelineLyricWord[],
    directives: TimelineLyricDirective[],
  ): TimelineLyricValidationIssue[] {
    const issues: TimelineLyricValidationIssue[] = [];
    for (const word of words) {
      const entries = this.lexicon.get(word.normalized) ?? [];
      if (entries.length <= 1) continue;
      const directive = this.directiveFor(word, words, directives);
      if (directive?.sense && entries.some((entry) => entry.sense === directive.sense)) continue;
      const lineWords = words
        .filter((candidate) => candidate.lineNumber === word.lineNumber)
        .map((candidate) => candidate.normalized);
      const matches = entries.filter((entry) =>
        entry.contextWords.some((context) => lineWords.includes(context)),
      );
      if (matches.length !== 1) {
        issues.push(
          this.issue(
            word.lineNumber,
            "context",
            `Word "${word.text}" has multiple meanings or pronunciations; a human must select its sense.`,
            word.text,
          ),
        );
      }
    }
    for (const directive of directives) {
      if (!this.targetWord(directive, words)) {
        issues.push(
          this.issue(
            directive.lineNumber,
            "context",
            `Instruction target "${directive.target}" was not found at occurrence ${directive.occurrence}.`,
            directive.target,
          ),
        );
      }
    }
    return issues;
  }

  private phonemeIssues(
    words: TimelineLyricWord[],
    directives: TimelineLyricDirective[],
  ): TimelineLyricValidationIssue[] {
    const issues: TimelineLyricValidationIssue[] = [];
    for (const word of words) {
      const entries = this.lexicon.get(word.normalized) ?? [];
      if (!entries.length) continue;
      const directive = this.directiveFor(word, words, directives);
      if (directive?.phonemes) continue;
      if (entries.length === 1) continue;
      if (directive?.sense && entries.some((entry) => entry.sense === directive.sense)) continue;
      issues.push(
        this.issue(
          word.lineNumber,
          "phoneme",
          `No verified phoneme sequence is selected for "${word.text}".`,
          word.text,
        ),
      );
    }
    for (const directive of directives) {
      if (
        directive.crescendoBeats !== undefined &&
        (!directive.holdBars || directive.crescendoBeats <= 0)
      ) {
        issues.push(
          this.issue(
            directive.lineNumber,
            "phoneme",
            "Crescendo instruction requires a positive held duration.",
            directive.target,
          ),
        );
      }
      if (directive.octaveEnd !== undefined && !directive.holdBars) {
        issues.push(
          this.issue(
            directive.lineNumber,
            "phoneme",
            "Ending octave instruction requires a held lyric duration.",
            directive.target,
          ),
        );
      }
    }
    return issues;
  }

  private directiveFor(
    word: TimelineLyricWord,
    words: TimelineLyricWord[],
    directives: TimelineLyricDirective[],
  ): TimelineLyricDirective | undefined {
    const same = words.filter(
      (candidate) =>
        candidate.lineNumber === word.lineNumber && candidate.normalized === word.normalized,
    );
    const occurrence = same.findIndex((candidate) => candidate.id === word.id) + 1;
    return directives.find(
      (directive) =>
        directive.lineNumber === word.lineNumber &&
        directive.target === word.normalized &&
        directive.occurrence === occurrence,
    );
  }

  private targetWord(
    directive: TimelineLyricDirective,
    words: TimelineLyricWord[],
  ): TimelineLyricWord | undefined {
    return words
      .filter(
        (word) =>
          word.lineNumber === directive.lineNumber && word.normalized === directive.target,
      )
      [directive.occurrence - 1];
  }

  private issue(
    lineNumber: number,
    gate: TimelineLyricValidationIssue["gate"],
    message: string,
    word?: string,
  ): TimelineLyricValidationIssue {
    return {
      id: `timeline-lyric-issue-${++this.issueSequence}`,
      lineNumber,
      word,
      gate,
      message,
      status: "open",
    };
  }

  private issueKey(issue: TimelineLyricValidationIssue): string {
    return `${issue.lineNumber}|${issue.gate}|${issue.word ?? ""}|${issue.message}`;
  }

  private validatePhonemes(value: string): string {
    const normalized = text(value, "Phoneme sequence").toUpperCase().replace(/\s+/g, " ");
    if (!/^[A-Z0-9]+(?: [A-Z0-9]+)*$/.test(normalized)) {
      throw new Error("Phoneme sequence must contain space-separated phoneme symbols.");
    }
    return normalized;
  }

  private normalizeWord(value: string): string {
    return text(value, "Word")
      .toLocaleLowerCase("en-US")
      .replace(/[’]/g, "'")
      .replace(/[^\p{L}\p{N}'-]/gu, "");
  }

  private optionalNumber(
    value: string | undefined,
    minimum: number,
    maximum: number,
    label: string,
  ): number {
    const number = Number(value);
    if (!Number.isFinite(number) || number < minimum || number > maximum) {
      throw new Error(`${label} must be from ${minimum} to ${maximum}.`);
    }
    return number;
  }

  private optionalWhole(
    value: string | undefined,
    minimum: number,
    maximum: number,
    fallback: number,
    label: string,
  ): number {
    if (value === undefined) return fallback;
    const number = Number(value);
    if (!Number.isInteger(number) || number < minimum || number > maximum) {
      throw new Error(`${label} must be a whole number from ${minimum} to ${maximum}.`);
    }
    return number;
  }

  private packageFingerprint(value: TimelineLyricPronunciationPackage): string {
    return fingerprint({
      projectId: value.projectId,
      name: value.name,
      sourceText: value.sourceText,
      plainLyrics: value.plainLyrics,
      directives: value.directives,
      issues: value.issues,
      passes: value.passes,
      revision: value.revision,
      parentPackageId: value.parentPackageId,
    });
  }

  private required(id: TimelineId): TimelineLyricPronunciationPackage {
    const value = this.packages.get(id);
    if (!value) throw new Error(`Unknown lyric pronunciation package: ${id}`);
    return clone(value);
  }

  private update(
    value: TimelineLyricPronunciationPackage,
    action: TimelineLyricPronunciationReceipt["action"],
    message: string,
    recordedBy: TimelineUserId,
  ): TimelineLyricPronunciationPackage {
    this.packages.set(value.id, clone(value));
    this.record(value, action, message, recordedBy);
    return clone(value);
  }

  private record(
    value: TimelineLyricPronunciationPackage,
    action: TimelineLyricPronunciationReceipt["action"],
    message: string,
    recordedBy: TimelineUserId,
  ): void {
    this.receipts.push({
      id: `timeline-lyric-receipt-${++this.receiptSequence}`,
      projectId: value.projectId,
      packageId: value.id,
      action,
      message,
      recordedAt: this.now().toISOString(),
      recordedBy,
    });
  }

  private highest(ids: string[]): number {
    return ids.reduce(
      (highest, id) => Math.max(highest, Number(id.match(/(\d+)$/)?.[1] ?? 0)),
      0,
    );
  }
}
