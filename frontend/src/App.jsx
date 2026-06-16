import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Lenis from 'lenis';
import GalaxyBackground from './components/GalaxyBackground.jsx';
import CinematicScrollHero from './components/CinematicScrollHero.jsx';
import MixerStage from './components/MixerStage.jsx';
import FusionAnimation from './components/FusionAnimation.jsx';
import PlanetCard from './components/PlanetCard.jsx';
import Gallery from './components/Gallery.jsx';
import GalaxyCodex from './components/GalaxyCodex.jsx';
import { useCollection } from './hooks/useCollection.js';
import { BASE_PLANETS, resolveFusion } from './data/planets.js';

export default function App() {
  const { collection, add, has } = useCollection();
  const [fusing, setFusing] = useState(null); // { a, b, result }
  const [reveal, setReveal] = useState(null); // { planet, alreadyOwned }
  const [selected, setSelected] = useState(null);
  const gameRef = useRef(null);

  // Global smooth scroll via Lenis, paused for reduced-motion users.
  useEffect(() => {
    const reduce =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let raf = 0;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  // Tray = the 8 base worlds plus every hybrid discovered so far (enables chaining).
  const trayPlanets = useMemo(() => {
    const discovered = collection.filter((p) => !p.base);
    return [...BASE_PLANETS, ...discovered];
  }, [collection]);

  const handleFuse = useCallback((a, b) => {
    const result = resolveFusion(a, b);
    result.parentA = a.name;
    result.parentB = b.name;
    setFusing({ a, b, result });
  }, []);

  const handleFusionDone = useCallback(() => {
    setFusing((current) => {
      if (!current) return null;
      const { result } = current;
      const alreadyOwned = has(result.id);
      if (!alreadyOwned) add(result);
      setReveal({ planet: result, alreadyOwned });
      setSelected(result);
      return null;
    });
  }, [add, has]);

  const scrollToGame = useCallback(() => {
    const el = gameRef.current;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="app">
      <GalaxyBackground />

      <CinematicScrollHero onEnter={scrollToGame} />

      <main className="game" ref={gameRef}>
        <header className="game__masthead">
          <h1 className="game__title">PLANET MIXER</h1>
          <p className="game__tagline">Fuse worlds. Discover galaxies.</p>
        </header>

        <div className="game__grid">
          <MixerStage planets={trayPlanets} onFuse={handleFuse} busy={!!fusing} />

          <aside className="detail">
            <span className="detail__eyebrow">Analysis</span>
            <h2 className="section-title">World Detail</h2>
            {selected ? (
              <PlanetCard planet={selected} />
            ) : (
              <div className="detail__empty">
                <p>Fuse or pick a world to inspect its rarity, ability and lore here.</p>
              </div>
            )}
          </aside>
        </div>

        <Gallery collection={collection} onSelect={setSelected} selectedId={selected?.id} />

        <GalaxyCodex selected={selected && !selected.base ? selected : null} />

        <footer className="game__footer">
          <p>
            Planet Mixer, a galaxy fusion game on GenLayer. Built for a personal showcase.
          </p>
        </footer>
      </main>

      {fusing && (
        <FusionAnimation
          parentA={fusing.a}
          parentB={fusing.b}
          result={fusing.result}
          onDone={handleFusionDone}
        />
      )}

      {reveal && (
        <div className="reveal-backdrop" onClick={() => setReveal(null)}>
          <div className="reveal-modal" onClick={(e) => e.stopPropagation()}>
            <PlanetCard
              planet={reveal.planet}
              dramatic
              alreadyOwned={reveal.alreadyOwned}
              onClose={() => setReveal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
