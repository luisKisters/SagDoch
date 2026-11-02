# SagDoch Redesign-Mockup

Interaktiver Klick-Prototyp der ganzen App mit echten Fragen aus `data/questions.csv`, plus Picker mit Varianten pro Element.

- `index.html` direkt im Browser öffnen, ohne Server.
- Picker rechts: Tabs = Bereiche, pro Element 2–3 Fassungen. ★ = Vorschlag, „Wie jetzt“ = aktueller Stand.
- Auswahl steht in der URL. `Feedback kopieren` legt alle Picks und Notizen in die Zwischenablage.
- `\` blendet den Picker aus, `[` und `]` wechseln die Tabs.

Bearbeiten: `src.html` ändern, dann `python3 build.py` (inlined `data.json` → `index.html`).
