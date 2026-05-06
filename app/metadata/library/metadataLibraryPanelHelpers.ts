export function getPanelTabClass(isActive: boolean) {
  return [
    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
    isActive
      ? "border-white bg-white text-black"
      : "border-white bg-black text-white",
  ].join(" ");
}