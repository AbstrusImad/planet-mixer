import { useState } from 'react';
import { planetImageUrl } from '../data/planets.js';
import { RARITIES } from '../data/planets.js';
import ProceduralPlanet from './ProceduralPlanet.jsx';

function seedFrom(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 97;
}

// Perfectly circular planet with a soft rarity glow. Bulletproof shape:
// the wrapper takes a width only (capped by the size prop) and never a fixed
// height. The square 512x512 source defines the box height through its own
// aspect-ratio (see .orb img / .orb canvas in index.css), so no flex or grid
// parent can ever stretch it into an ellipse. Uses the bundled image when
// present, otherwise the procedural canvas fallback. Looks complete either way.
export default function PlanetOrb({ planet, size = 120 }) {
  const [broken, setBroken] = useState(false);
  const rarity = RARITIES[planet.rarity] ?? RARITIES.Common;
  const url = planet.image ? planetImageUrl(planet.image) : null;
  const showImage = url && !broken;

  return (
    <div
      className="orb"
      style={{
        width: '100%',
        maxWidth: size,
        boxShadow: `0 0 ${size * 0.3}px ${rarity.glow}, 0 0 ${size * 0.13}px ${rarity.glow}`,
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
