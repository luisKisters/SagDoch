# SagDoch Redesign: gelockte Entscheidungen

Gelockt am 2. November 2026 aus `design/mockup/`. Das Mockup ist die Spezifikation: `design/mockup/index.html` im Browser öffnen (ohne Server), durchklicken, nachbauen. Es öffnet direkt auf der gelockten Kombination:

`index.html#dir=mid&edit=inline&palette=neon&font=orbitron`

Alle anderen Varianten im Picker sind nur Referenz und werden nicht gebaut. Wo diese Datei und das Mockup sich widersprechen, gilt das Mockup. Ziel beim Umsetzen: sieht in der App genauso aus wie im Mockup oder besser, und überall einheitlicher, nie schlechter.

## Die Entscheidungen

| Bereich | Gelockt | Bedeutet |
|---|---|---|
| Bereiche | **A · Weiter in der Mitte** | Drei Bänder: Pink, Nachtband, Mint. Das Mittelband enthält nur den Weiter-Knopf. |
| Spieler anlegen | **Direkt in der Zeile** | Kein extra Screen. Unter dem neuen Namen klappt die Auswahl auf. |
| Farben | **Original** | `#FF005C` Pink, `#0F0F1B` Nacht, `#00FFC6` Mint |
| Schrift | **Orbitron** | Überall Orbitron, Fließtext leicht gesperrt (`letter-spacing: .02em`). |

## Bereichs-Regeln (gelten auf jedem Screen)

- **Zurück** immer oben links (48×48, Glas-Hintergrund). Im Spiel wird es zu **Pause**.
- **Titel** direkt rechts neben Zurück, eine Zeile, schrumpft bei langen Namen statt abzuschneiden.
- **Pink (oben):** worum es geht. Liste, Frage, gewähltes Pack, Name.
- **Mittelband (dunkel, fest ~96 px):** nur der Weiter-Knopf. Pink, volle Spaltenbreite, Pfeil rechts, drückt sich beim Tippen ein. Disabled = 35 % Deckkraft.
- **Mint (unten):** was du tust. Auswahl, Nebenaktionen.
- **Nebenaktionen** sind immer volle Zeilen (Icon, Text, Chevron), nie lose Pillen. „Spiel beenden“ rot.
- **Ausnahmen mit zwei Optionen:** Start (Wahrheit oder Pflicht / Ich hab noch nie) und Wer ist dran (Wahrheit / Pflicht). Dort sind Pink und Mint die Optionen, Weiter wird zu **Zufall**.
- **Texteingabe** sitzt immer direkt unter dem Titel, nie im unteren Drittel. Die Tastatur legt sich über den Inhalt (ca. 40 % der Höhe), nichts springt. In A bleibt Weiter über der Tastatur sichtbar. Enter im leeren Namensfeld = Weiter.
- **Breite:** Farbflächen gehen über die ganze Breite, Inhalt in einer Spalte von max. 560 px. Kein Handy-Rahmen, funktioniert auf Tablet und Desktop.

## Screens

- **Start:** oben „Wahrheit oder Pflicht“ (tippbar), unten „Ich hab noch nie“ ausgegraut „kommt bald“, Weiter = „Spielen“.
- **Spieler:** Namensfeld unter dem Titel, darunter die Liste, **neueste zuerst** (neuer Name erscheint direkt unter dem Feld, gleitet rein). Mint: Anzahl groß plus Hinweis. Weiter erst aktiv, wenn mind. 2 Leute und alle eingestellt sind.
- **Gender und Orientierung (inline):** nach Enter klappt unter dem neuen Namen „Name ist…“ mit allen Optionen auf, danach „Name steht auf…“. **Nichts vorausgewählt, nie durchschalten.** Optionen alphabetisch (Divers, Männlich, Weiblich / Ace, Bi, Hetero, Homo, Pan). Ungesetzt = gestrichelter Knopf „Gender wählen“ / „Steht auf…“. Danach ist die Tastatur wieder offen.
- **Packs:** oben groß das gewählte Pack mit Beschreibung, unten die Liste in Mint. Alle Packs frei, keine Schlösser, kein Freischalten.
- **Wer ist dran:** erst dunkler Screen „Wer ist dran?“, Namen rollen langsamer werdend durch, rasten in Mint ein, fliegen in den Titel. Erst dann erscheinen Wahrheit und Pflicht.
- **Zufall:** Wahrheit und Pflicht leuchten abwechselnd auf, immer langsamer, eins bleibt stehen, pulsiert, öffnet.
- **Aufgabe:** oben „Wahrheit“/„Pflicht“ plus Frage, Namen fett, Zielperson unterstrichen. Mint: Zeile „Andere Frage“ plus Pack · Runde. Weiter = nächste Person.
- **Pause:** oben „Pause“ mit Info (wer dran, Pack, Runde, wird gespeichert). Mint: Zeilen „Spieler ändern“, „Pack wechseln“, „Spiel beenden“. Weiter = „Weiterspielen“. Spiel bleibt gespeichert und lässt sich fortsetzen.

## Bewegung

Dezent: Screens blenden kurz ein (~300 ms), neue Spieler gleiten rein, neue Frage blendet weich ein, Pack-Wechsel kleiner Übergang, Weiter gibt beim Drücken nach. `prefers-reduced-motion` schaltet alles ab.

## Inhalte

- Fragen: `data/questions.csv` (überarbeitet, BST unverändert).
- Pack-Beschreibungen: `data/packs.csv` (kurz und trocken).

## Prüfen

Das Mockup hat Masken (Raster, Aufmerksamkeit, Daumenzone; Tasten R, H, D), um Platzierung zu vergleichen. Die App muss dieselben Positionen haben: Zurück, Titel und Weiter sitzen auf jedem Screen an derselben Stelle.
