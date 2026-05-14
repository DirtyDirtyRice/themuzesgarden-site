import FindItCurrentPagePanel from "./FindItCurrentPagePanel";
import FindItMeaningPanel from "./FindItMeaningPanel";
import FindItMoreInfoPreview from "./FindItMoreInfoPreview";
import FindItPanelCommandCenter from "./FindItPanelCommandCenter";
import FindItPanelIntelligenceBoard from "./FindItPanelIntelligenceBoard";
import FindItPanelLayerShell from "./FindItPanelLayerShell";
import FindItPanelLayoutInfo from "./FindItPanelLayoutInfo";
import FindItResultsPanel from "./FindItResultsPanel";
import FindItSearchBox from "./FindItSearchBox";
import FindItTargetPathPanel from "./FindItTargetPathPanel";
import {
  buildFindItPanelModel,
  getPanelSectionStates,
} from "./FindItPanelStatusController";
import { useFindItPanelIntelligence } from "./useFindItPanelIntelligence";
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

  const model = buildFindItPanelModel({
    hasFocusedTarget,
    hasSearchText,
    isWaitingForDebounce,
    matches,
    pathname,
    safeSelectedIndex,
    searchValue,
    selectedResult,
  });

  const sectionStates = getPanelSectionStates({
    hasFocusedTarget,
    hasSearchText,
    isWaitingForDebounce,
    matchCount: model.matchCount,
    selectedResult: model.activeResult,
  });

  const intelligence = useFindItPanelIntelligence({
    activeResult: model.activeResult,
    cleanSearchValue: model.cleanSearchValue,
    hasFocusedTarget,
    hasSearchText,
    isWaitingForDebounce,
    matches,
    pathname,
    safeSelectedIndex,
    searchValue,
    sectionStates,
  });

  const shouldShowPromotedTargetPath =
    intelligence.decisions.targetPathPlacement === "promoted";

  const shouldShowStandardTargetPath =
    intelligence.decisions.targetPathPlacement === "standard" &&
    !shouldShowPromotedTargetPath;

  const meaningTitle =
    intelligence.decisions.meaningMode === "locked"
      ? "Meaning layer locked"
      : "Meaning layer";

  return (
    <div className="border-t border-white/10 bg-black/95 px-4 py-4 md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 rounded-2xl border border-white/15 bg-white/[0.03] p-4 text-white shadow-2xl">
        <FindItPanelCommandCenter model={model.commandCenter} />

        <FindItSearchBox
          canClearSearch={canClearSearch}
          hasSearchText={hasSearchText}
          inputRef={inputRef}
          isWaitingForDebounce={isWaitingForDebounce}
          matchCount={model.matchCount}
          searchValue={searchValue}
          selectedIndex={safeSelectedIndex}
          selectedLabel={selectedLabel}
          topResultLabel={topResultLabel}
          onClear={resetFindItSearch}
          onKeyDown={handleSearchKeyDown}
          onSearchChange={handleSearchChange}
        />

        <FindItPanelIntelligenceBoard intelligence={intelligence} />

        <FindItPanelLayoutInfo
          cleanSearchValue={model.cleanSearchValue}
          layout={model.layout}
          sectionStates={sectionStates}
        />

        {shouldShowPromotedTargetPath ? (
          <FindItPanelLayerShell
            badge="Path promoted"
            description={intelligence.decisions.decisionMessage}
            title="Selected destination first"
            tone="emerald"
          >
            <FindItTargetPathPanel
              pathname={pathname}
              selectedResult={model.activeResult}
            />
          </FindItPanelLayerShell>
        ) : null}

        <div className="grid gap-3 xl:grid-cols-[0.85fr_1fr]">
          <FindItCurrentPagePanel pathname={pathname} />

          <FindItResultsPanel
            hasSearchText={hasSearchText}
            isWaitingForDebounce={isWaitingForDebounce}
            matches={matches}
            safeSelectedIndex={safeSelectedIndex}
            searchValue={searchValue}
            selectResult={selectResult}
          />
        </div>

        <FindItPanelLayerShell
          badge={intelligence.layerBadges.meaning.badge}
          description={
            intelligence.decisions.shouldLockMeaning
              ? intelligence.decisions.decisionMessage
              : intelligence.layerBadges.meaning.description
          }
          title={meaningTitle}
          tone={intelligence.layerBadges.meaning.tone}
        >
          <FindItMeaningPanel
            matches={matches}
            safeSelectedIndex={safeSelectedIndex}
            searchText={searchValue}
          />
        </FindItPanelLayerShell>

        {shouldShowStandardTargetPath ? (
          <FindItPanelLayerShell
            badge={intelligence.layerBadges.targetPath.badge}
            description={intelligence.layerBadges.targetPath.description}
            title="Target path layer"
            tone={intelligence.layerBadges.targetPath.tone}
          >
            <FindItTargetPathPanel
              pathname={pathname}
              selectedResult={model.activeResult}
            />
          </FindItPanelLayerShell>
        ) : null}

        <FindItPanelLayerShell
          badge={intelligence.layerBadges.moreInfo.badge}
          description={intelligence.layerBadges.moreInfo.description}
          title="More information layer"
          tone={intelligence.layerBadges.moreInfo.tone}
        >
          <FindItMoreInfoPreview />
        </FindItPanelLayerShell>
      </div>
    </div>
  );
}