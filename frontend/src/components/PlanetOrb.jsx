import { useState } from 'react';
import { planetImageUrl } from '../data/planets.js';
import { RARITIES } from '../data/planets.js';
import ProceduralPlanet from './ProceduralPlanet.jsx';

function seedFrom(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 97;
}

// Round planet with a soft rarity glow. Uses the bundled image when present,
// otherwise the procedural canvas fallback. Looks complete either way.
export default function PlanetOrb({ planet, size = 120 }) {
  const [broken, setBroken] = useState(false);
  const rarity = RARITIES[planet.rarity] ?? RARITIES.Common;
  const url = planet.image ? planetImageUrl(planet.image) : null;
  const showImage = url && !broken;

  return (
    <div
      className="orb"
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 ${size * 0.28}px ${rarity.glow}, 0 0 ${size * 0.12}px ${rarity.glow}`,
      }}
    >
      {showImage ? (
        <img
          src={url}
          alt={planet.name}
          width={size}
          height={size}
          loading="lazy"
          draggable={false}
          onError={() => setBroken(true)}
        />
      ) : (
        <ProceduralPlanet
          colorA={planet.colorA}
          colorB={planet.colorB}
          size={size}
          seed={seedFrom(planet.id || planet.name || 'x')}
        />
      )}
    </div>
  );
}
