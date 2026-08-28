import { describe, expect, it } from "vitest";
import { resolveTimelineDawMidiTransportCommand } from "../../lib/timeline/TimelineDawMidiTransportPolicy";

describe("timeline DAW MIDI transport policy", () => {
  it("maps MIDI System Real-Time transport messages", () => {
    expect(resolveTimelineDawMidiTransportCommand([0xfa])).toBe("start");
    expect(resolveTimelineDawMidiTransportCommand([0xfb])).toBe("continue");
    expect(resolveTimelineDawMidiTransportCommand([0xfc])).toBe("stop");
  });

  it("maps universal real-time MMC play, deferred play, and stop", () => {
    expect(resolveTimelineDawMidiTransportCommand([0xf0, 0x7f, 0x10, 0x06, 0x01, 0xf7])).toBe("stop");
    expect(resolveTimelineDawMidiTransportCommand([0xf0, 0x7f, 0x10, 0x06, 0x02, 0xf7])).toBe("continue");
    expect(resolveTimelineDawMidiTransportCommand([0xf0, 0x7f, 0x10, 0x06, 0x03, 0xf7])).toBe("continue");
  });

  it("ignores notes, controllers, clock pulses, and incomplete MMC", () => {
    expect(resolveTimelineDawMidiTransportCommand([0x90, 60, 127])).toBeNull();
    expect(resolveTimelineDawMidiTransportCommand([0xb0, 7, 100])).toBeNull();
    expect(resolveTimelineDawMidiTransportCommand([0xf8])).toBeNull();
    expect(resolveTimelineDawMidiTransportCommand([0xf0, 0x7f, 0x10, 0x06])).toBeNull();
  });
});
