# SagDoch - Partyspiele PWA

![Website Deploy](https://deploy-badge.vercel.app/?url=http%3A%2F%2Fsagdoch.luiskisters.com&name=SagDoch)

SagDoch ist eine Progressive Web App (PWA) für verschiedene Partyspiele wie Wahrheit oder Pflicht, Wer hat noch nie, und mehr.

## Aktuell implementiert

- **Wahrheit oder Pflicht**: Das klassische Partyspiel mit verschiedenen Fragenpacks
- **Spieler-Management**: Spieler hinzufügen mit Gender und Sexualität für gezielte Fragen
- **Fragenpack-System**: Verschiedene Themenpacks mit Unlock-Mechanismus

## Geplante Spiele

- **Wer hat noch nie**: Das beliebte Kennenlernspiel
- **Imposter**: Weitere Partyspiele folgen

## Getting Started

First, install dependencies and run the development server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Orbitron](https://fonts.google.com/specimen/Orbitron) font.

# TODO

- [ ] MAKE SURE PLAYERS CAN QUIT/STOP/RESUME GAMES!
- [ ] add lang to packs/questions.

## PWA

- [x] Add install instructions and get PWA status
- [x] better pwa and website title
- [x] better pwa app preview images
- [ ] better pwa icon

## Features

- [x] Player Select
- [x] Pack Selection
- [x] Game Logic
- [ ] Wer hat noch nie Mode
- [ ] Imposter Mode
- [ ] Ad-based pack unlocks

## Screens

- Player Select

  - [ ] Better loading screen/loading state handling
  - [ ] player list fadding out at the bottom
  - [ ] higher lucide icon width
  - [ ] nicer buttons in player cards
  - [ ] make configuring players and delete button work
  - [ ] Sticky Spieler:innen heading

- Truth/Dare select screen
  - [ ] "Wahrheit" and "Pflicht" text sliding up to become the heading for the task
    - Prompt: okay now actually make it so that the same heading saying wahrheit and saying pflicht just actually w/ an animation slides up and under it the text appears with the task. please. it shouldnt fade out it should just slide to the top and then be the heading for the task.

# Ideas

- Design w/o border radius
- TTS
