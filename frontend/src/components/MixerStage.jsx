import { useState } from 'react';
import { RARITIES } from '../data/planets.js';
import PlanetOrb from './PlanetOrb.jsx';

// Core interaction. Two ways to fuse, both fully functional:
//  1. Drag a planet from the tray onto a slot, or directly onto another planet.
//  2. Tap/click a planet to fill slot A then slot B, then press Mix Planets.
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

  const canMix = slotA && slotB && slotA.id !== slotB.id && !busy;

  return (
    <section className="mixer" id="mixer">
      <h2 className="section-title">Fusion Lab</h2>
      <p className="mixer__hint">
        Drag a world onto another to fuse, or tap two worlds and press Mix Planets.
      </p>

      <div className="mixer__slots">
        <Slot
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

        <div className="mixer__plus" aria-hidden="true">
          +
        </div>

        <Slot
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

      <div className="mixer__action">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!canMix}
          onClick={() => tryFuse(slotA, slotB)}
        >
          {busy ? 'Fusing...' : 'Mix Planets'}
        </button>
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
              style={{ borderColor: rarity.color }}
            >
              <PlanetOrb planet={p} size={76} />
              <span className="tray__name">{p.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Slot({ label, planet, over, onClear, onDragOver, onDragLeave, onDrop }) {
  return (
    <div
      className={`slot ${over ? 'slot--over' : ''} ${planet ? 'slot--filled' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <span className="slot__label">{label}</span>
      {planet ? (
        <button type="button" className="slot__planet" onClick={onClear} title="Remove">
          <PlanetOrb planet={planet} size={110} />
          <span className="slot__name">{planet.name}</span>
        </button>
      ) : (
        <div className="slot__empty">Drop a world</div>
      )}
    </div>
  );
}
