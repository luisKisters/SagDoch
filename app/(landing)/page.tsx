import LandingPage from "./_components/LandingPage";
import { PLAY_HREF } from "./_lib/content";

// Läuft vor dem ersten Paint: Nur wer SagDoch als App geöffnet hat (Standalone), landet direkt im
// Spiel. Im Browser sehen alle die Landingpage, auch wer schon gespielt hat, damit möglichst viele
// den Installieren-Hinweis sehen. „Jetzt spielen“ ist ganz oben, ist also nur einen Klick entfernt.
const redirectScript = `(function(){try{
if(matchMedia("(display-mode: standalone)").matches||matchMedia("(display-mode: fullscreen)").matches||navigator.standalone===true){location.replace(${JSON.stringify(PLAY_HREF)})}
}catch(e){}})();`;

export default function HomePage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
      <LandingPage />
    </>
  );
}
