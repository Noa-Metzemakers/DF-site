# DF-site

Persoonlijke **dark-fantasy site** (statische HTML/CSS/JS) rond TikTok-edits in dark-fantasy thema.

## Wat zit erin
`index.html` bevat:

- **Bewegende achtergrond** van de animated `.webp`-bestanden (`assets/bg/DF1.webp`, `VERT_DF2-1.webp`, `VERT_DF2-2.webp`) — ze wisselen elkaar af met een crossfade + zoom-effect
- **Hoofdpersonage DFGold** (gouden masker) — `assets/img/DFGold.jpg`, met eigen sectie en lore
- **Audiospeler** met het geüploade `assets/audio/VERT_DF2.flac` (FLAC 24-bit / 44,1 kHz, stereo)

## Bestanden
- `assets/bg/` — animated webp achtergronden (DF1, VERT_DF2-1, VERT_DF2-2)
- `assets/img/DFGold.jpg` — screenshot van DFGold met het gouden masker
- `assets/audio/VERT_DF2.flac` — audio van de edit
- `css/style.css` — dark theme met gouden accenten, responsive
- `js/script.js` — achtergrond-wisselaar, audio-knop, mobiel menu, scroll-reveal

## Lokaal bekijken
Open `index.html` in Chrome, Edge of Firefox (FLAC en animated webp worden breed ondersteund).
Nog beter: start een lokale server, bv. `python3 -m http.server 8000`, en ga naar `http://localhost:8000`.
In Safari: animated webp werkt, FLAC niet — daar zie je een downloadlink voor het .flac-bestand.
