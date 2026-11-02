import LandingPage from "./_components/LandingPage";
import { PLAY_HREF } from "./_lib/content";
import { PLAYED_KEY } from "@/lib/played";

// Läuft vor dem ersten Paint: Wer die App installiert hat (Standalone) oder schon gespielt hat,
// landet direkt im Spiel statt auf der Landingpage. Bestehende Nutzer von vor diesem Flag erkennt
// der Fallback an der vorhandenen Spiel-DB (asynchron, daher nur ein kurzer Blitz, einmalig).
const redirectScript = `(function(){try{
var go=function(){location.replace(${JSON.stringify(PLAY_HREF)})};
if(matchMedia("(display-mode: standalone)").matches||navigator.standalone===true){return go()}
var ls=window.localStorage;
if(ls.getItem(${JSON.stringify(PLAYED_KEY)})||ls.getItem("sagdoch.game.v1")){return go()}
if(indexedDB.databases){indexedDB.databases().then(function(d){
if(d.some(function(x){return x.name==="truthOrDareDB"})){ls.setItem(${JSON.stringify(PLAYED_KEY)},"1");go()}
}).catch(function(){})}
}catch(e){}})();`;

export default function HomePage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
      <LandingPage />
    </>
  );
}
