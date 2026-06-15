# Planet Mixer

Fuse worlds. Discover galaxies.

Planet Mixer is a juicy 2D galaxy fusion game. You start with eight elemental
worlds and combine them to discover hybrid planets, each with its own name,
rarity, ability and lore. Rare combinations feel special: more particles, gold
frames and Mythic glows. Every discovery is saved to your local collection, and
your rarest finds can be registered on chain through GenLayer.

The whole experience runs as a fully static site (no live server) and is built
to deploy on GitHub Pages at `https://<user>.github.io/planet-mixer/`.

## What it is

- A cinematic scroll landing that flies you into the galaxy, then a full game.
- Eight base worlds: Ocean, Fire, Ice, Metal, Nature, Shadow, Light and Storm.
- Drag-and-drop fusion (with a tap-to-select fallback) that births hybrids.
- A rarity system: Common, Rare, Epic, Legendary and Mythic.
- A discovered-planets gallery with rarity filters and a detail panel.
- An animated Three.js galaxy background and a real particle burst on fusion.
- A GenLayer "Galaxy Codex": instant mock play by default, optional on-chain
  registration of discoveries when live mode is enabled.

## Run the frontend

From `frontend/`:

```bash
npm install
npm run dev     # local dev server
npm run build   # production build into dist/
npm run preview # preview the production build
```

The build is configured with `base: '/planet-mixer/'` so the static `dist/`
output works directly on GitHub Pages. Build output includes `dist/index.html`
and the planet art under `dist/planets/`.

## How to play

1. Scroll through the cinematic intro and press "Start mixing" to drop into the
   Fusion Lab.
2. Drag one world onto another to fuse them instantly, or tap two worlds to fill
   World A and World B, then press "Mix Planets".
3. Watch the two planets fly together, burst, and reveal a brand new hybrid card
   with its name, elements, rarity, ability and lore.
4. The hybrid is saved to your Galaxy Collection (and persists in localStorage).
   Hybrids can themselves be fused again to chase rarer worlds.
5. Use the rarity filters to browse your collection and click any world to
   inspect it in the detail panel.

Everything works on touch: drag-and-drop degrades to tap-to-select, touch
targets are at least 44px, and `prefers-reduced-motion` is respected throughout.

## Fusion rules and the procedural fallback

Fusion is resolved in `frontend/src/data/planets.js`:

- A curated `FUSION_RULES` map, keyed by the two sorted elements, defines eight
  hand-made results that point at bundled art:
  - Ocean + Fire = Steam Planet (Rare, Mist Shield)
  - Nature + Metal = Mecha Forest Planet (Epic, Living Machine)
  - Ice + Shadow = Frozen Void Planet (Epic)
  - Light + Storm = Solar Tempest Planet (Legendary)
  - Ocean + Nature = Bloom Reef Planet (Rare)
  - Metal + Storm = Thunder Core Planet (Epic)
  - Fire + Shadow = Infernal Eclipse Planet (Legendary)
  - Ice + Light = Crystal Dawn Planet (Rare)
- For any other pair, `generateHybridPlanet(a, b)` deterministically derives a
  blended name, combined elements, a rarity weighted by how contrasting and how
  high-tier the parents are, a blended main color, an ability and a description.
- Duplicates are avoided: if a world was already discovered, the reveal shows it
  already exists in your collection instead of adding it again.

## Rarity system

Five tiers, each with its own color and badge treatment:

- Common (slate), Rare (cyan), Epic (violet), Legendary (gold), Mythic (rose).

Rarer worlds get larger glows, gold or prismatic frames, and a bigger particle
burst during fusion.

## The canvas fallback when no image exists

The 16 bundled planet images live in `frontend/public/planets/`. Whenever a
fusion produces a world with no bundled image (every uncurated hybrid), the game
renders a procedural planet on a `<canvas>`: a circular world with a two-color
radial gradient drawn from the planet's colors, a soft glow aura, a rim light,
and a few orbiting particles. The game looks complete whether or not an image
exists, and the same fallback covers a missing or broken image file.

## GenLayer mode (mock by default, live registers on chain)

The GenLayer layer lives in `frontend/src/genlayer/`. The default is instant,
offline-friendly play:

- `useMockGenLayer = true` (default): fusions resolve locally from the rules and
  `generateHybridPlanet`. No wallet, no waiting. The Galaxy Codex panel shows a
  short explainer about on-chain registration.
- `useMockGenLayer = false` (live): the app talks to the deployed PlanetMixer
  Intelligent Contract on the GenLayer Bradbury testnet through `genlayer-js`.
  The contract is the canonical Galaxy Codex of discoveries.

Live interface:

- reads: `get_stats()`, `get_planets(start)`, `get_planet(key)`,
  `is_discovered(parentA, parentB)`.
- write: `fuse(parentA, parentB)` runs an AI Fusion Oracle across validators and
  mints the canonical hybrid (rarity, power 0-100, name, ability, lore, element).

A live `fuse` write takes 1 to 5 minutes under consensus, so it is exposed as a
deliberate "Register on GenLayer" action with a staged consensus screen
(submission, oracle drafting, validators agreeing, sealed). A leader timeout is
shown as "the oracle consults the stars", never as an error. The game stays
fully playable in mock mode with no wallet.

The deployed contract address and deploy transaction are placeholders in
`frontend/src/genlayer/contract.js` until deployment. The contract source lives
at `contracts/contract.py` (see `frontend/src/genlayer/CONTRACT_REFERENCE.md`).

## Optional local backend (not used by the static deploy)

`backend/server.js` is a small Node and Express server with a single endpoint,
`POST /api/generate-planet-image`, that builds a Gemini image prompt and calls
the Gemini API to generate more planet art during local development.

```bash
cd backend
cp .env.example .env   # then add your GEMINI_API_KEY
npm install
npm start
```

This server is ONLY for local development. The published static game does not
require it: it ships with the bundled images plus the canvas fallback. The API
key is read from `backend/.env` and is never hardcoded.

## Cinematic hero without video frames

`CinematicScrollHero` supports a scroll frame-scrub: it scrubs JPG sequences from
`public/cinematic/hero/` and `public/cinematic/fusion/` when those folders exist.
The frame paths and counts are a small `CINEMATIC` config at the top of the
component so they can be set after the source videos are sliced.

When the frame folders are absent (the default right now), the hero falls back to
a procedural Three.js galaxy fly-through driven by scroll: the camera flies
through a star tunnel toward a glowing nebula core while the overlay copy fades
in across scroll windows. The site looks great immediately with no video.

## Project layout

```
planet-mixer/
  contracts/contract.py        deployed Intelligent Contract (do not edit here)
  scripts/no-emoji.js          emoji gate (node scripts/no-emoji.js)
  backend/                     optional local Gemini art helper
  frontend/
    public/planets/            16 bundled planet images
    src/
      data/planets.js          base planets, rarities, fusion rules, hybrid gen
      genlayer/                genlayer-js client, contract pointer
      hooks/                   wallet, transaction, collection (localStorage)
      components/              galaxy bg, cinematic hero, mixer, gallery, codex
      App.jsx, main.jsx, index.css
```
