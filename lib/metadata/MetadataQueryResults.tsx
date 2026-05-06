"use client";

import { useState } from "react";
import type { MetadataQueryResult } from "./metadataQueryTypes";
import MetadataQueryResultCard from "./MetadataQueryResultCard";
import {
  asRecord,
  formatValue,
  getHighlightQuery,
  getPrimaryList,
} from "./metadataQueryResultsHelpers";

type MetadataQueryResultsProps = {
  result: MetadataQueryResult;
};

export default function MetadataQueryResults({
  result,
}: MetadataQueryResultsProps) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const resultRecord = asRecord(result) ?? {};
  const primaryList = getPrimaryList(resultRecord);
  const query = getHighlightQuery(resultRecord);

  const summaryEntries = Object.entries(resultRecord).filter(([key]) => {
    return !["results", "items", "matches", "entries", "rows"].includes(key);
  });

  return (
    <div className="mt-6 space-y-4 text-white">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-white">
              Query Results
            </h3>
            <p className="mt-1 text-sm text-white">
              {primaryList.length > 0
                ? `${primaryList.length} result${
                    primaryList.length === 1 ? "" : "s"
                  } found`
                : "No structured result list found"}
            </p>
          </div>
        </div>

        {primaryList.length > 0 ? (
          <div className="mt-4 space-y-3">
            {primaryList.map((item, index) => (
              <MetadataQueryResultCard
                key={`result-card-${index}`}
                item={item}
                index={index}
                query={query}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-white">
              Raw Result
            </div>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-sm leading-6 text-white">
              {formatValue(result)}
            </pre>
          </div>
        )}
      </div>

      {summaryEntries.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white">
                Result Summary
              </h4>
              <p className="mt-1 text-sm text-white">
                Deep query and debug information
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsSummaryOpen((current) => !current)}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
            >
              {isSummaryOpen ? "Hide Summary" : "Show Summary"}
            </button>
          </div>

          {isSummaryOpen ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {summaryEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-white"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                    {key}
                  </div>
                  <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white">
                    {formatValue(value)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}