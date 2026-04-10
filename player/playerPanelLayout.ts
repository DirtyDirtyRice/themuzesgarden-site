import { useEffect, useMemo, useState } from "react";
import {
  getPlayerPanelWidthPx,
  getReservedRightSpacePx,
} from "./playerPanelSizing";

const LS_COMPACT_KEY = "muzes.globalPlayer.compact.v1";

export function usePlayerPanelLayout(open: boolean) {
  const [compact, setCompact] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 1440;
    return window.innerWidth;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(LS_COMPACT_KEY);
      setCompact(raw === "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function onResize() {
      setViewportWidth(window.innerWidth);
    }

    onResize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  function toggleCompact() {
    setCompact((v) => {
      const next = !v;

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LS_COMPACT_KEY, next ? "1" : "0");
        } catch {
          // ignore
        }
      }

      return next;
    });
  }

  const playerPanelWidthPx = useMemo(
    () => getPlayerPanelWidthPx(compact, viewportWidth),
    [compact, viewportWidth]
  );

  const reservedRightSpacePx = useMemo(
    () => getReservedRightSpacePx(open, compact, viewportWidth),
    [open, compact, viewportWidth]
  );

  useEffect(() => {
    if (typeof document === "undefined") return;

    const html = document.documentElement;
    const body = document.body;

    const previousHtmlVar = html.style.getPropertyValue(
      "--muzes-global-player-reserved-right"
    );
    const previousBodyPaddingRight = body.style.paddingRight;

    if (reservedRightSpacePx > 0) {
      html.style.setProperty(
        "--muzes-global-player-reserved-right",
        `${reservedRightSpacePx}px`
      );
      body.style.paddingRight = `var(--muzes-global-player-reserved-right)`;
    } else {
      html.style.removeProperty("--muzes-global-player-reserved-right");
      body.style.paddingRight = "";
    }

    return () => {
      if (previousHtmlVar) {
        html.style.setProperty(
          "--muzes-global-player-reserved-right",
          previousHtmlVar
        );
      } else {
        html.style.removeProperty("--muzes-global-player-reserved-right");
      }

      body.style.paddingRight = previousBodyPaddingRight;
    };
  }, [reservedRightSpacePx]);

  return {
    compact,
    setCompact,
    toggleCompact,
    viewportWidth,
    playerPanelWidthPx,
    reservedRightSpacePx,
  };
}