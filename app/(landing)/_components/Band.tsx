import type { ReactNode } from "react";
import s from "./landing.module.css";

type Props = {
  tone: "pink" | "night" | "mint";
  children: ReactNode;
  className?: string;
  label?: string;
  id?: string;
};

/** Farbfläche über die volle Breite, Inhalt in einer Spalte von max. 560 px. */
export default function Band({ tone, children, className, label, id }: Props) {
  return (
    <section
      id={id}
      aria-label={label}
      className={`${s.band} ${s[tone]} ${className ?? ""}`}
    >
      <div className={s.col}>{children}</div>
    </section>
  );
}
