// Core game data: base planets, rarity system, curated fusion rules, and a
// deterministic hybrid generator for any uncurated pair.

export const RARITIES = {
  Common: {
    name: 'Common',
    color: '#9fb3c8',
    glow: 'rgba(159,179,200,0.55)',
    frame: 'linear-gradient(135deg,#5b6b7f,#9fb3c8)',
    particles: 18,
    rank: 0,
  },
  Rare: {
    name: 'Rare',
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.6)',
    frame: 'linear-gradient(135deg,#0ea5e9,#67e8f9)',
    particles: 28,
    rank: 1,
  },
  Epic: {
    name: 'Epic',
    color: '#c084fc',
    glow: 'rgba(192,132,252,0.65)',
    frame: 'linear-gradient(135deg,#9333ea,#e879f9)',
    particles: 40,
    rank: 2,
  },
  Legendary: {
    name: 'Legendary',
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.7)',
    frame: 'linear-gradient(135deg,#f59e0b,#fde68a)',
    particles: 56,
    rank: 3,
  },
  Mythic: {
    name: 'Mythic',
    color: '#fb7185',
    glow: 'rgba(251,113,133,0.78)',
    frame: 'linear-gradient(135deg,#e11d48,#fb7185,#f0abfc)',
    particles: 76,
    rank: 4,
  },
};

export const RARITY_ORDER = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];

// Eight base worlds, each with vivid distinct colors.
export const BASE_PLANETS = [
  {
    id: 'ocean',
    name: 'Ocean Planet',
    element: 'Ocean',
    colorA: '#38bdf8',
    colorB: '#0ea5e9',
    rarity: 'Common',
    ability: 'Tidal Flow',
    description: 'A peaceful blue world covered by endless oceans.',
    image: 'ocean',
    base: true,
  },
  {
    id: 'fire',
    name: 'Fire Planet',
    element: 'Fire',
    colorA: '#fb923c',
    colorB: '#ef4444',
    rarity: 'Common',
    ability: 'Magma Surge',
    description: 'A molten world wrapped in rivers of living flame.',
    image: 'fire',
    base: true,
  },
  {
    id: 'ice',
    name: 'Ice Planet',
    element: 'Ice',
    colorA: '#bae6fd',
    colorB: '#7dd3fc',
    rarity: 'Common',
    ability: 'Frost Bind',
    description: 'A glittering frozen world of pale blue glaciers.',
    image: 'ice',
    base: true,
  },
  {
    id: 'metal',
    name: 'Metal Planet',
    element: 'Metal',
    colorA: '#cbd5e1',
    colorB: '#64748b',
    rarity: 'Common',
    ability: 'Iron Will',
    description: 'A steel grey world of vast machine continents.',
    image: 'metal',
    base: true,
  },
  {
    id: 'nature',
    name: 'Nature Planet',
    element: 'Nature',
    colorA: '#4ade80',
    colorB: '#16a34a',
    rarity: 'Common',
    ability: 'Verdant Bloom',
    description: 'A lush green world humming with living forests.',
    image: 'nature',
    base: true,
  },
  {
    id: 'shadow',
    name: 'Shadow Planet',
    element: 'Shadow',
    colorA: '#a78bfa',
    colorB: '#4c1d95',
    rarity: 'Common',
    ability: 'Umbral Veil',
    description: 'A violet dusk world cloaked in drifting shadow.',
    image: 'shadow',
    base: true,
  },
  {
    id: 'light',
    name: 'Light Planet',
    element: 'Light',
    colorA: '#fde047',
    colorB: '#facc15',
    rarity: 'Common',
    ability: 'Radiant Pulse',
    description: 'A golden world that glows with gentle starlight.',
    image: 'light',
    base: true,
  },
  {
    id: 'storm',
    name: 'Storm Planet',
    element: 'Storm',
    colorA: '#818cf8',
    colorB: '#4338ca',
    rarity: 'Common',
    ability: 'Chain Lightning',
    description: 'An indigo world ringed by perpetual thunderheads.',
    image: 'storm',
    base: true,
  },
];

