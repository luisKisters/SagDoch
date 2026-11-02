"use client";

import { RefObject, useLayoutEffect } from "react";

/**
 * Schrumpft einzeilige Texte, bis sie in ihr Element passen. Nichts wird
 * abgeschnitten (lange Namen!). Läuft neu bei Größenänderung und sobald die
 * Schrift geladen ist.
 */
export function useFitText(
  ref: RefObject<HTMLElement | null>,
  deps: ReadonlyArray<unknown> = []
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    let base: string | null = null;
    const fit = () => {
      if (base === null) base = el.style.fontSize;
      el.style.fontSize = base;
      let fs = parseFloat(getComputedStyle(el).fontSize);
      const min = Math.max(12, fs * 0.4);
      while (el.scrollWidth > el.clientWidth + 0.5 && fs > min) {
        fs -= 1;
        el.style.fontSize = `${fs}px`;
      }
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    let alive = true;
    document.fonts?.ready.then(() => alive && fit());
    return () => {
      alive = false;
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
