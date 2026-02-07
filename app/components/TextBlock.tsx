"use client";

import React from "react";

type Props = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  selected: boolean;
  locked: boolean;

  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onChangeText: (id: string, nextText: string) => void;
};

export default function TextBlock(props: Props) {
  const { id, x, y, w, h, text, selected, locked, onPointerDown, onChangeText } = props;

  return (
    <div
      className={[
        "absolute rounded-lg border bg-white shadow-sm",
        "select-none",
        locked ? "opacity-95" : "",
        selected ? "border-zinc-900 ring-2 ring-zinc-900/20" : "border-zinc-200 hover:border-zinc-400",
      ].join(" ")}
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        touchAction: "none",
      }}
    >
      <div className="flex h-full flex-col">
        <div
          onPointerDown={(e) => onPointerDown(e, id)}
          className="flex cursor-move items-center justify-between border-b px-3 py-2 text-xs text-zinc-600"
          style={{ touchAction: "none" }}
        >
          <span className="flex items-center gap-2">
            <span>Text</span>
            {locked ? (
              <span className="rounded bg-zinc-200 px-2 py-0.5 text-zinc-800">Locked</span>
            ) : null}
          </span>

          {selected ? (
            <span className="rounded bg-zinc-900 px-2 py-0.5 text-white">Selected</span>
          ) : null}
        </div>

        <textarea
          value={text}
          onChange={(e) => onChangeText(id, e.target.value)}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          className="h-full w-full resize-none rounded-b-lg bg-white px-3 py-2 text-sm outline-none"
          style={{ userSelect: "text" }}
        />
      </div>
    </div>
  );
}