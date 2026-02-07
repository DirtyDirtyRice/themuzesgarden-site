export type Block = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  locked?: boolean;
};

export type CanvasPage = {
  id: string;
  name: string;
  blocks: Block[];
};

export type Snapshot = {
  pages: CanvasPage[];
  currentPageId: string;
  selectedByPage: Record<string, string[]>;
};

export type Point = {
  x: number;
  y: number;
};

/* ---------- ID ---------- */

export function uid() {
  const c = globalThis.crypto as Crypto | undefined;

  if (c?.randomUUID) return c.randomUUID();

  return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

/* ---------- GEOMETRY ---------- */

export function rectsIntersect(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
) {
  return !(
    a.x + a.w < b.x ||
    a.x > b.x + b.w ||
    a.y + a.h < b.y ||
    a.y > b.y + b.h
  );
}

export function dist2(a: Point, b: Point) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function snap(n: number, grid: number) {
  return Math.round(n / grid) * grid;
}

/* ---------- CLONE HELPERS ---------- */

export function clonePages(pages: CanvasPage[]): CanvasPage[] {
  return pages.map((p) => ({
    ...p,
    blocks: p.blocks.map((b) => ({ ...b })),
  }));
}

/* ---------- DEFAULT CONTENT ---------- */

export function defaultBlocks(): Block[] {
  return [
    { id: uid(), x: 80, y: 80, w: 220, h: 80, text: "Text box A", locked: false },
    { id: uid(), x: 360, y: 120, w: 240, h: 80, text: "Text box B", locked: false },
    { id: uid(), x: 180, y: 240, w: 260, h: 80, text: "Text box C", locked: false },
  ];
}

/* ---------- LOCAL STORAGE PARSERS ---------- */

export function safeParseSnapshot(raw: string | null): Snapshot | null {
  if (!raw) return null;

  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    if (!Array.isArray(obj.pages)) return null;
    if (typeof obj.currentPageId !== "string") return null;
    if (!obj.selectedByPage || typeof obj.selectedByPage !== "object") return null;

    const pages: CanvasPage[] = obj.pages.map((p: any) => ({
      id: String(p.id ?? uid()),
      name: String(p.name ?? "Page"),
      blocks: Array.isArray(p.blocks)
        ? p.blocks.map((b: any) => ({
            id: String(b.id ?? uid()),
            x: Number(b.x ?? 0),
            y: Number(b.y ?? 0),
            w: Number(b.w ?? 240),
            h: Number(b.h ?? 80),
            text: String(b.text ?? ""),
            locked: Boolean(b.locked ?? false),
          }))
        : [],
    }));

    const selectedByPage: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(obj.selectedByPage)) {
      selectedByPage[String(k)] = Array.isArray(v) ? v.map(String) : [];
    }

    const exists = pages.some((p) => p.id === obj.currentPageId);

    return {
      pages,
      currentPageId: exists ? obj.currentPageId : pages[0]?.id ?? uid(),
      selectedByPage,
    };
  } catch {
    return null;
  }
}

/* ---------- CLIPBOARD ---------- */

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}