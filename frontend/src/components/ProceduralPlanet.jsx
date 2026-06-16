import { useEffect, useRef } from 'react';

// Canvas fallback planet: a circular world with a two-color radial gradient,
// a soft glow, and a few orbiting particles. Used when no bundled image exists.
export default function ProceduralPlanet({ colorA, colorB, size = 160, seed = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.32;

    const particles = [];
    const pCount = 5 + (seed % 4);
    for (let i = 0; i < pCount; i++) {
      particles.push({
        angle: (Math.PI * 2 * i) / pCount + (seed % 7) * 0.3,
        dist: r + 8 + ((seed + i * 13) % 18),
        speed: 0.004 + ((seed + i) % 5) * 0.001,
        rad: 1.4 + ((seed + i) % 3),
      });
    }

    let raf = 0;
    let running = true;

    const draw = (t) => {
      ctx.clearRect(0, 0, size, size);

      // atmosphere halo
      const halo = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.55);
      halo.addColorStop(0, hexA(colorB, 0.5));
      halo.addColorStop(1, hexA(colorB, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.55, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      // body, lit from the upper-left
      const body = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.1, cx, cy, r);
      body.addColorStop(0, mix(colorA, '#ffffff', 0.28));
      body.addColorStop(0.55, colorA);
      body.addColorStop(1, mix(colorB, '#000010', 0.3));
      ctx.fillStyle = body;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      // surface latitude bands
      const bands = 3 + (seed % 3);
      for (let i = 0; i < bands; i++) {
        const yy = cy - r + ((i + 0.5) / bands) * 2 * r + Math.sin(t * 0.0003 + i) * 3;
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = i % 2 ? mix(colorB, '#ffffff', 0.35) : mix(colorA, '#000010', 0.3);
        ctx.beginPath();
        ctx.ellipse(cx, yy, r * 1.15, r * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // soft continents
      let s = (seed * 2654435761) >>> 0;
      const rng = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0xffffffff;
      };
      const blobs = 3 + (seed % 3);
      for (let i = 0; i < blobs; i++) {
        const a = rng() * Math.PI * 2;
        const d = rng() * r * 0.6;
        const bx = cx + Math.cos(a) * d;
        const by = cy + Math.sin(a) * d;
        const br = r * (0.12 + rng() * 0.18);
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = mix(colorA, colorB, rng());
        ctx.beginPath();
        ctx.ellipse(bx, by, br, br * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // specular highlight
      const spec = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.42, 0, cx - r * 0.4, cy - r * 0.42, r * 0.6);
      spec.addColorStop(0, hexA('#ffffff', 0.45));
      spec.addColorStop(1, hexA('#ffffff', 0));
      ctx.fillStyle = spec;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      // terminator shadow lower-right
      const shade = ctx.createRadialGradient(cx + r * 0.55, cy + r * 0.55, r * 0.1, cx, cy, r * 1.05);
      shade.addColorStop(0, hexA('#000010', 0));
      shade.addColorStop(1, hexA('#000010', 0.55));
      ctx.fillStyle = shade;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.restore();

      // bright atmosphere rim on the lit edge
      ctx.lineWidth = Math.max(1.5, r * 0.035);
      const rim = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      rim.addColorStop(0, hexA('#ffffff', 0.6));
      rim.addColorStop(0.5, hexA(colorB, 0.18));
      rim.addColorStop(1, hexA('#000000', 0));
      ctx.strokeStyle = rim;
      ctx.beginPath();
      ctx.arc(cx, cy, r - ctx.lineWidth * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    };

    const loop = (t) => {
      if (!running) return;
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    if (reduceMotion) {
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const onVis = () => {
      running = !document.hidden && !reduceMotion;
      if (running) raf = requestAnimationFrame(loop);
      else cancelAnimationFrame(raf);
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [colorA, colorB, size, seed]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '1 / 1' }}
      aria-hidden="true"
    />
  );
}

function hexA(hex, alpha) {
  const v = hex.replace('#', '');
  const f = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
  const n = parseInt(f, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function mix(hex1, hex2, t) {
  const parse = (hex) => {
    const v = hex.replace('#', '');
    const f = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
    const n = parseInt(f, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const a = parse(hex1);
  const b = parse(hex2);
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}
