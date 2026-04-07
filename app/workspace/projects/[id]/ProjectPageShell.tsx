"use client";

type Props = {
  header: React.ReactNode;
  tabs: React.ReactNode;
  content: React.ReactNode;
};

export default function ProjectPageShell(props: Props) {
  const { header, tabs, content } = props;

  return (
    <div className="space-y-4">
      <div>{header}</div>
      <div>{tabs}</div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        {content}
      </div>
    </div>
  );
}