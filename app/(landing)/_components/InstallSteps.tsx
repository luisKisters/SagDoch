import { Download, EllipsisVertical, Share } from "lucide-react";
import s from "./landing.module.css";

const STEPS = [
  {
    icon: Share,
    title: "iPhone und iPad (Safari)",
    text: "Teilen-Symbol antippen, dann „Zum Home-Bildschirm“.",
  },
  {
    icon: EllipsisVertical,
    title: "Android (Chrome)",
    text: "Menü mit den drei Punkten, dann „App installieren“.",
  },
  {
    icon: Download,
    title: "Desktop (Chrome, Edge)",
    text: "Installieren-Symbol rechts in der Adressleiste.",
  },
];

export default function InstallSteps() {
  return (
    <ul className={s.steps}>
      {STEPS.map(({ icon: Icon, title, text }) => (
        <li key={title} className={`${s.row} ${s.rowGlass}`}>
          <Icon aria-hidden />
          <span className={s.step}>
            {title}
            <small>{text}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}
