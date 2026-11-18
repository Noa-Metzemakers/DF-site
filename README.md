# ABYSSA — kronieken van het Afgrondkoninkrijk

Een meerdelige **dark-fantasy** site (statische HTML/CSS/JS) in verhaalvorm, rond de
eindeloos bewegende edits, de audio en het universum rond **Varynth, de Bewaker van de Afgrond**.

## Pagina's
- `index.html` — **Proloog**: hero, vier eindeloos bewegende beelden (looping webp's), "de stem van de afgrond" (audio), kaarten naar de kroniek
- `varynth.html` — **Varynth**: volledig dossier (naam, titels, oorsprong, leeftijd, status, rol, quote, geheim)
- `personages.html` — **Personages**: Grimwick, Malthor, Thaerion, de Twin Echoes of Velen, het Waxen Trio (Morva, Vola & Zelyth), Malagor (hoofdschurk), Drakhor, Keldrin (hoofdpersonage) — met afbeelding, geheim, relaties en signature quote
- `koninkrijken.html` — **Koninkrijken & facties** met Varynth als rode draad
- `legendes.html` — **Vier legendes** in fluisterverhaal-stijl

## Assets
- `assets/bg/` — animated webp's, loop-count op `0` = oneindig (geverifieerd met libwebp): `VERT_DF2-1`, `VERT_DF2-2`, `malagor-walk`, `trio-play`
- `assets/img/` — personage-afbeeldingen: `gouden-masker.jpg` (Varynth), `grimwick.png`, `malthor.jpg`, `twin-echoes.jpg`, `waxen-trio.jpg`, `thaerion.png`, `keldrin.png`
- `assets/audio/VERT_DF2.flac` — de stem van de afgrond (FLAC 24-bit / 44,1 kHz)

## Sfeer & kleuren
Nachtblauw `#0a1128`, mist `#16213e`, indigo `#1a1a2e`, bloedrood `#8f1d1d`, goud `#d4af37` (uit de beelden zelf), mistig tekstblauw `#cfd8e8`. Film-grain, vignette, flicker, crossfade/zoom, dropcaps en incidentele "fluisteringen".

## Lokaal bekijken
Chrome, Edge of Firefox aangeraden (FLAC + animated webp). Lokale server: `python3 -m http.server 8000` → `http://localhost:8000`.
In Safari: animated webp werkt, FLAC niet — daar zie je een downloadlink voor de audio.
