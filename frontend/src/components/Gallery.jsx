import { useMemo, useState } from 'react';
import { RARITIES, RARITY_ORDER } from '../data/planets.js';
import PlanetOrb from './PlanetOrb.jsx';

const FILTERS = ['All', ...RARITY_ORDER];

// Discovered-planets gallery with a counter, rarity filters, and a detail select.
export default function Gallery({ collection, onSelect, selectedId }) {
  const [filter, setFilter] = useState('All');

  const counts = useMemo(() => {
    const c = { All: collection.length };
    for (const r of RARITY_ORDER) c[r] = 0;
    for (const p of collection) if (c[p.rarity] !== undefined) c[p.rarity] += 1;
    return c;
  }, [collection]);

  const visible = useMemo(
    () => (filter === 'All' ? collection : collection.filter((p) => p.rarity === filter)),
    [collection, filter],
  );

  return (
    <section className="gallery" id="gallery">
      <div className="gallery__head">
        <div>
          <span className="gallery__eyebrow">Archive</span>
          <h2 className="section-title">Galaxy Collection</h2>
        </div>
        <div className="gallery__counter">
          <span className="gallery__counter-num">{collection.length}</span>
          <span className="gallery__counter-label">
            world{collection.length === 1 ? '' : 's'} discovered
          </span>
        </div>
      </div>

      <div className="filters" role="tablist" aria-label="Rarity filter">
        {FILTERS.map((f) => {
          const rarity = RARITIES[f];
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={active}
              className={`chip ${active ? 'chip--active' : ''}`}
              style={active && rarity ? { background: rarity.frame, color: '#0b0a1f' } : undefined}
              onClick={() => setFilter(f)}
            >
              {f}
              <span className="chip__count">{counts[f] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="gallery__empty">
          No worlds here yet. Fuse two planets above to discover your first hybrid.
        </p>
      ) : (
        <div className="gallery__grid">
          {visible.map((p) => {
            const rarity = RARITIES[p.rarity] ?? RARITIES.Common;
            return (
              <button
                key={p.id}
                type="button"
                className={`gallery__cell ${selectedId === p.id ? 'gallery__cell--active' : ''}`}
                onClick={() => onSelect(p)}
                style={{ '--rarity': rarity.color, '--rarity-glow': rarity.glow }}
              >
                <PlanetOrb planet={p} size={92} />
                <span className="gallery__cell-name">{p.name}</span>
                <span className="gallery__cell-rarity" style={{ color: rarity.color }}>
                  {p.rarity}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
