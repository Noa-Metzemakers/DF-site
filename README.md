# ABYSSA — kronieken van het Afgrondkoninkrijk

Een meerdelige **dark-fantasy** site (statische HTML/CSS/JS) in verhaalvorm, rond de
eindeloos bewegende edits en het personage **Varynth, de Bewaker van de Afgrond**.

## Pagina's
- `index.html` — Proloog: hero, beelden uit de afgrond (looping webp's), de stem (audio), navigatie naar de kroniek
- `varynth.html` — Het personage: volledige beschrijving, titels, oath, quote en zijn grootste geheim
- `koninkrijken.html` — Koninkrijken & facties met Varynth als rode draad
- `legendes.html` — Vier fluisterverhalen (legendes)

## Sfeer & kleuren
Kleuren geïnspireerd op de webp-beelden: nachtblauw `#0a1128`, mist `#16213e`, indigo `#1a1a2e`,
bloedrood `#8f1d1d`, goud `#d4af37`, mistig tekstblauw `#cfd8e8`. Film-grain, vignette, flicker,
langzame crossfade/zoom op de achtergrond en incidentele "fluisteringen" voor de enge sfeer.

## Assets
- `assets/bg/DF1.webp`, `VERT_DF2-1.webp`, `VERT_DF2-2.webp` — animated webp, loop-count op `0` (oneindig)
- `assets/img/gouden-masker.jpg` — Varynth met het gouden masker
- `assets/audio/VERT_DF2.flac` — de stem van de afgrond (FLAC 24-bit / 44,1 kHz)

## Lokaal bekijken
Chrome, Edge of Firefox aangeraden (FLAC + animated webp). Lokale server: `python3 -m http.server 8000` → `http://localhost:8000`.
In Safari: animated webp werkt, FLAC niet — daar zie je een downloadlink voor de audio.
