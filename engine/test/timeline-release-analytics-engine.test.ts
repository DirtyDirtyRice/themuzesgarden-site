import { describe, expect, it } from "vitest";

import { TimelineReleaseAnalyticsEngine } from "../../lib/timeline/TimelineReleaseAnalyticsEngine";

function setup() {
  const engine = new TimelineReleaseAnalyticsEngine();
  engine.publishing.restoreArchive({
    packages: [
      {
        id: "release-1",
        projectId: "project-1",
        masteringJobId: "master-1",
        masterFingerprint: "sha256-master",
        rightsRecordIds: ["rights-1"],
        metadata: {
          title: "Garden Song",
          primaryArtist: "The Muzes",
          writers: ["Writer"],
          releaseDate: "2026-08-01",
          language: "en",
          explicit: false,
          copyrightLine: "© 2026",
          productionLine: "℗ 2026",
        },
        artwork: {
          uri: "image://cover",
          fingerprint: "sha256-cover",
          width: 3000,
          height: 3000,
          mimeType: "image/png",
        },
        destinations: [
          {
            id: "destination-1",
            kind: "dsp",
            name: "DSP One",
            territories: ["WORLDWIDE"],
            status: "published",
            externalReleaseId: "external-1",
          },
          {
            id: "destination-2",
            kind: "download",
            name: "Store Two",
            territories: ["US"],
            status: "published",
            externalReleaseId: "external-2",
          },
        ],
        status: "published",
        issues: [],
        createdAt: "2026-07-24T00:00:00.000Z",
        createdBy: "member-1",
      },
    ],
    receipts: [],
  });
  const usd = engine.createSource({
    packageId: "release-1",
    destinationId: "destination-1",
    currency: "usd",
    createdBy: "member-1",
  });
  return { engine, usd };
}

describe("TimelineReleaseAnalyticsEngine", () => {
  it("imports immutable statements and rolls up territory totals", () => {
    const { engine, usd } = setup();
    engine.importStatement({
      sourceId: usd.id,
      externalStatementId: "statement-1",
      fingerprint: "sha256-statement-1",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-02",
      rows: [
        {
          date: "2026-08-01",
          territory: "us",
          plays: 100,
          uniqueListeners: 70,
          saves: 20,
          downloads: 3,
          revenueMinorUnits: 45,
        },
        {
          date: "2026-08-02",
          territory: "ca",
          plays: 50,
          uniqueListeners: 40,
          saves: 10,
          downloads: 2,
          revenueMinorUnits: 20,
        },
      ],
      importedBy: "analytics-worker",
    });
    const totals = engine.totals({ packageId: "release-1" });
    expect(totals.plays).toBe(150);
    expect(totals.revenueByCurrency).toEqual({ USD: 65 });
    expect(totals.territories.US.saves).toBe(20);
  });

  it("prevents duplicate IDs, duplicate fingerprints, and invalid rows", () => {
    const { engine, usd } = setup();
    const input = {
      sourceId: usd.id,
      externalStatementId: "statement-1",
      fingerprint: "sha256-statement-1",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-01",
      rows: [
        {
          date: "2026-08-01",
          territory: "US",
          plays: 10,
          uniqueListeners: 8,
          saves: 2,
          downloads: 0,
          revenueMinorUnits: 4,
        },
      ],
      importedBy: "analytics-worker",
    };
    engine.importStatement(input);
    expect(() =>
      engine.importStatement({ ...input, externalStatementId: "statement-2" }),
    ).toThrow("already imported");
    expect(() =>
      engine.importStatement({
        ...input,
        externalStatementId: "statement-3",
        fingerprint: "sha256-statement-3",
        rows: [{ ...input.rows[0], uniqueListeners: 20 }],
      }),
    ).toThrow("cannot exceed plays");
  });

  it("keeps incompatible currencies separate", () => {
    const { engine, usd } = setup();
    const eur = engine.createSource({
      packageId: "release-1",
      destinationId: "destination-2",
      currency: "EUR",
      createdBy: "member-1",
    });
    for (const [source, currency] of [
      [usd, "usd"],
      [eur, "eur"],
    ] as const) {
      engine.importStatement({
        sourceId: source.id,
        externalStatementId: `${currency}-1`,
        fingerprint: `sha256-${currency}-1`,
        periodStart: "2026-08-01",
        periodEnd: "2026-08-01",
        rows: [
          {
            date: "2026-08-01",
            territory: "US",
            plays: 10,
            uniqueListeners: 8,
            saves: 1,
            downloads: 1,
            revenueMinorUnits: 100,
          },
        ],
        importedBy: "analytics-worker",
      });
    }
    expect(engine.totals({ packageId: "release-1" }).revenueByCurrency).toEqual({
      USD: 100,
      EUR: 100,
    });
  });

  it("detects material performance drops against a real baseline", () => {
    const { engine, usd } = setup();
    engine.importStatement({
      sourceId: usd.id,
      externalStatementId: "trend-1",
      fingerprint: "sha256-trend-1",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-08",
      rows: [
        {
          date: "2026-08-01",
          territory: "US",
          plays: 1000,
          uniqueListeners: 700,
          saves: 200,
          downloads: 100,
          revenueMinorUnits: 400,
        },
        {
          date: "2026-08-08",
          territory: "US",
          plays: 200,
          uniqueListeners: 150,
          saves: 30,
          downloads: 10,
          revenueMinorUnits: 80,
        },
      ],
      importedBy: "analytics-worker",
    });
    const anomalies = engine.detectAnomalies({
      packageId: "release-1",
      previousStart: "2026-08-01",
      previousEnd: "2026-08-01",
      currentStart: "2026-08-08",
      currentEnd: "2026-08-08",
    });
    expect(anomalies.map((item) => item.metric).sort()).toEqual([
      "downloads",
      "plays",
      "saves",
    ]);
    expect(anomalies[0].direction).toBe("decrease");
  });

  it("restores raw evidence and continues stable identities", () => {
    const { engine, usd } = setup();
    engine.importStatement({
      sourceId: usd.id,
      externalStatementId: "statement-1",
      fingerprint: "sha256-statement-1",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-01",
      rows: [
        {
          date: "2026-08-01",
          territory: "US",
          plays: 10,
          uniqueListeners: 8,
          saves: 1,
          downloads: 0,
          revenueMinorUnits: 4,
        },
      ],
      importedBy: "analytics-worker",
    });
    const restored = new TimelineReleaseAnalyticsEngine(engine.publishing);
    restored.restoreArchive(engine.exportArchive());
    expect(restored.listStatements()[0].fingerprint).toBe("sha256-statement-1");
    expect(restored.listReceipts()[0].id).toBe(
      "timeline-release-analytics-receipt-1",
    );
  });
});
