# DF-game — de games van ABYSSA

Aparte game-repo voor het dark-fantasy universum van [DF-site](https://github.com/Noa-Metzemakers/DF-site).
Statische HTML/CSS/JS, geen build step.

## Games
- `index.html` — startpagina met links naar beide games en de besturing
- `spel.html` — **Het Pad van Keldrin** (`js/spel.js`): interactief kies-je-pad tekstspel waarin je als Keldrin door het universum reist. Balans-meter (duisternis ↔ licht), geheugen-sterren die je kunt verliezen, verborgen keuzes en 9 einden (2 geheim).
- `game3d.html` — **De Vijf Relikwieën** (`js/game3d.js`, Three.js r160 via CDN importmap): third-person 3D-avontuur in een mistig nachtlandschap. Verzamel de 5 gouden relikwieën, spreek Grimwick aan bij The Hollow Lantern, breek de eed van het water bij Varynth en versla boss Malagor op de gebroken troon. Vereist WebGL.

## Besturing
- Tekstspel: klik door het verhaal en kies
- 3D-game: WASD / pijltjes — bewegen · muis slepen — camera · spatie of klik — aanval · shift — rennen · E — praten · F of ⛶-knop — fullscreen · op touch: joystick + knoppen

## Assets
`assets/` komt uit DF-site: de bewegende achtergronden (`assets/bg/`), de personage-afbeeldingen (`assets/img/`, o.a. Grimwick en het gouden masker van Varynth als portretten in de dialoogvensters) en de ambient audio `assets/audio/VERT_DF2.flac` ("de stem van de afgrond").

## Eigen 3D-modellen (optioneel)
NPC's, vijanden en de boss zijn standaard procedurale 3D-figuren. Wil je echte 3D-modellen (bijv. gemaakt van een personage-foto met Meshy/Tripo/CSM — export als **GLB**), plaats ze dan als:
- `assets/models/grimwick.glb`, `varynth.glb`, `malthor.glb`, `twin.glb`, `trio.glb` (NPC's)
- `assets/models/malagor.glb` (boss)

De game laadt ze automatisch (GLTFLoader via CDN) en verbergt dan het standaardfiguur. Zonder GLB blijft het procedurale figuur actief.

## Lokaal draaien
`python3 -m http.server 8000` → `http://localhost:8000`

Aanbevolen: Chrome, Edge of Firefox. De 3D-game heeft WebGL nodig en laadt Three.js vanaf een CDN.
