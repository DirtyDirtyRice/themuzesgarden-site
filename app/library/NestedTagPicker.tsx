"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TAGS, type TagCategory, type TagDefinition } from "../../lib/tagSystem";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "./libraryData";

type Props = {
  title: string;
  onPickTagId: (tagId: string) => void;
  excludeTagIds?: string[];
};

const buttonClass =
  "rounded-xl border border-white/25 bg-black px-3 py-2 text-sm font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]";

const pickerButtonClass =
  "w-full rounded-xl border border-white/25 bg-black px-3 py-2 text-left text-sm font-bold text-white transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]";

const tagButtonClass =
  "flex w-full items-center justify-between gap-3 rounded-xl border border-white/25 bg-black px-3 py-2 text-left transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]";

export default function NestedTagPicker(props: Props) {
  const { title, onPickTagId, excludeTagIds = [] } = props;

  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] =
    useState<TagCategory>("reference");
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (open && rootRef.current && !rootRef.current.contains(t)) {
        setOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const tagsByCategory = useMemo(() => {
    const map: Record<TagCategory, TagDefinition[]> = {
      genre: [],
      mood: [],
      instrument: [],
      production: [],
      energy: [],
      era: [],
      use: [],
      reference: [],
    };

    for (const t of TAGS) map[t.category].push(t);
    return map;
  }, []);

  const visibleTags = useMemo(() => {
    const list = tagsByCategory[activeCategory] ?? [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? list.filter((t) => t.label.toLowerCase().includes(q))
      : list;

    return filtered.filter((t) => !excludeTagIds.includes(t.id));
  }, [tagsByCategory, activeCategory, search, excludeTagIds]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={buttonClass}
      >
        {title} ▾
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[520px] max-w-[92vw] overflow-hidden rounded-2xl border border-white/25 bg-black">
          <div className="border-b border-white/25 bg-black px-4 py-3">
            <div className="text-sm font-bold text-white">{title}</div>
            <div className="mt-1 text-xs text-white/70">
              Step 1: choose a category. Step 2: choose a tag.
            </div>
          </div>

          <div className="grid grid-cols-12">
            <div className="col-span-5 border-r border-white/25 bg-black">
              <div className="space-y-2 p-2">
                {CATEGORY_ORDER.map((cat) => {
                  const isActive = cat === activeCategory;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat);
                        setSearch("");
                      }}
                      className={[
                        pickerButtonClass,
                        isActive ? "ring-1 ring-white/40" : "",
                      ].join(" ")}
                    >
                      {CATEGORY_LABEL[cat]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="col-span-7 bg-black">
              <div className="border-b border-white/25 p-3">
                <div className="text-xs font-bold text-white">
                  {CATEGORY_LABEL[activeCategory]}
                </div>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search within this category…"
                  className="mt-2 w-full rounded-xl border border-white/25 bg-black p-2 text-sm text-white outline-none placeholder:text-white/70 focus:ring-1 focus:ring-white/40"
                />
              </div>

              <div className="max-h-80 space-y-2 overflow-y-auto p-2">
                {visibleTags.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-white/70">
                    No tags found.
                  </div>
                ) : (
                  visibleTags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onPickTagId(t.id);
                      }}
                      className={tagButtonClass}
                    >
                      <span className="text-sm font-bold text-white">
                        {t.category === "reference"
                          ? `Sounds Like: ${t.label}`
                          : t.label}
                      </span>
                      <span className="text-xs text-white/70">
                        {CATEGORY_LABEL[t.category]}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-white/25 p-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={buttonClass}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}