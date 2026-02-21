"use client";

type Props = {
  text: string;
};

export default function TextBlock({ text }: Props) {
  return (
    <div className="rounded border p-4 bg-white shadow-sm">
      {text}
    </div>
  );
}