import { TimelineReleaseAnalyticsEngine } from "./TimelineReleaseAnalyticsEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineRoyaltyParticipant = {
  id: TimelineId;
  name: string;
  role: "artist" | "writer" | "producer" | "owner" | "other";
  shareBasisPoints: number;
};

export type TimelineRoyaltyAgreement = {
  id: TimelineId;
  packageId: TimelineId;
  name: string;
  participants: TimelineRoyaltyParticipant[];
  status: "draft" | "active" | "archived";
  recoupmentParticipantId: TimelineId | null;
  recoupableBalanceByCurrency: Record<string, number>;
  settlementIds: TimelineId[];
  createdAt: string;
  createdBy: TimelineUserId;
  activatedAt?: string;
  activatedBy?: TimelineUserId;
};

export type TimelineRoyaltyAllocation = {
  participantId: TimelineId;
  participantName: string;
  currency: string;
  amountMinorUnits: number;
};

export type TimelineRoyaltySettlement = {
  id: TimelineId;
  agreementId: TimelineId;
  packageId: TimelineId;
  statementIds: TimelineId[];
  currency: string;
  grossMinorUnits: number;
  recoupedMinorUnits: number;
  distributableMinorUnits: number;
  allocations: TimelineRoyaltyAllocation[];
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineRoyaltyPayment = {
  id: TimelineId;
  agreementId: TimelineId;
  participantId: TimelineId;
  currency: string;
  amountMinorUnits: number;
  reference: string;
  paidAt: string;
  paidBy: TimelineUserId;
};

export type TimelineRoyaltyReceipt = {
  id: TimelineId;
  agreementId: TimelineId;
  action:
    | "agreement-created"
    | "agreement-activated"
    | "recoupment-added"
    | "settlement-created"
    | "payment-recorded";
  message: string;
  recordedAt: string;
  recordedBy: string;
};

export type TimelineRoyaltyBalance = {
  participantId: TimelineId;
  participantName: string;
  currency: string;
  earnedMinorUnits: number;
  paidMinorUnits: number;
  payableMinorUnits: number;
};

export type TimelineRoyaltyRevenueArchive = {
  agreements: TimelineRoyaltyAgreement[];
  settlements: TimelineRoyaltySettlement[];
  payments: TimelineRoyaltyPayment[];
  receipts: TimelineRoyaltyReceipt[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function currencyCode(value: string): string {
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) {
    throw new Error("Royalty currency requires a three-letter code.");
  }
  return code;
}

export class TimelineRoyaltyRevenueEngine {
  private readonly agreements = new Map<TimelineId, TimelineRoyaltyAgreement>();
  private readonly settlements = new Map<TimelineId, TimelineRoyaltySettlement>();
  private readonly payments = new Map<TimelineId, TimelineRoyaltyPayment>();
  private readonly receipts: TimelineRoyaltyReceipt[] = [];
  private agreementSequence = 0;
  private participantSequence = 0;
  private settlementSequence = 0;
  private paymentSequence = 0;
  private receiptSequence = 0;

  constructor(
    readonly analytics = new TimelineReleaseAnalyticsEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  createAgreement(input: {
    packageId: TimelineId;
    name: string;
    participants: Array<
      Omit<TimelineRoyaltyParticipant, "id">
    >;
    recoupmentParticipantIndex?: number;
    createdBy: TimelineUserId;
  }): TimelineRoyaltyAgreement {
    if (!input.participants.length) {
      throw new Error("Royalty agreement requires participants.");
    }
    const participants = input.participants.map((participant) => {
      if (!participant.name.trim()) {
        throw new Error("Royalty participant name is required.");
      }
      if (
        !Number.isInteger(participant.shareBasisPoints) ||
        participant.shareBasisPoints < 0 ||
        participant.shareBasisPoints > 10_000
      ) {
        throw new Error("Royalty shares must use valid whole basis points.");
      }
      return {
        ...clone(participant),
        id: `timeline-royalty-participant-${++this.participantSequence}`,
        name: participant.name.trim(),
      };
    });
    if (
      participants.reduce(
        (total, participant) => total + participant.shareBasisPoints,
        0,
      ) !== 10_000
    ) {
      throw new Error("Royalty participant shares must total exactly 100%.");
    }
    const recoupmentIndex = input.recoupmentParticipantIndex;
    if (
      recoupmentIndex !== undefined &&
      (!Number.isInteger(recoupmentIndex) ||
        recoupmentIndex < 0 ||
        recoupmentIndex >= participants.length)
    ) {
      throw new Error("Recoupment participant index is invalid.");
    }
    const agreement: TimelineRoyaltyAgreement = {
      id: `timeline-royalty-agreement-${++this.agreementSequence}`,
      packageId: input.packageId,
      name: input.name.trim() || "Royalty agreement",
      participants,
      status: "draft",
      recoupmentParticipantId:
        recoupmentIndex === undefined
          ? null
          : participants[recoupmentIndex].id,
      recoupableBalanceByCurrency: {},
      settlementIds: [],
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.agreements.set(agreement.id, clone(agreement));
    this.record(
      agreement.id,
      "agreement-created",
      "Royalty agreement held in draft.",
      input.createdBy,
    );
    return clone(agreement);
  }

  activateAgreement(input: {
    agreementId: TimelineId;
    activatedBy: TimelineUserId;
  }): TimelineRoyaltyAgreement {
    const agreement = this.requiredAgreement(input.agreementId);
    if (agreement.status !== "draft") {
      throw new Error("Only a draft royalty agreement can be activated.");
    }
    const active = this.saveAgreement({
      ...agreement,
      status: "active",
      activatedAt: this.now().toISOString(),
      activatedBy: input.activatedBy,
    });
    this.record(
      agreement.id,
      "agreement-activated",
      "Human approved the 100% royalty split.",
      input.activatedBy,
    );
    return active;
  }

  addRecoupableCost(input: {
    agreementId: TimelineId;
    currency: string;
    amountMinorUnits: number;
    description: string;
    approvedBy: TimelineUserId;
  }): TimelineRoyaltyAgreement {
    const agreement = this.requiredAgreement(input.agreementId);
    if (agreement.status !== "active") {
      throw new Error("Recoupment requires an active agreement.");
    }
    if (!agreement.recoupmentParticipantId) {
      throw new Error("Agreement has no recoupment participant.");
    }
    if (
      !Number.isInteger(input.amountMinorUnits) ||
      input.amountMinorUnits <= 0
    ) {
      throw new Error("Recoupable cost must be a positive integer.");
    }
    if (!input.description.trim()) {
      throw new Error("Recoupable cost description is required.");
    }
    const currency = currencyCode(input.currency);
    const next = this.saveAgreement({
      ...agreement,
      recoupableBalanceByCurrency: {
        ...agreement.recoupableBalanceByCurrency,
        [currency]:
          (agreement.recoupableBalanceByCurrency[currency] ?? 0) +
          input.amountMinorUnits,
      },
    });
    this.record(
      agreement.id,
      "recoupment-added",
      `${input.description.trim()}: ${input.amountMinorUnits} ${currency} minor units.`,
      input.approvedBy,
    );
    return next;
  }

  settleStatements(input: {
    agreementId: TimelineId;
    statementIds: TimelineId[];
    createdBy: TimelineUserId;
  }): TimelineRoyaltySettlement[] {
    const agreement = this.requiredAgreement(input.agreementId);
    if (agreement.status !== "active") {
      throw new Error("Settlement requires an active royalty agreement.");
    }
    const statementIds = [...new Set(input.statementIds)];
    if (!statementIds.length) {
      throw new Error("Settlement requires analytics statements.");
    }
    const previouslySettled = new Set(
      [...this.settlements.values()]
        .filter((settlement) => settlement.agreementId === agreement.id)
        .flatMap((settlement) => settlement.statementIds),
    );
    if (statementIds.some((id) => previouslySettled.has(id))) {
      throw new Error("An analytics statement was already settled.");
    }
    const statements = this.analytics
      .listStatements()
      .filter((statement) => statementIds.includes(statement.id));
    if (statements.length !== statementIds.length) {
      throw new Error("Settlement references a missing analytics statement.");
    }
    if (statements.some((statement) => statement.packageId !== agreement.packageId)) {
      throw new Error("Analytics statement belongs to another release.");
    }
    const groups = new Map<string, typeof statements>();
    statements.forEach((statement) => {
      const group = groups.get(statement.currency) ?? [];
      group.push(statement);
      groups.set(statement.currency, group);
    });
    let working = clone(agreement);
    const created: TimelineRoyaltySettlement[] = [];
    for (const [currency, group] of groups) {
      const gross = group
        .flatMap((statement) => statement.rows)
        .reduce((sum, row) => sum + row.revenueMinorUnits, 0);
      const balance = working.recoupableBalanceByCurrency[currency] ?? 0;
      const recouped = Math.min(balance, gross);
      const distributable = gross - recouped;
      const allocations = this.allocate(
        working.participants,
        currency,
        distributable,
      );
      if (recouped && working.recoupmentParticipantId) {
        const participant = working.participants.find(
          (item) => item.id === working.recoupmentParticipantId,
        )!;
        allocations.push({
          participantId: participant.id,
          participantName: participant.name,
          currency,
          amountMinorUnits: recouped,
        });
      }
      const settlement: TimelineRoyaltySettlement = {
        id: `timeline-royalty-settlement-${++this.settlementSequence}`,
        agreementId: working.id,
        packageId: working.packageId,
        statementIds: group.map((statement) => statement.id),
        currency,
        grossMinorUnits: gross,
        recoupedMinorUnits: recouped,
        distributableMinorUnits: distributable,
        allocations,
        createdAt: this.now().toISOString(),
        createdBy: input.createdBy,
      };
      this.settlements.set(settlement.id, clone(settlement));
      created.push(settlement);
      working = {
        ...working,
        recoupableBalanceByCurrency: {
          ...working.recoupableBalanceByCurrency,
          [currency]: balance - recouped,
        },
        settlementIds: [...working.settlementIds, settlement.id],
      };
      this.record(
        working.id,
        "settlement-created",
        `Settled ${gross} ${currency} minor units from ${group.length} statement(s).`,
        input.createdBy,
      );
    }
    this.saveAgreement(working);
    return created.map(clone);
  }

  balances(agreementId: TimelineId): TimelineRoyaltyBalance[] {
    const agreement = this.requiredAgreement(agreementId);
    const values = new Map<string, TimelineRoyaltyBalance>();
    agreement.participants.forEach((participant) => {
      const currencies = new Set([
        ...[...this.settlements.values()]
          .filter((settlement) => settlement.agreementId === agreement.id)
          .map((settlement) => settlement.currency),
        ...[...this.payments.values()]
          .filter((payment) => payment.agreementId === agreement.id)
          .map((payment) => payment.currency),
      ]);
      currencies.forEach((currency) => {
        values.set(`${participant.id}:${currency}`, {
          participantId: participant.id,
          participantName: participant.name,
          currency,
          earnedMinorUnits: 0,
          paidMinorUnits: 0,
          payableMinorUnits: 0,
        });
      });
    });
    [...this.settlements.values()]
      .filter((settlement) => settlement.agreementId === agreement.id)
      .flatMap((settlement) => settlement.allocations)
      .forEach((allocation) => {
        const value = values.get(
          `${allocation.participantId}:${allocation.currency}`,
        )!;
        value.earnedMinorUnits += allocation.amountMinorUnits;
      });
    [...this.payments.values()]
      .filter((payment) => payment.agreementId === agreement.id)
      .forEach((payment) => {
        const value = values.get(
          `${payment.participantId}:${payment.currency}`,
        )!;
        value.paidMinorUnits += payment.amountMinorUnits;
      });
    values.forEach((value) => {
      value.payableMinorUnits =
        value.earnedMinorUnits - value.paidMinorUnits;
    });
    return [...values.values()]
      .filter(
        (value) =>
          value.earnedMinorUnits !== 0 || value.paidMinorUnits !== 0,
      )
      .sort(
        (a, b) =>
          a.currency.localeCompare(b.currency) ||
          a.participantId.localeCompare(b.participantId),
      )
      .map(clone);
  }

  recordPayment(input: {
    agreementId: TimelineId;
    participantId: TimelineId;
    currency: string;
    amountMinorUnits: number;
    reference: string;
    paidBy: TimelineUserId;
  }): TimelineRoyaltyPayment {
    const agreement = this.requiredAgreement(input.agreementId);
    if (agreement.status !== "active") {
      throw new Error("Payment requires an active royalty agreement.");
    }
    const participant = agreement.participants.find(
      (item) => item.id === input.participantId,
    );
    if (!participant) throw new Error("Royalty participant was not found.");
    const currency = currencyCode(input.currency);
    if (
      !Number.isInteger(input.amountMinorUnits) ||
      input.amountMinorUnits <= 0
    ) {
      throw new Error("Royalty payment must be a positive integer.");
    }
    if (!input.reference.trim()) {
      throw new Error("Royalty payment reference is required.");
    }
    const balance = this.balances(agreement.id).find(
      (item) =>
        item.participantId === participant.id && item.currency === currency,
    );
    if (!balance || input.amountMinorUnits > balance.payableMinorUnits) {
      throw new Error("Royalty payment exceeds the payable balance.");
    }
    const payment: TimelineRoyaltyPayment = {
      id: `timeline-royalty-payment-${++this.paymentSequence}`,
      agreementId: agreement.id,
      participantId: participant.id,
      currency,
      amountMinorUnits: input.amountMinorUnits,
      reference: input.reference.trim(),
      paidAt: this.now().toISOString(),
      paidBy: input.paidBy,
    };
    this.payments.set(payment.id, clone(payment));
    this.record(
      agreement.id,
      "payment-recorded",
      `Paid ${participant.name} ${payment.amountMinorUnits} ${currency} minor units.`,
      input.paidBy,
    );
    return clone(payment);
  }

  getAgreement(id: TimelineId): TimelineRoyaltyAgreement | null {
    const value = this.agreements.get(id);
    return value ? clone(value) : null;
  }

  listSettlements(agreementId?: TimelineId): TimelineRoyaltySettlement[] {
    return [...this.settlements.values()]
      .filter((item) => !agreementId || item.agreementId === agreementId)
      .map(clone);
  }

  listPayments(agreementId?: TimelineId): TimelineRoyaltyPayment[] {
    return [...this.payments.values()]
      .filter((item) => !agreementId || item.agreementId === agreementId)
      .map(clone);
  }

  listReceipts(agreementId?: TimelineId): TimelineRoyaltyReceipt[] {
    return this.receipts
      .filter((item) => !agreementId || item.agreementId === agreementId)
      .map(clone);
  }

  exportArchive(): TimelineRoyaltyRevenueArchive {
    return {
      agreements: [...this.agreements.values()].map(clone),
      settlements: [...this.settlements.values()].map(clone),
      payments: [...this.payments.values()].map(clone),
      receipts: this.receipts.map(clone),
    };
  }

  restoreArchive(archive: TimelineRoyaltyRevenueArchive): void {
    this.assertUnique(archive.agreements, "agreement");
    this.assertUnique(archive.settlements, "settlement");
    this.assertUnique(archive.payments, "payment");
    this.assertUnique(archive.receipts, "receipt");
    const agreementIds = new Set(archive.agreements.map((item) => item.id));
    if (
      archive.settlements.some((item) => !agreementIds.has(item.agreementId)) ||
      archive.payments.some((item) => !agreementIds.has(item.agreementId))
    ) {
      throw new Error("Royalty archive references a missing agreement.");
    }
    this.agreements.clear();
    this.settlements.clear();
    this.payments.clear();
    this.receipts.length = 0;
    archive.agreements.forEach((item) =>
      this.agreements.set(item.id, clone(item)),
    );
    archive.settlements.forEach((item) =>
      this.settlements.set(item.id, clone(item)),
    );
    archive.payments.forEach((item) =>
      this.payments.set(item.id, clone(item)),
    );
    this.receipts.push(...archive.receipts.map(clone));
    const sequence = (id: string) => Number(id.match(/(\d+)$/)?.[1] ?? 0);
    this.agreementSequence = Math.max(0, ...archive.agreements.map((item) => sequence(item.id)));
    this.participantSequence = Math.max(0, ...archive.agreements.flatMap((item) => item.participants).map((item) => sequence(item.id)));
    this.settlementSequence = Math.max(0, ...archive.settlements.map((item) => sequence(item.id)));
    this.paymentSequence = Math.max(0, ...archive.payments.map((item) => sequence(item.id)));
    this.receiptSequence = Math.max(0, ...archive.receipts.map((item) => sequence(item.id)));
  }

  private allocate(
    participants: TimelineRoyaltyParticipant[],
    currency: string,
    total: number,
  ): TimelineRoyaltyAllocation[] {
    const allocations = participants.map((participant) => ({
      participantId: participant.id,
      participantName: participant.name,
      currency,
      amountMinorUnits: Math.floor(
        (total * participant.shareBasisPoints) / 10_000,
      ),
    }));
    let remainder =
      total -
      allocations.reduce(
        (sum, allocation) => sum + allocation.amountMinorUnits,
        0,
      );
    for (const allocation of allocations) {
      if (!remainder) break;
      allocation.amountMinorUnits += 1;
      remainder -= 1;
    }
    return allocations;
  }

  private requiredAgreement(id: TimelineId): TimelineRoyaltyAgreement {
    const value = this.agreements.get(id);
    if (!value) throw new Error("Royalty agreement was not found.");
    return value;
  }

  private saveAgreement(
    value: TimelineRoyaltyAgreement,
  ): TimelineRoyaltyAgreement {
    this.agreements.set(value.id, clone(value));
    return clone(value);
  }

  private record(
    agreementId: TimelineId,
    action: TimelineRoyaltyReceipt["action"],
    message: string,
    recordedBy: string,
  ): void {
    this.receipts.push({
      id: `timeline-royalty-receipt-${++this.receiptSequence}`,
      agreementId,
      action,
      message,
      recordedAt: this.now().toISOString(),
      recordedBy,
    });
  }

  private assertUnique(
    values: Array<{ id: TimelineId }>,
    label: string,
  ): void {
    if (new Set(values.map((value) => value.id)).size !== values.length) {
      throw new Error(`Archive contains duplicate royalty ${label} IDs.`);
    }
  }
}
