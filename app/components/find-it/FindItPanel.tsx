import FindItCurrentPagePanel from "./FindItCurrentPagePanel";
import FindItMoreInfoPreview from "./FindItMoreInfoPreview";
import FindItResultsPanel from "./FindItResultsPanel";
import FindItSearchBox from "./FindItSearchBox";
import FindItTargetPathPanel from "./FindItTargetPathPanel";
import { useFindItSearchController } from "./useFindItSearchController";

export default function FindItPanel({
  pathname,
  searchValue,
  onSearchChange,
}: {
  pathname: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
}) {
  const {
    canClearSearch,
    handleSearchChange,
    handleSearchKeyDown,
    hasFocusedTarget,
    hasSearchText,
    inputRef,
    isWaitingForDebounce,
    matches,
    resetFindItSearch,
    safeSelectedIndex,
    selectResult,
    selectedLabel,
    selectedResult,
    topResultLabel,
  } = useFindItSearchController({
    searchValue,
    onSearchChange,
  });

  return (
    <div className="border-t border-white/10 bg-black/95 px-4 py-4 md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 rounded-2xl border border-white/15 bg-white/[0.03] p-4 text-white shadow-2xl">
        <FindItSearchBox
          canClearSearch={canClearSearch}
          hasSearchText={hasSearchText}
          inputRef={inputRef}
          isWaitingForDebounce={isWaitingForDebounce}
          matchCount={matches.length}
          searchValue={searchValue}
          selectedIndex={safeSelectedIndex}
          selectedLabel={selectedLabel}
          topResultLabel={topResultLabel}
          onClear={resetFindItSearch}
          onKeyDown={handleSearchKeyDown}
          onSearchChange={handleSearchChange}
        />

        {hasFocusedTarget ? (
          <section className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.04] p-3">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-100/80">
              Selected destination first
            </p>

            <FindItTargetPathPanel
              pathname={pathname}
              selectedResult={selectedResult}
            />
          </section>
        ) : null}

        <div className="grid gap-3 xl:grid-cols-[0.85fr_1fr]">
          <FindItCurrentPagePanel pathname={pathname} />

          <FindItResultsPanel
            hasSearchText={hasSearchText}
            isWaitingForDebounce={isWaitingForDebounce}
            matches={matches}
            safeSelectedIndex={safeSelectedIndex}
            selectResult={selectResult}
          />
        </div>

        {!hasFocusedTarget ? (
          <FindItTargetPathPanel
            pathname={pathname}
            selectedResult={selectedResult}
          />
        ) : null}

        <FindItMoreInfoPreview />
      </div>
    </div>
  );
}