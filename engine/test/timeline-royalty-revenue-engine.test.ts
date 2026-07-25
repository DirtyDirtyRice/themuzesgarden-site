import { describe, expect, it } from "vitest";

import { TimelineRoyaltyRevenueEngine } from "../../lib/timeline/TimelineRoyaltyRevenueEngine";

function setup() {
  const engine = new TimelineRoyaltyRevenueEngine();
  engine.analytics.restoreArchive({
    sources: [
      {
        id: "source-usd",
        packageId: "release-1",
        destinationId: "destination-1",
        destinationName: "DSP",
        externalReleaseId: "external-1",
        currency: "USD",
        status: "active",
        statementIds: ["statement-usd-1"],
        createdAt: "2026-08-01T00:00:00.000Z",
        createdBy: "member-1",
      },
      {
        id: "source-eur",
        packageId: "release-1",
        destinationId: "destination-2",
        destinationName: "Store",
        externalReleaseId: "external-2",
        currency: "EUR",
        status: "active",
        statementIds: ["statement-eur-1"],
        createdAt: "2026-08-01T00:00:00.000Z",
        createdBy: "member-1",
      },
    ],
    statements: [
      {
        id: "statement-usd-1",
        sourceId: "source-usd",
        packageId: "release-1",
        externalStatementId: "usd-1",
        fingerprint: "sha256-usd-1",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-01",
        currency: "USD",
        rows: [
          {
            date: "2026-08-01",
            territory: "US",
            plays: 1000,
            uniqueListeners: 700,
            saves: 100,
            downloads: 20,
            revenueMinorUnits: 1001,
          },
        ],
        importedAt: "2026-08-02T00:00:00.000Z",
        importedBy: "worker",
      },
      {
        id: "statement-eur-1",
        sourceId: "source-eur",
        packageId: "release-1",
        externalStatementId: "eur-1",
        fingerprint: "sha256-eur-1",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-01",
        currency: "EUR",
        rows: [
          {
            date: "2026-08-01",
            territory: "DE",
            plays: 500,
            uniqueListeners: 400,
            saves: 50,
            downloads: 10,
            revenueMinorUnits: 501,
          },
        ],
        importedAt: "2026-08-02T00:00:00.000Z",
        importedBy: "worker",
      },
    ],
    anomalies: [],
    receipts: [],
  });
  const agreement = engine.createAgreement({
    packageId: "release-1",
    name: "Band split",
    participants: [
      {
        name: "Artist",
        role: "artist",
        shareBasisPoints: 6000,
      },
      {
        name: "Producer",
        role: "producer",
        shareBasisPoints: 4000,
      },
    ],
    recoupmentParticipantIndex: 0,
    createdBy: "member-1",
  });
  engine.activateAgreement({
    agreementId: agreement.id,
    activatedBy: "member-2",
  });
  return { engine, agreement };
}

describe("TimelineRoyaltyRevenueEngine", () => {
  it("requires exact 100% basis-point splits", () => {
    const engine = new TimelineRoyaltyRevenueEngine();
    expect(() =>
      engine.createAgreement({
        packageId: "release-1",
        name: "Bad split",
        participants: [
          {
            name: "Artist",
            role: "artist",
            shareBasisPoints: 9999,
          },
        ],
        createdBy: "member-1",
      }),
    ).toThrow("exactly 100%");
  });

  it("settles immutable statements without losing rounding remainders", () => {
    const { engine, agreement } = setup();
    const settlements = engine.settleStatements({
      agreementId: agreement.id,
      statementIds: ["statement-usd-1"],
      createdBy: "accountant-1",
    });
    const settlement = settlements[0];
    expect(settlement.grossMinorUnits).toBe(1001);
    expect(
      settlement.allocations.reduce(
        (sum, allocation) => sum + allocation.amountMinorUnits,
        0,
      ),
    ).toBe(1001);
    expect(engine.balances(agreement.id).map((item) => item.payableMinorUnits)).toEqual([
      601,
      400,
    ]);
    expect(() =>
      engine.settleStatements({
        agreementId: agreement.id,
        statementIds: ["statement-usd-1"],
        createdBy: "accountant-1",
      }),
    ).toThrow("already settled");
  });

  it("keeps currencies separate and requires payment evidence", () => {
    const { engine, agreement } = setup();
    engine.settleStatements({
      agreementId: agreement.id,
      statementIds: ["statement-usd-1", "statement-eur-1"],
      createdBy: "accountant-1",
    });
    const balances = engine.balances(agreement.id);
    expect(new Set(balances.map((item) => item.currency))).toEqual(
      new Set(["USD", "EUR"]),
    );
    const artistUsd = balances.find(
      (item) => item.participantName === "Artist" && item.currency === "USD",
    )!;
    expect(() =>
      engine.recordPayment({
        agreementId: agreement.id,
        participantId: artistUsd.participantId,
        currency: "USD",
        amountMinorUnits: artistUsd.payableMinorUnits,
        reference: "",
        paidBy: "accountant-1",
      }),
    ).toThrow("reference");
    engine.recordPayment({
      agreementId: agreement.id,
      participantId: artistUsd.participantId,
      currency: "USD",
      amountMinorUnits: artistUsd.payableMinorUnits,
      reference: "bank-transfer-123",
      paidBy: "accountant-1",
    });
    expect(
      engine
        .balances(agreement.id)
        .find(
          (item) =>
            item.participantId === artistUsd.participantId &&
            item.currency === "USD",
        )?.payableMinorUnits,
    ).toBe(0);
  });

  it("recoups approved costs before distributing the remainder", () => {
    const { engine, agreement } = setup();
    engine.addRecoupableCost({
      agreementId: agreement.id,
      currency: "USD",
      amountMinorUnits: 300,
      description: "Approved mastering cost",
      approvedBy: "member-2",
    });
    const settlement = engine.settleStatements({
      agreementId: agreement.id,
      statementIds: ["statement-usd-1"],
      createdBy: "accountant-1",
    })[0];
    expect(settlement.recoupedMinorUnits).toBe(300);
    expect(settlement.distributableMinorUnits).toBe(701);
    expect(
      engine.getAgreement(agreement.id)?.recoupableBalanceByCurrency.USD,
    ).toBe(0);
    expect(
      settlement.allocations.reduce(
        (sum, allocation) => sum + allocation.amountMinorUnits,
        0,
      ),
    ).toBe(1001);
  });

  it("restores financial evidence and continues stable identities", () => {
    const { engine, agreement } = setup();
    engine.settleStatements({
      agreementId: agreement.id,
      statementIds: ["statement-usd-1"],
      createdBy: "accountant-1",
    });
    const restored = new TimelineRoyaltyRevenueEngine(engine.analytics);
    restored.restoreArchive(engine.exportArchive());
    expect(restored.listSettlements(agreement.id)[0].grossMinorUnits).toBe(1001);
    expect(restored.listReceipts()[0].id).toBe("timeline-royalty-receipt-1");
  });
});
