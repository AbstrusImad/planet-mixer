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

      // outer glow aura
      const glow = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.7);
      glow.addColorStop(0, hexA(colorB, 0.55));
      glow.addColorStop(1, hexA(colorB, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.7, 0, Math.PI * 2);
      ctx.fill();

      // planet body, two-color radial gradient offset for a lit look
      const body = ctx.createRadialGradient(
        cx - r * 0.35,
        cy - r * 0.35,
        r * 0.15,
        cx,
        cy,
        r,
      );
      body.addColorStop(0, colorA);
      body.addColorStop(1, colorB);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // subtle rim light
      ctx.lineWidth = 2;
      ctx.strokeStyle = hexA('#ffffff', 0.18);
      ctx.beginPath();
      ctx.arc(cx, cy, r - 1, -0.8, 1.2);
      ctx.stroke();

      // shadow terminator
      const shade = ctx.createRadialGradient(
        cx + r * 0.5,
        cy + r * 0.5,
        r * 0.2,
        cx,
        cy,
        r,
      );
      shade.addColorStop(0, hexA('#000000', 0.35));
      shade.addColorStop(1, hexA('#000000', 0));
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // orbiting particles
      for (const p of particles) {
        const a = p.angle + (reduceMotion ? 0 : t * p.speed);
        const px = cx + Math.cos(a) * p.dist;
        const py = cy + Math.sin(a) * p.dist * 0.6;
        ctx.fillStyle = hexA('#ffffff', 0.85);
        ctx.beginPath();
        ctx.arc(px, py, p.rad, 0, Math.PI * 2);
        ctx.fill();
      }
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
      style={{ width: size, height: size, display: 'block' }}
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
