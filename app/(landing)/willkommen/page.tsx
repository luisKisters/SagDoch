import Band from "../_components/Band";
import FactRows from "../_components/FactRows";
import InstallSteps from "../_components/InstallSteps";
import PackList from "../_components/PackList";
import PlayButton from "../_components/PlayButton";
import SampleTasks from "../_components/SampleTasks";
import s from "../_components/landing.module.css";
import { getLandingData } from "../_lib/content";

export default async function LandingPage() {
  const { packs, questionCount } = await getLandingData();
  // 576 -> „Über 550“, bleibt wahr, auch wenn ein paar Fragen wegfallen.
  const rounded = Math.floor(questionCount / 50) * 50;

  return (
    <main className={s.page}>
      <Band tone="pink" className={s.hero}>
        <div className={s.enter}>
          <h1 className={s.h1}>SagDoch</h1>
          <p className={s.lead}>
            Wahrheit oder Pflicht fürs Handy. Namen eintragen, Pack wählen,
            losspielen.
          </p>
          <SampleTasks />
        </div>
      </Band>

      <Band tone="night" className={s.cta}>
        <PlayButton />
        <p className={s.ctaNote}>Kostenlos. Ohne Anmeldung.</p>
      </Band>

      <Band tone="mint" label="Was ist SagDoch">
        <h2 className={s.h2}>Was ist SagDoch?</h2>
        <p className={s.sectionNote}>
          Ein Partyspiel im Browser. Du trägst die Namen ein, die App sagt, wer
          dran ist und ob Wahrheit oder Pflicht kommt. Mehr braucht es nicht.
        </p>
        <FactRows />
      </Band>

      <Band tone="pink" label="Packs">
        <h2 className={s.h2}>Die Packs</h2>
        <p className={s.sectionNote}>
          Über {rounded} Fragen in {packs.length} Packs. Du wählst vor jeder
          Runde.
        </p>
        <PackList packs={packs} />
      </Band>

      <Band tone="night" label="Installieren">
        <h2 className={s.h2}>Als App installieren</h2>
        <p className={s.sectionNote}>
          SagDoch ist eine PWA. Installiert startet es mit eigenem Icon und ohne
          Adressleiste, wie eine normale App. Ein Store ist nicht nötig.
        </p>
        <InstallSteps />
      </Band>

      <Band tone="mint" label="Spielen">
        <PlayButton />
      </Band>
    </main>
  );
}
