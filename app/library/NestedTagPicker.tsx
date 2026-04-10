"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TAGS, type TagCategory, type TagDefinition } from "../../lib/tagSystem";
import { CATEGORY_LABEL, CATEGORY_ORDER } from "./libraryData";

type Props = {
  title: string;
  onPickTagId: (tagId: string) => void;
  excludeTagIds?: string[];
};

export default function NestedTagPicker(props: Props) {
  const { title, onPickTagId, excludeTagIds = [] } = props;

  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TagCategory>("reference");
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (open && rootRef.current && !rootRef.current.contains(t)) setOpen(false);
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
    const filtered = q ? list.filter((t) => t.label.toLowerCase().includes(q)) : list;

    return filtered.filter((t) => !excludeTagIds.includes(t.id));
  }, [tagsByCategory, activeCategory, search, excludeTagIds]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border rounded-lg px-3 py-2 text-sm bg-white text-black hover:bg-gray-50 shadow-sm"
      >
        {title} ▾
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[520px] max-w-[92vw] border rounded-2xl bg-white shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b bg-white">
            <div className="text-sm font-semibold text-black">{title}</div>
            <div className="text-xs text-gray-600 mt-1">
              Step 1: choose a category. Step 2: choose a tag.
            </div>
          </div>

          <div className="grid grid-cols-12">
            <div className="col-span-5 border-r bg-gray-50">
              <div className="p-2">
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
                        "w-full text-left px-3 py-2 rounded-xl text-sm",
                        isActive
                          ? "bg-white text-black shadow-sm border"
                          : "text-gray-800 hover:bg-white/70",
                      ].join(" ")}
                    >
                      {CATEGORY_LABEL[cat]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="col-span-7 bg-white">
              <div className="p-3 border-b">
                <div className="text-xs font-semibold text-gray-700">
                  {CATEGORY_LABEL[activeCategory]}
                </div>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search within this category…"
                  className="mt-2 w-full border rounded-lg p-2 text-sm text-black bg-white"
                />
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {visibleTags.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-gray-600">No tags found.</div>
                ) : (
                  visibleTags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onPickTagId(t.id);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span className="text-sm text-black">
                        {t.category === "reference" ? `Sounds Like: ${t.label}` : t.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {CATEGORY_LABEL[t.category]}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="p-2 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm px-3 py-2 border rounded-lg bg-white hover:bg-gray-50"
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