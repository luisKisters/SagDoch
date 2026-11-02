"use client";

import React, { useEffect, useRef } from "react";

interface ScrollListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Ändert sich der Wert, wird die Maske neu berechnet */
  watch?: unknown;
}

/** Scrollbare Liste, die oben/unten sanft ausblendet, wenn mehr da ist. */
export default function ScrollList({
  children,
  watch,
  className = "",
  ...rest
}: ScrollListProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      el.classList.toggle(
        "is-dn",
        el.scrollTop + el.clientHeight < el.scrollHeight - 4
      );
      el.classList.toggle("is-up", el.scrollTop > 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [watch]);

  return (
    <div ref={ref} className={`sd-list ${className}`} {...rest}>
      {children}
    </div>
  );
}
