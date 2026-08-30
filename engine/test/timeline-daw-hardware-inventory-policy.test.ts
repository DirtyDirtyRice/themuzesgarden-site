import { describe, expect, it } from "vitest";
import { createTimelineDawHardwareInventory } from "../../lib/timeline/TimelineDawHardwareInventoryPolicy";

describe("TimelineDawHardwareInventoryPolicy", () => {
  it("creates a current-tab input/output inventory without claiming physical verification", () => {
    const report = createTimelineDawHardwareInventory([
      { deviceId: "in-1", groupId: "interface", kind: "audioinput", label: " Scarlett 2i2 USB  " },
      { deviceId: "out-1", groupId: "interface", kind: "audiooutput", label: "Scarlett 2i2 USB" },
    ]);
    expect(report).toMatchObject({ status: "detected", inputCount: 1, outputCount: 1, hiddenLabelCount: 0, physicalConnectionsVerified: false, persistenceAllowed: false });
    expect(report.items.map((item) => item.displayName)).toEqual(["Scarlett 2i2 USB", "Scarlett 2i2 USB"]);
    expect(report.warnings.join(" ")).toMatch(/cannot verify cables/i);
  });

  it("discloses hidden labels and deduplicates repeated browser devices", () => {
    const report = createTimelineDawHardwareInventory([
      { deviceId: "default", groupId: "", kind: "audioinput", label: "" },
      { deviceId: "default", groupId: "", kind: "audioinput", label: "" },
    ]);
    expect(report).toMatchObject({ status: "labels-hidden", inputCount: 1, hiddenLabelCount: 1 });
    expect(report.items[0].displayName).toBe("Audio input 1");
  });

  it("holds an empty inventory", () => {
    expect(createTimelineDawHardwareInventory([])).toMatchObject({ status: "held-no-devices", items: [], inputCount: 0, outputCount: 0 });
  });
});
