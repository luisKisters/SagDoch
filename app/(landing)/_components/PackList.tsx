import type { LandingPack } from "../_lib/content";
import s from "./landing.module.css";

export default function PackList({ packs }: { packs: LandingPack[] }) {
  return (
    <ul className={s.rows}>
      {packs.map((p) => (
        <li key={p.id} className={s.card}>
          <h3 className={s.cardName}>
            {p.name}
            {p.adult && !p.name.includes("18+") && (
              <span className={s.pill}>18+</span>
            )}
          </h3>
          {p.description && <p className={s.cardText}>{p.description}</p>}
        </li>
      ))}
    </ul>
  );
}
