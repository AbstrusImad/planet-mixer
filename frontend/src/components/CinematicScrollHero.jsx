import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// CINEMATIC FRAME CONFIG
// Source videos (videos/hero.mp4, videos/fusion.mp4) are sliced to JPG
// sequences under public/cinematic/hero and public/cinematic/fusion and scrubbed
// by scroll. If the hero frames are missing, a procedural Three.js fly-through
// stands in so the page still looks great.
// ---------------------------------------------------------------------------
const CINEMATIC = {
  hero: { dir: 'cinematic/hero/', count: 180, prefix: 'frame_', pad: 4, ext: '.jpg' },
  fusion: { dir: 'cinematic/fusion/', count: 180, prefix: 'frame_', pad: 4, ext: '.jpg' },
};

function framePath(cfg, i) {
  const n = String(i).padStart(cfg.pad, '0');
  return `${import.meta.env.BASE_URL}${cfg.dir}${cfg.prefix}${n}${cfg.ext}`;
}

function probeFirstFrame(cfg) {
  return new Promise((resolve) => {
    if (!cfg.count || cfg.count < 1) return resolve(false);
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = framePath(cfg, 1);
  });
}

// A single sticky frame-scrub stage with fading overlay copy.
function ScrubStage({ cfg, heightVh, copies }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const progressRef = useRef(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const images = new Array(cfg.count + 1).fill(null);
    for (let i = 1; i <= cfg.count; i++) {
      const img = new Image();
      img.src = framePath(cfg, i);
      images[i] = img;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let lastIndex = -1;
    let raf = 0;

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
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
      const wrap = wrapRef.current;
      if (wrap) {
        const rect = wrap.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
        const p = total > 0 ? scrolled / total : 0;
        progressRef.current = p;
        const idx = Math.max(1, Math.min(cfg.count, Math.round(p * (cfg.count - 1)) + 1));
        if (idx !== lastIndex) {
          drawCover(images[idx] || images[lastIndex > 0 ? lastIndex : 1]);
          lastIndex = idx;
        }
        const n = copies.length;
        const step = Math.min(n - 1, Math.floor(p * n));
        setActive((prev) => (prev === step ? prev : step));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="cinematic" ref={wrapRef} style={{ height: `${heightVh}vh` }}>
      <div className="cinematic__stage">
        <canvas ref={canvasRef} className="cinematic__canvas" aria-hidden="true" />
        <div className="cinematic__scrim" aria-hidden="true" />
        <div className="cinematic__overlays">
          {copies.map((c, i) => (
            <div key={i} className={`cine-copy ${active === i ? 'cine-copy--in' : ''}`}>
              {c.kicker && <p className="cine-kicker">{c.kicker}</p>}
              <h1 className={`cine-title ${c.small ? 'cine-title--sm' : ''}`}>{c.title}</h1>
              {c.sub && <p className="cine-sub">{c.sub}</p>}
              {c.cta && (
                <div className="cine-cta">
                  <button type="button" className="btn btn--primary" onClick={c.cta}>
                    {c.ctaLabel || 'Start mixing'}
                  </button>
                  {c.hint && <span className="cine-scroll-hint">{c.hint}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Procedural fallback used only when the hero frames are missing.
function ProceduralStage({ onEnter }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const progressRef = useRef(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const wrap = wrapRef.current;
      if (wrap) {
        const rect = wrap.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const p = total > 0 ? Math.min(Math.max(-rect.top, 0), total) / total : 0;
        progressRef.current = p;
        const s = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
        setStep((prev) => (prev === s ? prev : s));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0a1f, 0.06);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 120);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x05040f, 1);
    const COUNT = 2600;
    const DEPTH = 90;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const palette = [[0.75, 0.86, 1], [1, 0.9, 0.7], [1, 0.75, 0.95], [0.7, 1, 0.9]];
    for (let i = 0; i < COUNT; i++) {
      const r = 2 + Math.random() * 14;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = Math.sin(a) * r;
      positions[i * 3 + 2] = -Math.random() * DEPTH;
      const c = palette[(Math.random() * palette.length) | 0];
      colors[i * 3] = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const stars = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    scene.add(stars);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.5 }),
    );
    core.position.z = -DEPTH + 6;
    scene.add(core);
    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', resize);
    const clock = new THREE.Clock();
    let raf = 0;
    const render = () => {
      const p = progressRef.current;
      const t = clock.getElapsedTime();
      camera.position.z = -p * (DEPTH - 10);
      camera.position.x = Math.sin(t * 0.2) * 0.6;
      camera.position.y = Math.cos(t * 0.16) * 0.4;
      stars.rotation.z = t * 0.02 + p * 0.6;
      core.scale.setScalar(1 + p * 1.5);
      camera.lookAt(0, 0, -DEPTH);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      renderer.dispose();
    };
  }, []);

  const copies = [
    { kicker: 'A galaxy fusion game', title: 'PLANET MIXER', sub: 'Fuse worlds. Discover galaxies.', cta: onEnter, hint: 'Scroll to fly in' },
    { title: 'Drag a world onto another', small: true, sub: 'Every fusion births a hybrid: a new name, rarity, ability and lore.' },
    { title: 'Build your galaxy', small: true, sub: 'Chase Mythic worlds and register your rarest finds on GenLayer.', cta: onEnter, ctaLabel: 'Enter the galaxy' },
  ];

  return (
    <section className="cinematic" ref={wrapRef} style={{ height: '420vh' }}>
      <div className="cinematic__stage">
        <canvas ref={canvasRef} className="cinematic__canvas" aria-hidden="true" />
        <div className="cinematic__scrim" aria-hidden="true" />
        <div className="cinematic__overlays">
          {copies.map((c, i) => (
            <div key={i} className={`cine-copy ${step === i ? 'cine-copy--in' : ''}`}>
              {c.kicker && <p className="cine-kicker">{c.kicker}</p>}
              <h1 className={`cine-title ${c.small ? 'cine-title--sm' : ''}`}>{c.title}</h1>
              {c.sub && <p className="cine-sub">{c.sub}</p>}
              {c.cta && (
                <div className="cine-cta">
                  <button type="button" className="btn btn--primary" onClick={c.cta}>
                    {c.ctaLabel || 'Start mixing'}
                  </button>
                  {c.hint && <span className="cine-scroll-hint">{c.hint}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CinematicScrollHero({ onEnter }) {
  const [mode, setMode] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    probeFirstFrame(CINEMATIC.hero).then((ok) => {
      if (!cancelled) setMode(ok ? 'frames' : 'procedural');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (mode === 'loading') return <section style={{ height: '100vh' }} />;
  if (mode === 'procedural') return <ProceduralStage onEnter={onEnter} />;

  return (
    <>
      <ScrubStage
        cfg={CINEMATIC.hero}
        heightVh={240}
        copies={[
          { kicker: 'A galaxy fusion game', title: 'PLANET MIXER', sub: 'Fuse worlds. Discover galaxies.', cta: onEnter, hint: 'Scroll to fly in' },
          { title: 'Eight elemental worlds', small: true, sub: 'Ocean, fire, ice, metal, nature, shadow, light and storm await your hand.' },
        ]}
      />
      <ScrubStage
        cfg={CINEMATIC.fusion}
        heightVh={220}
        copies={[
          { title: 'Drag a world onto another', small: true, sub: 'Two worlds collide and a hybrid is born: a new name, rarity, ability and lore.' },
          { title: 'Build your galaxy', small: true, sub: 'Chase Mythic worlds and register your rarest finds on GenLayer.', cta: onEnter, ctaLabel: 'Enter the galaxy' },
        ]}
      />
    </>
  );
}