export const BASE_BY_ID = Object.fromEntries(BASE_PLANETS.map((p) => [p.id, p]));
export const BASE_BY_ELEMENT = Object.fromEntries(BASE_PLANETS.map((p) => [p.element, p]));

function comboKey(elementA, elementB) {
  return [elementA, elementB].sort().join('+');
}

// Eight curated fusions, each pointing at a bundled image id.
const CURATED = [
  {
    a: 'Ocean',
    b: 'Fire',
    name: 'Steam Planet',
    rarity: 'Rare',
    ability: 'Mist Shield',
    image: 'steam',
    colorA: '#e0f2fe',
    colorB: '#fb923c',
    element: 'Steam',
    description: 'Where boiling seas meet open flame, an endless veil of mist is born.',
  },
  {
    a: 'Nature',
    b: 'Metal',
    name: 'Mecha Forest Planet',
    rarity: 'Epic',
    ability: 'Living Machine',
    image: 'mecha-forest',
    colorA: '#4ade80',
    colorB: '#94a3b8',
    element: 'Technoflora',
    description: 'Forests of chrome and chlorophyll, a world that grows its own machines.',
  },
  {
    a: 'Ice',
    b: 'Shadow',
    name: 'Frozen Void Planet',
    rarity: 'Epic',
    ability: 'Glacial Eclipse',
    image: 'frozen-void',
    colorA: '#bae6fd',
    colorB: '#4c1d95',
    element: 'Voidfrost',
    description: 'A silent world of black ice where light itself freezes solid.',
  },
  {
    a: 'Light',
    b: 'Storm',
    name: 'Solar Tempest Planet',
    rarity: 'Legendary',
    ability: 'Aurora Storm',
    image: 'solar-tempest',
    colorA: '#fde047',
    colorB: '#4338ca',
    element: 'Plasma',
    description: 'A radiant world where golden suns ride violent rivers of lightning.',
  },
  {
    a: 'Ocean',
    b: 'Nature',
    name: 'Bloom Reef Planet',
    rarity: 'Rare',
    ability: 'Coral Genesis',
    image: 'bloom-reef',
    colorA: '#38bdf8',
    colorB: '#4ade80',
    element: 'Reef',
    description: 'Living reefs paint warm shallow seas in every shade of life.',
  },
  {
    a: 'Metal',
    b: 'Storm',
    name: 'Thunder Core Planet',
    rarity: 'Epic',
    ability: 'Overcharge',
    image: 'thunder-core',
    colorA: '#cbd5e1',
    colorB: '#4338ca',
    element: 'Voltsteel',
    description: 'A magnetic forge world humming with caged thunder at its core.',
  },
  {
    a: 'Fire',
    b: 'Shadow',
    name: 'Infernal Eclipse Planet',
    rarity: 'Legendary',
    ability: 'Dark Flame',
    image: 'infernal-eclipse',
    colorA: '#ef4444',
    colorB: '#4c1d95',
    element: 'Hellfire',
    description: 'A world of black suns and violet fire that devours the dawn.',
  },
  {
    a: 'Ice',
    b: 'Light',
    name: 'Crystal Dawn Planet',
    rarity: 'Rare',
    ability: 'Prism Veil',
    image: 'crystal-dawn',
    colorA: '#bae6fd',
    colorB: '#fde047',
    element: 'Prism',
    description: 'Dawn refracts through endless crystal spires into rivers of color.',
  },
];

export const FUSION_RULES = {};
for (const c of CURATED) {
  FUSION_RULES[comboKey(c.a, c.b)] = {
    name: c.name,
    rarity: c.rarity,
    ability: c.ability,
    image: c.image,
    colorA: c.colorA,
    colorB: c.colorB,
    element: c.element,
    description: c.description,
    parents: [c.a, c.b],
    curated: true,
  };
}

