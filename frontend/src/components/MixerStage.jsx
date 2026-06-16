import { useState } from 'react';
import { RARITIES } from '../data/planets.js';
import PlanetOrb from './PlanetOrb.jsx';

// Core interaction. Two ways to fuse, both fully functional:
//  1. Drag a planet from the tray onto a socket, or directly onto another planet.
//  2. Tap/click a planet to fill socket A then socket B, then press Fuse.
// Drag uses HTML5 DnD for pointer devices; tap-to-select covers touch.
export default function MixerStage({ planets, onFuse, busy }) {
  const [slotA, setSlotA] = useState(null);
  const [slotB, setSlotB] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overSlot, setOverSlot] = useState(null);

  const findPlanet = (id) => planets.find((p) => p.id === id) || null;

  const place = (planet) => {
    // Tap-to-select: fill A, then B, then cycle.
    if (!slotA) {
      setSlotA(planet);
    } else if (slotA.id === planet.id) {
      setSlotA(null);
    } else if (!slotB) {
      setSlotB(planet);
    } else if (slotB.id === planet.id) {
      setSlotB(null);
    } else {
      setSlotB(planet);
    }
  };

  const tryFuse = (a, b) => {
    if (!a || !b || a.id === b.id || busy) return;
    onFuse(a, b);
    setSlotA(null);
    setSlotB(null);
  };

  const onDropToSlot = (slot, e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    const planet = findPlanet(id);
    setOverSlot(null);
    setDragId(null);
    if (!planet) return;
    if (slot === 'A') {
      if (slotB && slotB.id !== planet.id) {
        tryFuse(planet, slotB);
      } else {
        setSlotA(planet);
      }
    } else if (slotA && slotA.id !== planet.id) {
      tryFuse(slotA, planet);
    } else {
      setSlotB(planet);
    }
  };

  // Drag a planet directly onto another planet in the tray to fuse instantly.
  const onDropToPlanet = (target, e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    setDragId(null);
    if (!id || id === target.id) return;
    const source = findPlanet(id);
    if (source) tryFuse(source, target);
  };

  const bothFilled = !!(slotA && slotB && slotA.id !== slotB.id);
  const canMix = bothFilled && !busy;

  return (
    <section className="lab" id="mixer">
      <div className="lab__head">
        <span className="lab__eyebrow">Fusion Lab</span>
        <h2 className="section-title">Reactor Core</h2>
        <p className="lab__hint">
          Drag a world onto another to fuse, or tap two worlds and ignite the reactor.
        </p>
      </div>

      <div className={`reactor ${bothFilled ? 'reactor--charged' : ''}`}>
        <Socket
          label="World A"
          planet={slotA}
          over={overSlot === 'A'}
          onClear={() => setSlotA(null)}
          onDragOver={(e) => {
            e.preventDefault();
            setOverSlot('A');
          }}
          onDragLeave={() => setOverSlot(null)}
          onDrop={(e) => onDropToSlot('A', e)}
        />

        <div className={`conduit ${bothFilled ? 'conduit--charged' : ''}`} aria-hidden="true">
          <span className="conduit__line" />
          <span className="conduit__core">
            <span className="conduit__ring" />
            <span className="conduit__spark" />
          </span>
          <span className="conduit__line" />
        </div>

        <Socket
          label="World B"
          planet={slotB}
          over={overSlot === 'B'}
          onClear={() => setSlotB(null)}
          onDragOver={(e) => {
            e.preventDefault();
            setOverSlot('B');
          }}
          onDragLeave={() => setOverSlot(null)}
          onDrop={(e) => onDropToSlot('B', e)}
        />
      </div>

      <div className="lab__action">
        <button
          type="button"
          className={`fuse-btn ${canMix ? 'fuse-btn--ready' : ''}`}
          disabled={!canMix}
          onClick={() => tryFuse(slotA, slotB)}
        >
          <span className="fuse-btn__glow" aria-hidden="true" />
          <span className="fuse-btn__label">{busy ? 'Fusing...' : 'Fuse Worlds'}</span>
        </button>
      </div>

      <div className="tray-block">
        <div className="tray-block__head">
          <span className="tray-block__title">Planet Tray</span>
          <span className="tray-block__count">{planets.length} worlds</span>
        </div>
        <div className="tray" aria-label="Available worlds">
          {planets.map((p) => {
            const rarity = RARITIES[p.rarity] ?? RARITIES.Common;
            const selected = slotA?.id === p.id || slotB?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`tray__item ${selected ? 'tray__item--selected' : ''} ${
                  dragId === p.id ? 'tray__item--dragging' : ''
                }`}
                draggable={!busy}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', p.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setDragId(p.id);
                }}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDropToPlanet(p, e)}
                onClick={() => place(p)}
                title={`${p.name} (${p.rarity})`}
                style={{ '--rarity': rarity.color, '--rarity-glow': rarity.glow }}
              >
                <span className="tray__rarity" style={{ color: rarity.color }}>
                  {p.rarity}
                </span>
                <PlanetOrb planet={p} size={84} />
                <span className="tray__name">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Socket({ label, planet, over, onClear, onDragOver, onDragLeave, onDrop }) {
  return (
    <div className={`socket ${over ? 'socket--over' : ''} ${planet ? 'socket--filled' : 'socket--empty'}`}>
      <div
        className="socket__ring"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <span className="socket__halo" aria-hidden="true" />
        {planet ? (
          <button type="button" className="socket__planet" onClick={onClear} title="Remove world">
            <PlanetOrb planet={planet} size={148} />
          </button>
        ) : (
          <span className="socket__placeholder">Drop a world</span>
        )}
      </div>
      <span className="socket__label">{label}</span>
      <span className="socket__name">{planet ? planet.name : 'Empty'}</span>
    </div>
  );
}
