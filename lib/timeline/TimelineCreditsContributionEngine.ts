import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineContributionRole =
  | "artist"
  | "writer"
  | "composer"
  | "producer"
  | "engineer"
  | "musician"
  | "vocalist"
  | "arranger"
  | "designer"
  | "other";

export type TimelineContributionStatus =
  | "draft"
  | "awaiting-confirmation"
  | "confirmed"
  | "disputed"
  | "withdrawn";

export type TimelineCreditContributor = {
  id: TimelineId;
  userId: TimelineUserId | null;
  legalName: string;
  displayName: string;
  contactReference: string;
  identifiers: Record<string, string>;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineContributionEvidence = {
  id: TimelineId;
  contributionId: TimelineId;
  kind:
    | "session"
    | "file"
    | "message"
    | "contract"
    | "registration"
    | "other";
  reference: string;
  fingerprint: string;
  description: string;
  addedAt: string;
  addedBy: TimelineUserId;
};

export type TimelineContribution = {
  id: TimelineId;
  projectId: TimelineId;
  contributorId: TimelineId;
  role: TimelineContributionRole;
  roleDetail: string;
  artifactIds: TimelineId[];
  description: string;
  status: TimelineContributionStatus;
  evidenceIds: TimelineId[];
  revision: number;
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
  confirmedAt?: string;
  confirmedBy?: TimelineUserId;
  withdrawnAt?: string;
  withdrawnBy?: TimelineUserId;
};

export type TimelineContributionDispute = {
  id: TimelineId;
  projectId: TimelineId;
  contributionIds: TimelineId[];
  reason: string;
  status: "open" | "resolved";
  openedAt: string;
  openedBy: TimelineUserId;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: TimelineUserId;
};

export type TimelineCreditLine = {
  contributionId: TimelineId;
  contributorId: TimelineId;
  displayName: string;
  legalName: string;
  role: TimelineContributionRole;
  roleDetail: string;
  artifactIds: TimelineId[];
  description: string;
  identifiers: Record<string, string>;
  evidenceFingerprints: string[];
};

export type TimelineCreditManifest = {
  id: TimelineId;
  projectId: TimelineId;
  version: number;
  status: "final";
  lines: TimelineCreditLine[];
  fingerprint: string;
  finalizedAt: string;
  finalizedBy: TimelineUserId;
};

export type TimelineCreditReceipt = {
  id: TimelineId;
  projectId: TimelineId;
  contributionId?: TimelineId;
  action:
    | "contributor-created"
    | "contribution-created"
    | "evidence-added"
    | "confirmation-requested"
    | "contribution-confirmed"
    | "contribution-amended"
    | "dispute-opened"
    | "dispute-resolved"
    | "contribution-withdrawn"
    | "manifest-finalized";
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineCreditsContributionArchive = {
  contributors: TimelineCreditContributor[];
  contributions: TimelineContribution[];
  evidence: TimelineContributionEvidence[];
  disputes: TimelineContributionDispute[];
  manifests: TimelineCreditManifest[];
  receipts: TimelineCreditReceipt[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function uniqueIds(ids: TimelineId[]): TimelineId[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

function stableManifestFingerprint(lines: TimelineCreditLine[]): string {
  const value = lines
    .map((line) => ({
      contributionId: line.contributionId,
      contributorId: line.contributorId,
      role: line.role,
      roleDetail: line.roleDetail,
      artifactIds: [...line.artifactIds].sort(),
      evidenceFingerprints: [...line.evidenceFingerprints].sort(),
    }))
    .sort((left, right) =>
      left.contributionId.localeCompare(right.contributionId),
    );
  let hash = 2166136261;
  for (const character of JSON.stringify(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `credits-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export class TimelineCreditsContributionEngine {
  private readonly contributors = new Map<
    TimelineId,
    TimelineCreditContributor
  >();
  private readonly contributions = new Map<
    TimelineId,
    TimelineContribution
  >();
  private readonly evidence = new Map<
    TimelineId,
    TimelineContributionEvidence
  >();
  private readonly disputes = new Map<TimelineId, TimelineContributionDispute>();
  private readonly manifests = new Map<TimelineId, TimelineCreditManifest>();
  private readonly receipts: TimelineCreditReceipt[] = [];
  private contributorSequence = 0;
  private contributionSequence = 0;
  private evidenceSequence = 0;
  private disputeSequence = 0;
  private manifestSequence = 0;
  private receiptSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createContributor(input: {
    projectId: TimelineId;
    userId?: TimelineUserId;
    legalName: string;
    displayName?: string;
    contactReference: string;
    identifiers?: Record<string, string>;
    createdBy: TimelineUserId;
  }): TimelineCreditContributor {
    const legalName = requiredText(input.legalName, "Contributor legal name");
    const contributor: TimelineCreditContributor = {
      id: `timeline-credit-contributor-${++this.contributorSequence}`,
      userId: input.userId?.trim() || null,
      legalName,
      displayName: input.displayName?.trim() || legalName,
      contactReference: requiredText(
        input.contactReference,
        "Contributor contact reference",
      ),
      identifiers: Object.fromEntries(
        Object.entries(input.identifiers ?? {})
          .map(([key, value]) => [key.trim(), value.trim()])
          .filter(([key, value]) => key && value),
      ),
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.contributors.set(contributor.id, clone(contributor));
    this.record({
      projectId: input.projectId,
      action: "contributor-created",
      message: `Contributor ${contributor.displayName} registered.`,
      recordedBy: input.createdBy,
    });
    return clone(contributor);
  }

  createContribution(input: {
    projectId: TimelineId;
    contributorId: TimelineId;
    role: TimelineContributionRole;
    roleDetail?: string;
    artifactIds: TimelineId[];
    description: string;
    createdBy: TimelineUserId;
  }): TimelineContribution {
    this.requiredContributor(input.contributorId);
    const artifactIds = uniqueIds(input.artifactIds);
    if (!artifactIds.length) {
      throw new Error("A contribution requires at least one artifact.");
    }
    const timestamp = this.now().toISOString();
    const contribution: TimelineContribution = {
      id: `timeline-contribution-${++this.contributionSequence}`,
      projectId: requiredText(input.projectId, "Project ID"),
      contributorId: input.contributorId,
      role: input.role,
      roleDetail: input.roleDetail?.trim() ?? "",
      artifactIds,
      description: requiredText(
        input.description,
        "Contribution description",
      ),
      status: "draft",
      evidenceIds: [],
      revision: 1,
      createdAt: timestamp,
      createdBy: input.createdBy,
      updatedAt: timestamp,
      updatedBy: input.createdBy,
    };
    this.contributions.set(contribution.id, clone(contribution));
    this.invalidateProjectManifests(contribution.projectId);
    this.record({
      projectId: contribution.projectId,
      contributionId: contribution.id,
      action: "contribution-created",
      message: `${input.role} contribution created in draft.`,
      recordedBy: input.createdBy,
    });
    return clone(contribution);
  }

  addEvidence(input: {
    contributionId: TimelineId;
    kind: TimelineContributionEvidence["kind"];
    reference: string;
    fingerprint: string;
    description?: string;
    addedBy: TimelineUserId;
  }): TimelineContributionEvidence {
    const contribution = this.requiredContribution(input.contributionId);
    if (contribution.status === "withdrawn") {
      throw new Error("Withdrawn contributions cannot receive evidence.");
    }
    const fingerprint = requiredText(
      input.fingerprint,
      "Evidence fingerprint",
    );
    const duplicate = contribution.evidenceIds
      .map((id) => this.evidence.get(id))
      .some((item) => item?.fingerprint === fingerprint);
    if (duplicate) {
      throw new Error("This evidence fingerprint is already attached.");
    }
    const evidence: TimelineContributionEvidence = {
      id: `timeline-contribution-evidence-${++this.evidenceSequence}`,
      contributionId: contribution.id,
      kind: input.kind,
      reference: requiredText(input.reference, "Evidence reference"),
      fingerprint,
      description: input.description?.trim() ?? "",
      addedAt: this.now().toISOString(),
      addedBy: input.addedBy,
    };
    this.evidence.set(evidence.id, clone(evidence));
    this.saveContribution({
      ...contribution,
      evidenceIds: [...contribution.evidenceIds, evidence.id],
      updatedAt: this.now().toISOString(),
      updatedBy: input.addedBy,
    });
    this.record({
      projectId: contribution.projectId,
      contributionId: contribution.id,
      action: "evidence-added",
      message: `${input.kind} evidence attached to contribution.`,
      recordedBy: input.addedBy,
    });
    return clone(evidence);
  }

  requestConfirmation(input: {
    contributionId: TimelineId;
    requestedBy: TimelineUserId;
  }): TimelineContribution {
    const contribution = this.requiredContribution(input.contributionId);
    if (contribution.status !== "draft") {
      throw new Error("Only a draft contribution can request confirmation.");
    }
    if (!contribution.evidenceIds.length) {
      throw new Error("Contribution evidence is required before confirmation.");
    }
    const updated = this.saveContribution({
      ...contribution,
      status: "awaiting-confirmation",
      updatedAt: this.now().toISOString(),
      updatedBy: input.requestedBy,
    });
    this.record({
      projectId: contribution.projectId,
      contributionId: contribution.id,
      action: "confirmation-requested",
      message: "Contributor confirmation requested.",
      recordedBy: input.requestedBy,
    });
    return updated;
  }

  confirmContribution(input: {
    contributionId: TimelineId;
    confirmedBy: TimelineUserId;
  }): TimelineContribution {
    const contribution = this.requiredContribution(input.contributionId);
    const contributor = this.requiredContributor(contribution.contributorId);
    if (contribution.status !== "awaiting-confirmation") {
      throw new Error("Contribution is not awaiting confirmation.");
    }
    if (!contributor.userId) {
      throw new Error(
        "An unlinked contributor requires a verified user before confirmation.",
      );
    }
    if (contributor.userId !== input.confirmedBy) {
      throw new Error("Only the named contributor can confirm this credit.");
    }
    const updated = this.saveContribution({
      ...contribution,
      status: "confirmed",
      confirmedAt: this.now().toISOString(),
      confirmedBy: input.confirmedBy,
      updatedAt: this.now().toISOString(),
      updatedBy: input.confirmedBy,
    });
    this.record({
      projectId: contribution.projectId,
      contributionId: contribution.id,
      action: "contribution-confirmed",
      message: "Named contributor confirmed their contribution.",
      recordedBy: input.confirmedBy,
    });
    return updated;
  }

  amendContribution(input: {
    contributionId: TimelineId;
    artifactIds?: TimelineId[];
    description?: string;
    roleDetail?: string;
    amendedBy: TimelineUserId;
  }): TimelineContribution {
    const contribution = this.requiredContribution(input.contributionId);
    if (contribution.status === "withdrawn") {
      throw new Error("Withdrawn contributions cannot be amended.");
    }
    const artifactIds = input.artifactIds
      ? uniqueIds(input.artifactIds)
      : contribution.artifactIds;
    if (!artifactIds.length) {
      throw new Error("A contribution requires at least one artifact.");
    }
    const updated = this.saveContribution({
      ...contribution,
      artifactIds,
      description:
        input.description === undefined
          ? contribution.description
          : requiredText(input.description, "Contribution description"),
      roleDetail:
        input.roleDetail === undefined
          ? contribution.roleDetail
          : input.roleDetail.trim(),
      status: "draft",
      revision: contribution.revision + 1,
      confirmedAt: undefined,
      confirmedBy: undefined,
      updatedAt: this.now().toISOString(),
      updatedBy: input.amendedBy,
    });
    this.invalidateProjectManifests(contribution.projectId);
    this.record({
      projectId: contribution.projectId,
      contributionId: contribution.id,
      action: "contribution-amended",
      message: `Contribution amended to revision ${updated.revision}; confirmation reset.`,
      recordedBy: input.amendedBy,
    });
    return updated;
  }

  openDispute(input: {
    projectId: TimelineId;
    contributionIds: TimelineId[];
    reason: string;
    openedBy: TimelineUserId;
  }): TimelineContributionDispute {
    const ids = uniqueIds(input.contributionIds);
    if (!ids.length) throw new Error("A dispute requires contributions.");
    const contributions = ids.map((id) => this.requiredContribution(id));
    if (
      contributions.some(
        (contribution) => contribution.projectId !== input.projectId,
      )
    ) {
      throw new Error("Disputed contributions must belong to the same project.");
    }
    const dispute: TimelineContributionDispute = {
      id: `timeline-contribution-dispute-${++this.disputeSequence}`,
      projectId: input.projectId,
      contributionIds: ids,
      reason: requiredText(input.reason, "Dispute reason"),
      status: "open",
      openedAt: this.now().toISOString(),
      openedBy: input.openedBy,
    };
    this.disputes.set(dispute.id, clone(dispute));
    contributions.forEach((contribution) =>
      this.saveContribution({ ...contribution, status: "disputed" }),
    );
    this.invalidateProjectManifests(input.projectId);
    this.record({
      projectId: input.projectId,
      contributionId: ids[0],
      action: "dispute-opened",
      message: `Credit dispute opened across ${ids.length} contribution(s).`,
      recordedBy: input.openedBy,
    });
    return clone(dispute);
  }

  resolveDispute(input: {
    disputeId: TimelineId;
    confirmedContributionIds: TimelineId[];
    resolution: string;
    resolvedBy: TimelineUserId;
  }): TimelineContributionDispute {
    const dispute = this.disputes.get(input.disputeId);
    if (!dispute) throw new Error(`Unknown contribution dispute: ${input.disputeId}`);
    if (dispute.status !== "open") throw new Error("Dispute is already resolved.");
    const confirmedIds = new Set(uniqueIds(input.confirmedContributionIds));
    if ([...confirmedIds].some((id) => !dispute.contributionIds.includes(id))) {
      throw new Error("Resolution references a contribution outside the dispute.");
    }
    dispute.contributionIds.forEach((id) => {
      const contribution = this.requiredContribution(id);
      this.saveContribution({
        ...contribution,
        status: confirmedIds.has(id) ? "confirmed" : "withdrawn",
        confirmedAt: confirmedIds.has(id)
          ? this.now().toISOString()
          : contribution.confirmedAt,
        confirmedBy: confirmedIds.has(id)
          ? input.resolvedBy
          : contribution.confirmedBy,
        withdrawnAt: confirmedIds.has(id)
          ? contribution.withdrawnAt
          : this.now().toISOString(),
        withdrawnBy: confirmedIds.has(id)
          ? contribution.withdrawnBy
          : input.resolvedBy,
      });
    });
    const resolved: TimelineContributionDispute = {
      ...dispute,
      status: "resolved",
      resolution: requiredText(input.resolution, "Dispute resolution"),
      resolvedAt: this.now().toISOString(),
      resolvedBy: input.resolvedBy,
    };
    this.disputes.set(resolved.id, clone(resolved));
    this.record({
      projectId: dispute.projectId,
      contributionId: dispute.contributionIds[0],
      action: "dispute-resolved",
      message: "Credit dispute resolved with an auditable outcome.",
      recordedBy: input.resolvedBy,
    });
    return clone(resolved);
  }

  withdrawContribution(input: {
    contributionId: TimelineId;
    withdrawnBy: TimelineUserId;
  }): TimelineContribution {
    const contribution = this.requiredContribution(input.contributionId);
    const contributor = this.requiredContributor(contribution.contributorId);
    if (
      input.withdrawnBy !== contributor.userId &&
      input.withdrawnBy !== contribution.createdBy
    ) {
      throw new Error("Only the contributor or recorder can withdraw this credit.");
    }
    if (contribution.status === "withdrawn") {
      throw new Error("Contribution is already withdrawn.");
    }
    const updated = this.saveContribution({
      ...contribution,
      status: "withdrawn",
      withdrawnAt: this.now().toISOString(),
      withdrawnBy: input.withdrawnBy,
      updatedAt: this.now().toISOString(),
      updatedBy: input.withdrawnBy,
    });
    this.invalidateProjectManifests(contribution.projectId);
    this.record({
      projectId: contribution.projectId,
      contributionId: contribution.id,
      action: "contribution-withdrawn",
      message: "Contribution withdrawn from future credit manifests.",
      recordedBy: input.withdrawnBy,
    });
    return updated;
  }

  finalizeManifest(input: {
    projectId: TimelineId;
    finalizedBy: TimelineUserId;
  }): TimelineCreditManifest {
    const active = this.listContributions(input.projectId).filter(
      (contribution) => contribution.status !== "withdrawn",
    );
    if (!active.length) {
      throw new Error("A credit manifest requires contributions.");
    }
    const unresolved = active.filter(
      (contribution) => contribution.status !== "confirmed",
    );
    if (unresolved.length) {
      throw new Error(
        `Credit manifest is held: ${unresolved.length} contribution(s) are not confirmed.`,
      );
    }
    const openDisputes = this.listDisputes(input.projectId).filter(
      (dispute) => dispute.status === "open",
    );
    if (openDisputes.length) {
      throw new Error("Credit manifest is held by unresolved disputes.");
    }
    const lines = active.map((contribution): TimelineCreditLine => {
      const contributor = this.requiredContributor(contribution.contributorId);
      return {
        contributionId: contribution.id,
        contributorId: contributor.id,
        displayName: contributor.displayName,
        legalName: contributor.legalName,
        role: contribution.role,
        roleDetail: contribution.roleDetail,
        artifactIds: [...contribution.artifactIds],
        description: contribution.description,
        identifiers: clone(contributor.identifiers),
        evidenceFingerprints: contribution.evidenceIds
          .map((id) => this.evidence.get(id)?.fingerprint)
          .filter((value): value is string => Boolean(value)),
      };
    });
    const version =
      this.listManifests(input.projectId).reduce(
        (highest, manifest) => Math.max(highest, manifest.version),
        0,
      ) + 1;
    const manifest: TimelineCreditManifest = {
      id: `timeline-credit-manifest-${++this.manifestSequence}`,
      projectId: input.projectId,
      version,
      status: "final",
      lines,
      fingerprint: stableManifestFingerprint(lines),
      finalizedAt: this.now().toISOString(),
      finalizedBy: input.finalizedBy,
    };
    this.manifests.set(manifest.id, clone(manifest));
    this.record({
      projectId: input.projectId,
      action: "manifest-finalized",
      message: `Credit manifest version ${version} finalized with ${lines.length} line(s).`,
      recordedBy: input.finalizedBy,
    });
    return clone(manifest);
  }

  getContributor(id: TimelineId): TimelineCreditContributor | null {
    const contributor = this.contributors.get(id);
    return contributor ? clone(contributor) : null;
  }

  getContribution(id: TimelineId): TimelineContribution | null {
    const contribution = this.contributions.get(id);
    return contribution ? clone(contribution) : null;
  }

  listContributions(projectId?: TimelineId): TimelineContribution[] {
    return [...this.contributions.values()]
      .filter((item) => !projectId || item.projectId === projectId)
      .map(clone);
  }

  listDisputes(projectId?: TimelineId): TimelineContributionDispute[] {
    return [...this.disputes.values()]
      .filter((item) => !projectId || item.projectId === projectId)
      .map(clone);
  }

  listManifests(projectId?: TimelineId): TimelineCreditManifest[] {
    return [...this.manifests.values()]
      .filter((item) => !projectId || item.projectId === projectId)
      .map(clone);
  }

  listReceipts(projectId?: TimelineId): TimelineCreditReceipt[] {
    return this.receipts
      .filter((item) => !projectId || item.projectId === projectId)
      .map(clone);
  }

  exportArchive(): TimelineCreditsContributionArchive {
    return {
      contributors: [...this.contributors.values()].map(clone),
      contributions: this.listContributions(),
      evidence: [...this.evidence.values()].map(clone),
      disputes: this.listDisputes(),
      manifests: this.listManifests(),
      receipts: this.receipts.map(clone),
    };
  }

  restoreArchive(archive: TimelineCreditsContributionArchive): void {
    this.contributors.clear();
    this.contributions.clear();
    this.evidence.clear();
    this.disputes.clear();
    this.manifests.clear();
    this.receipts.length = 0;
    archive.contributors.forEach((item) =>
      this.contributors.set(item.id, clone(item)),
    );
    archive.contributions.forEach((item) =>
      this.contributions.set(item.id, clone(item)),
    );
    archive.evidence.forEach((item) => this.evidence.set(item.id, clone(item)));
    archive.disputes.forEach((item) => this.disputes.set(item.id, clone(item)));
    archive.manifests.forEach((item) =>
      this.manifests.set(item.id, clone(item)),
    );
    this.receipts.push(...archive.receipts.map(clone));
    this.contributorSequence = this.highest(
      archive.contributors.map((item) => item.id),
    );
    this.contributionSequence = this.highest(
      archive.contributions.map((item) => item.id),
    );
    this.evidenceSequence = this.highest(
      archive.evidence.map((item) => item.id),
    );
    this.disputeSequence = this.highest(
      archive.disputes.map((item) => item.id),
    );
    this.manifestSequence = this.highest(
      archive.manifests.map((item) => item.id),
    );
    this.receiptSequence = this.highest(
      archive.receipts.map((item) => item.id),
    );
  }

  private requiredContributor(id: TimelineId): TimelineCreditContributor {
    const contributor = this.contributors.get(id);
    if (!contributor) throw new Error(`Unknown credit contributor: ${id}`);
    return clone(contributor);
  }

  private requiredContribution(id: TimelineId): TimelineContribution {
    const contribution = this.contributions.get(id);
    if (!contribution) throw new Error(`Unknown contribution: ${id}`);
    return clone(contribution);
  }

  private saveContribution(
    contribution: TimelineContribution,
  ): TimelineContribution {
    this.contributions.set(contribution.id, clone(contribution));
    return clone(contribution);
  }

  private invalidateProjectManifests(projectId: TimelineId): void {
    for (const [id, manifest] of this.manifests) {
      if (manifest.projectId === projectId) this.manifests.delete(id);
    }
  }

  private record(
    input: Omit<TimelineCreditReceipt, "id" | "recordedAt">,
  ): void {
    this.receipts.push({
      ...input,
      id: `timeline-credit-receipt-${++this.receiptSequence}`,
      recordedAt: this.now().toISOString(),
    });
  }

  private highest(ids: string[]): number {
    return ids.reduce(
      (highest, id) =>
        Math.max(highest, Number(id.match(/(\d+)$/)?.[1] ?? 0)),
      0,
    );
  }
}
