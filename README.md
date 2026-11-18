# DF-site — VERT_DF

Een mysterieuze, nostalgische **dark-fantasy site** (statische HTML/CSS/JS) rond de geüploade edits.

## Wat zit erin
`index.html` bevat:

- **Eindeloos bewegende .webp-achtergrond** — `assets/bg/DF1.webp`, `VERT_DF2-1.webp`, `VERT_DF2-2.webp`
  (animated webp, loop-count op `0` = oneindig) wisselen fullscreen af met crossfade + zoom
- **De figuur met het gouden masker** — `assets/img/gouden-masker.jpg` (naam expres onbekend, voor het mysterie)
- **De stem** — audiospeler met `assets/audio/VERT_DF2.flac`

## Kleuren
Geïnspireerd op de webp-beelden zelf: nachtblauw `#0a1128`, mist `#16213e`, indigo `#1a1a2e`,
zwart `#000000`, goud `#d4af37` (het masker), mistig tekstblauw `#cfd8e8`. Plus film-grain en
vignette voor de nostalgische sfeer.

## Bestanden
- `assets/bg/` — animated webp banden (loop = oneindig)
- `assets/img/gouden-masker.jpg` — screenshot van de figuur met het gouden masker
- `assets/audio/VERT_DF2.flac` — audio (FLAC 24-bit / 44,1 kHz)
- `css/style.css`, `js/script.js`

## Lokaal bekijken
Chrome, Edge of Firefox aangeraden (FLAC + animated webp). Lokale server: `python3 -m http.server 8000` → `http://localhost:8000`.
In Safari: animated webp werkt, FLAC niet — daar zie je een downloadlink voor het .flac-bestand.
