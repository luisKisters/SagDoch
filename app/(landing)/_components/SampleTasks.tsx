import s from "./landing.module.css";

/**
 * Zwei Beispielaufgaben, so wie sie in der App oben stehen (Name fett, Zielperson unterstrichen).
 * Texte stammen aus data/questions.csv, Pack „Entspannt“.
 */
export default function SampleTasks() {
  return (
    <div className={s.sample}>
      <div>
        <div className={s.sampleLabel}>Wahrheit</div>
        <p className={s.sampleText}>
          <b>Armin</b>, was ist das Seltsamste, das gerade in deinem Kühlschrank
          liegt?
        </p>
      </div>
      <div>
        <div className={s.sampleLabel}>Pflicht</div>
        <p className={s.sampleText}>
          <b>Maria</b>, balanciere einen Löffel 10 Sekunden auf deiner Nase.
        </p>
      </div>
    </div>
  );
}
