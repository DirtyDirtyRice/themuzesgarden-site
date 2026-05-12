import { useMemo } from "react";

import { getNavigationNodeForPathname } from "@/lib/navigation/navigationPath";
import { getNavigationBreadcrumb } from "@/lib/navigation/navigationTree";

import FindItTreeStep from "./FindItTreeStep";

export default function FindItCurrentPagePanel({
  pathname,
}: {
  pathname: string;
}) {
  const currentNode = useMemo(
    () => getNavigationNodeForPathname(pathname),
    [pathname],
  );
  const currentSteps = useMemo(() => {
    if (!currentNode) {
      return ["The Muzes Garden"];
    }

    return getNavigationBreadcrumb(currentNode.id).map((node) => node.label);
  }, [currentNode]);
  const currentFinalStep = currentSteps[currentSteps.length - 1] ?? "Current page";

  return (
    <div className="rounded-xl border border-sky-300/25 bg-sky-300/10 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-100">
        Current page
      </p>

      <p className="mt-2 text-base font-semibold text-white">
        {currentNode?.label ?? "Current page"}
      </p>

      <p className="mt-1 text-xs leading-5 text-white/50">{pathname}</p>

      <div className="mt-3 flex flex-col gap-2">
        {currentSteps.map((step) => (
          <FindItTreeStep
            key={`current-${step}`}
            label={step}
            marker={step === currentFinalStep ? "here" : undefined}
          />
        ))}
      </div>
    </div>
  );
}