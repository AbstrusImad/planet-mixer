import { RARITIES } from '../data/planets.js';
import PlanetOrb from './PlanetOrb.jsx';

// Large reveal card shown after a fusion (and reused in the detail panel).
export default function PlanetCard({ planet, dramatic = false, alreadyOwned = false, onClose }) {
  if (!planet) return null;
  const rarity = RARITIES[planet.rarity] ?? RARITIES.Common;
  const elementText = Array.isArray(planet.elements)
    ? planet.elements.join(' + ')
    : planet.element;

  return (
    <div className={`planet-card ${dramatic ? 'planet-card--reveal' : ''}`}>
      <div className="planet-card__frame" style={{ background: rarity.frame }}>
        <div className="planet-card__inner">
          {alreadyOwned && (
            <div className="planet-card__owned">Already in your collection</div>
          )}
          <div className="planet-card__orb">
            <PlanetOrb planet={planet} size={dramatic ? 220 : 150} />
          </div>
          <span className="rarity-badge" style={{ background: rarity.frame, color: '#0b0a1f' }}>
            {rarity.name}
          </span>
          <h3 className="planet-card__name">{planet.name}</h3>
          <p className="planet-card__element">{elementText}</p>
          <div className="planet-card__ability">
            <span className="planet-card__ability-label">Ability</span>
            <span className="planet-card__ability-name">{planet.ability}</span>
          </div>
          {typeof planet.power === 'number' && (
            <div className="planet-card__power">
              <div className="planet-card__power-bar">
                <span style={{ width: `${planet.power}%`, background: rarity.frame }} />
              </div>
              <span className="planet-card__power-num">Power {planet.power}</span>
            </div>
          )}
          <p className="planet-card__desc">{planet.description || planet.lore}</p>
          {onClose && (
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Keep mixing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
