export type AnalyzeViewTab = {
  id: string;
  title: string;
  eyebrow: string;
};

type AnalyzeViewTabsProps = {
  tabs: AnalyzeViewTab[];
  activeView: string;
  onChange: (nextView: string) => void;
};

function getSectionButtonClass(isActive: boolean) {
  if (isActive) {
    return "border-white/30 bg-white/15 text-white";
  }

  return "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/10 hover:text-white";
}

export default function AnalyzeViewTabs({
  tabs,
  activeView,
  onChange,
}: AnalyzeViewTabsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-2xl border p-4 text-left transition ${getSectionButtonClass(
            activeView === tab.id,
          )}`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
            {tab.eyebrow}
          </p>

          <p className="mt-2 text-sm font-black">
            {tab.title}
          </p>
        </button>
      ))}
    </div>
  );
}