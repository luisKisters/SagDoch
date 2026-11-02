import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PLAY_HREF } from "../_lib/content";
import s from "./landing.module.css";

export default function PlayButton() {
  return (
    <Link href={PLAY_HREF} className={s.play}>
      <span>Jetzt spielen</span>
      <ArrowRight aria-hidden strokeWidth={2.5} />
    </Link>
  );
}