// ---- deterministic helpers for the procedural fallback -------------------

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hexToRgb(hex) {
  const v = hex.replace('#', '');
  const n = parseInt(v.length === 3 ? v.split('').map((c) => c + c).join('') : v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r, g, b) {
  const c = (x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function blendColors(hexA, hexB, t = 0.5) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
}

function blendName(a, b) {
  const left = a.slice(0, Math.max(2, Math.ceil(a.length / 2)));
  const right = b.slice(Math.floor(b.length / 2));
  let blended = (left + right).toLowerCase();
  blended = blended.charAt(0).toUpperCase() + blended.slice(1);
  return blended;
}

const ABILITY_BANK = [
  'Gravity Bloom',
  'Nova Drift',
  'Echo Pulse',
  'Quantum Tide',
  'Star Forge',
  'Phase Shift',
  'Solar Bind',
  'Astral Rift',
  'Ion Cascade',
  'Lumen Wake',
];

// Rarity weighting: more contrasting and higher-tier parents skew rarer.
function deriveRarity(a, b, seed) {
  const ra = RARITIES[a.rarity]?.rank ?? 0;
  const rb = RARITIES[b.rarity]?.rank ?? 0;
  const contrast = Math.abs(
    hexToRgb(a.colorA).r - hexToRgb(b.colorA).r,
  ) +
    Math.abs(hexToRgb(a.colorA).g - hexToRgb(b.colorA).g) +
    Math.abs(hexToRgb(a.colorA).b - hexToRgb(b.colorA).b);
  let score = ra + rb + (contrast > 240 ? 2 : contrast > 140 ? 1 : 0);
  score += seed % 3; // a touch of deterministic variety
  const idx = Math.max(0, Math.min(RARITY_ORDER.length - 1, score));
  return RARITY_ORDER[idx];
}

// Deterministic hybrid for any pair that is not in the curated rules.
export function generateHybridPlanet(a, b) {
  const elementA = a.element;
  const elementB = b.element;
  const seed = hashString(comboKey(elementA, elementB));
  const rarity = deriveRarity(a, b, seed);
  const name = `${blendName(elementA, elementB)} Planet`;
  const colorA = blendColors(a.colorA, b.colorA, 0.4);
  const colorB = blendColors(a.colorB, b.colorB, 0.6);
  const ability = ABILITY_BANK[seed % ABILITY_BANK.length];
  const element = `${elementA}/${elementB}`;
  const power = 20 + (seed % 60) + RARITIES[rarity].rank * 8;
  const description =
    `A hybrid world fusing ${elementA.toLowerCase()} and ${elementB.toLowerCase()}, ` +
    `where ${a.ability.toLowerCase()} meets ${b.ability.toLowerCase()}.`;
  return {
    id: `hybrid-${comboKey(elementA, elementB).replace(/\W+/g, '-').toLowerCase()}`,
    name,
    element,
    elements: [elementA, elementB],
    colorA,
    colorB,
    rarity,
    ability,
    power: Math.min(100, power),
    description,
    image: null, // forces the procedural canvas fallback
    parents: [a.id, b.id],
  };
}

// Resolve a fusion of two base/known planets into a result planet object.
export function resolveFusion(a, b) {
  const key = comboKey(a.element, b.element);
  const rule = FUSION_RULES[key];
  if (rule) {
    return {
      id: `fusion-${rule.image}`,
      name: rule.name,
      element: rule.element,
      elements: rule.parents,
      colorA: rule.colorA,
      colorB: rule.colorB,
      rarity: rule.rarity,
      ability: rule.ability,
      description: rule.description,
      image: rule.image,
      parents: [a.id, b.id],
      curated: true,
    };
  }
  return generateHybridPlanet(a, b);
}

export function planetImageUrl(image) {
  if (!image) return null;
  return `${import.meta.env.BASE_URL}planets/${image}.jpg`;
}
