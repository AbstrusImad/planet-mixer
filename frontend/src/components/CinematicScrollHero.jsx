import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// CINEMATIC FRAME CONFIG
// The parent process slices the source videos into JPG sequences and drops them
// under public/cinematic/hero/ and public/cinematic/fusion/. Set `count` to the
// number of frames produced (and adjust prefix/pad/ext if the slicer differs).
// While count is 0 OR the first frame fails to load, the hero falls back to a
// procedural Three.js galaxy fly-through so the site looks great with no video.
// ---------------------------------------------------------------------------
const CINEMATIC = {
  hero: {
    dir: 'cinematic/hero/',
    count: 0,
    prefix: 'frame_',
    pad: 4,
    ext: '.jpg',
  },
  fusion: {
    dir: 'cinematic/fusion/',
    count: 0,
    prefix: 'frame_',
    pad: 4,
    ext: '.jpg',
  },
};

const STAGE_VH = 500; // sticky scrub stage height

function framePath(cfg, i) {
  const n = String(i).padStart(cfg.pad, '0');
  return `${import.meta.env.BASE_URL}${cfg.dir}${cfg.prefix}${n}${cfg.ext}`;
}

function probeFirstFrame(cfg) {
  return new Promise((resolve) => {
    if (!cfg.count || cfg.count < 1) {
      resolve(false);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = framePath(cfg, 1);
  });
}

export default function CinematicScrollHero({ onEnter }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const progressRef = useRef(0);
  const [mode, setMode] = useState('loading'); // loading | frames | procedural
  const [copyStep, setCopyStep] = useState(0);

  // Decide between frame-scrub and procedural fallback.
  useEffect(() => {
    let cancelled = false;
    probeFirstFrame(CINEMATIC.hero).then((ok) => {
      if (!cancelled) setMode(ok ? 'frames' : 'procedural');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll progress (0..1) across the sticky stage, computed every frame.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const wrap = wrapRef.current;
      if (wrap) {
        const rect = wrap.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
        const p = total > 0 ? scrolled / total : 0;
        progressRef.current = p;
        const step = p < 0.18 ? 0 : p < 0.42 ? 1 : p < 0.7 ? 2 : 3;
        setCopyStep((prev) => (prev === step ? prev : step));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ---- frame-scrub renderer --------------------------------------------
  useEffect(() => {
    if (mode !== 'frames') return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const cfg = CINEMATIC.hero;
    const images = new Array(cfg.count + 1).fill(null);
    let loaded = 0;
    for (let i = 1; i <= cfg.count; i++) {
      const img = new Image();
      img.onload = () => {
        loaded += 1;
      };
      img.src = framePath(cfg, i);
      images[i] = img;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let lastIndex = -1;
    let raf = 0;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      lastIndex = -1;
    };
    resize();
    window.addEventListener('resize', resize);

    const drawCover = (img) => {
      if (!img || !img.complete || !img.naturalWidth) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = cw / ch;
      let dw;
      let dh;
      if (cr > ir) {
        dw = cw;
        dh = cw / ir;
      } else {
        dh = ch;
        dw = ch * ir;
      }
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };

    const loop = () => {
      const p = progressRef.current;
      const idx = Math.max(1, Math.min(cfg.count, Math.round(p * (cfg.count - 1)) + 1));
      if (idx !== lastIndex) {
        const img = images[idx] || images[lastIndex > 0 ? lastIndex : 1];
        drawCover(img);
        lastIndex = idx;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [mode]);

  // ---- procedural Three.js fly-through fallback ------------------------
  useEffect(() => {
    if (mode !== 'procedural') return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0a1f, 0.06);
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      120,
    );

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x05040f, 1);

    // a deep tunnel of stars the camera flies through
    const COUNT = 2600;
    const DEPTH = 90;
    const positions = new Float32Array(COUNT * 3);
    const colorChoices = [
      [0.75, 0.86, 1.0],
      [1.0, 0.9, 0.7],
      [1.0, 0.75, 0.95],
      [0.7, 1.0, 0.9],
    ];
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = 2 + Math.random() * 14;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = Math.sin(a) * r;
      positions[i * 3 + 2] = -Math.random() * DEPTH;
      const c = colorChoices[(Math.random() * colorChoices.length) | 0];
      colors[i * 3] = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(geo, mat);
    scene.add(stars);

    // a glowing central nebula sphere as the destination
    const coreGeo = new THREE.SphereGeometry(1.4, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.5,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.z = -DEPTH + 6;
    scene.add(core);

    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', resize);

    let raf = 0;
    let running = true;
    const clock = new THREE.Clock();
    const render = () => {
      if (!running) return;
      const p = progressRef.current;
      const t = clock.getElapsedTime();
      camera.position.z = -p * (DEPTH - 10);
      camera.position.x = Math.sin(t * 0.2) * 0.6;
      camera.position.y = Math.cos(t * 0.16) * 0.4;
      stars.rotation.z = t * 0.02 + p * 0.6;
      core.material.opacity = 0.35 + Math.sin(t * 1.5) * 0.12 + p * 0.2;
      core.scale.setScalar(1 + p * 1.5);
      camera.lookAt(0, 0, -DEPTH);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };

    if (reduceMotion) {
      camera.position.z = 0;
      camera.lookAt(0, 0, -DEPTH);
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(render);
    }

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduceMotion) {
        running = true;
        raf = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      geo.dispose();
      mat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      renderer.dispose();
    };
  }, [mode]);

  return (
    <section className="cinematic" ref={wrapRef} style={{ height: `${STAGE_VH}vh` }}>
      <div className="cinematic__stage">
        <canvas ref={canvasRef} className="cinematic__canvas" aria-hidden="true" />
        <div className="cinematic__scrim" aria-hidden="true" />

        <div className="cinematic__overlays">
          <div className={`cine-copy ${copyStep === 0 ? 'cine-copy--in' : ''}`}>
            <p className="cine-kicker">A galaxy fusion game</p>
            <h1 className="cine-title">PLANET MIXER</h1>
            <p className="cine-sub">Fuse worlds. Discover galaxies.</p>
            <div className="cine-cta">
              <button type="button" className="btn btn--primary" onClick={onEnter}>
                Start mixing
              </button>
              <span className="cine-scroll-hint">Scroll to fly in</span>
            </div>
          </div>

          <div className={`cine-copy ${copyStep === 1 ? 'cine-copy--in' : ''}`}>
            <h2 className="cine-title cine-title--sm">Eight elemental worlds</h2>
            <p className="cine-sub">
              Ocean, fire, ice, metal, nature, shadow, light and storm await your hand.
            </p>
          </div>

          <div className={`cine-copy ${copyStep === 2 ? 'cine-copy--in' : ''}`}>
            <h2 className="cine-title cine-title--sm">Drag a world onto another</h2>
            <p className="cine-sub">
              Every fusion births a hybrid: a new name, rarity, ability and lore.
            </p>
          </div>

          <div className={`cine-copy ${copyStep === 3 ? 'cine-copy--in' : ''}`}>
            <h2 className="cine-title cine-title--sm">Build your galaxy</h2>
            <p className="cine-sub">
              Chase Mythic worlds and register your rarest finds on GenLayer.
            </p>
            <div className="cine-cta">
              <button type="button" className="btn btn--primary" onClick={onEnter}>
                Enter the galaxy
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
