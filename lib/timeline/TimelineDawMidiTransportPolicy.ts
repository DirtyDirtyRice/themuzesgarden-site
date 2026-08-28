export type TimelineDawMidiTransportCommand = "start" | "continue" | "stop";

export function resolveTimelineDawMidiTransportCommand(
  data: ArrayLike<number>,
): TimelineDawMidiTransportCommand | null {
  const bytes = Array.from(data);
  if (bytes[0] === 0xfa) return "start";
  if (bytes[0] === 0xfb) return "continue";
  if (bytes[0] === 0xfc) return "stop";

  const isUniversalRealtimeMmc = bytes.length >= 6
    && bytes[0] === 0xf0
    && bytes[1] === 0x7f
    && bytes[3] === 0x06
    && bytes.at(-1) === 0xf7;
  if (!isUniversalRealtimeMmc) return null;
  if (bytes[4] === 0x01) return "stop";
  if (bytes[4] === 0x02 || bytes[4] === 0x03) return "continue";
  return null;
}
