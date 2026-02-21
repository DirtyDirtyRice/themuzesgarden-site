"use client";

import { Rnd } from "react-rnd";
import { useEffect, useRef, useState } from "react";
import type { PointerEventHandler } from "react";

type Block = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
};

type Props = {
  block: Block;
  selected: boolean;
  onSelect: (additive: boolean) => void;
  onChange: (id: number, updates: Partial<Block>) => void;
  onDragStop: (id: number, x: number, y: number) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  snapEnabled: boolean;
  grid: number;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
};

export default function TextBlock({
  block,
  selected,
  onSelect,
  onChange,
  onDragStop,
  onDelete,
  onDuplicate,
  snapEnabled,
  grid,
  onPointerDown,
}: Props) {
  const snap = snapEnabled ? ([grid, grid] as [number, number]) : undefined;

  const [isEditing, setIsEditing] = useState(false);
  const localRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selected) setIsEditing(false);
  }, [selected]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    onSelect(e.shiftKey);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    requestAnimationFrame(() => localRef.current?.focus());
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onChange(block.id, { text: e.currentTarget.textContent ?? "" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditing && (e.key === "Delete" || e.key === "Backspace")) {
      e.preventDefault();
      onDelete();
      return;
    }

    if (!isEditing && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
      e.preventDefault();
      onDuplicate();
      return;
    }

    if (!isEditing && e.key === "Enter") {
      e.preventDefault();
      setIsEditing(true);
      requestAnimationFrame(() => localRef.current?.focus());
      return;
    }

    if (isEditing && e.key === "Escape") {
      e.preventDefault();
      setIsEditing(false);
      return;
    }
  };

  return (
    <Rnd
      size={{ width: block.width, height: block.height }}
      position={{ x: block.x, y: block.y }}
      bounds="parent"
      enableResizing={!isEditing}
      disableDragging={isEditing}
      grid={snap}
      dragHandleClassName="drag-handle"
      onDragStop={(_, data) => onDragStop(block.id, data.x, data.y)}
      onResizeStop={(_, __, ref, ___, pos) => {
        onChange(block.id, {
          width: ref.offsetWidth,
          height: ref.offsetHeight,
          x: pos.x,
          y: pos.y,
        });
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        className={`h-full w-full rounded bg-white shadow-sm ${
          selected ? "ring-2 ring-blue-500" : "ring-1 ring-zinc-300"
        }`}
        style={{ userSelect: isEditing ? "text" : "none" }}
      >
        <div className="drag-handle flex items-center justify-between rounded-t bg-zinc-50 px-2 py-1 text-[11px] text-zinc-500 cursor-move select-none">
          <span>drag</span>
          {selected && !isEditing && (
            <span className="text-zinc-400">Double-click to edit</span>
          )}
        </div>

        <div className="p-2">
          <div
            ref={localRef}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onInput={handleInput}
            className="min-h-[24px] outline-none whitespace-pre-wrap"
          >
            {block.text}
          </div>

          {selected && !isEditing && (
            <div className="mt-2 flex gap-2">
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="rounded border px-2 py-1 text-xs"
              >
                Duplicate
              </button>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="rounded border px-2 py-1 text-xs"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </Rnd>
  );
}