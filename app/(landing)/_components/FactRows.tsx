import { Gift, Smartphone, UserX } from "lucide-react";
import s from "./landing.module.css";

const FACTS = [
  { icon: Gift, title: "Kostenlos", text: "Alle Packs sind frei." },
  { icon: UserX, title: "Ohne Anmeldung", text: "Kein Konto, keine E-Mail." },
  {
    icon: Smartphone,
    title: "Namen bleiben bei dir",
    text: "Die Spielerliste liegt nur auf deinem Gerät.",
  },
];

export default function FactRows() {
  return (
    <ul className={s.rows}>
      {FACTS.map(({ icon: Icon, title, text }) => (
        <li key={title} className={`${s.row} ${s.rowDark}`}>
          <Icon aria-hidden />
          <span>
            {title}
            <small>{text}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}
