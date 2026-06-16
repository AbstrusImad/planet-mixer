import { useEffect, useRef } from 'react';

// Canvas fallback planet for fusions without bundled art. Rendered at a fixed
// high internal resolution so it stays crisp at any display size, with defined
// surface bands, continents, a bright specular highlight and a sharp atmosphere
// rim, so it reads as a real planet, not a soft blob.
const RES = 480;

export default function ProceduralPlanet({ colorA, colorB, seed = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = RES * dpr;
    canvas.height = RES * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cx = RES / 2;
    const cy = RES / 2;
    const r = RES * 0.44;

    const draw = (time) => {
      ctx.clearRect(0, 0, RES, RES);

      // atmosphere halo
      const halo = ctx.createRadialGradient(cx, cy, r * 0.82, cx, cy, r * 1.32);
      halo.addColorStop(0, hexA(colorB, 0.55));
      halo.addColorStop(1, hexA(colorB, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.32, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      // body, lit from the upper-left, strong contrast
      const body = ctx.createRadialGradient(cx - r * 0.42, cy - r * 0.42, r * 0.05, cx, cy, r * 1.05);
      body.addColorStop(0, mix(colorA, '#ffffff', 0.45));
      body.addColorStop(0.4, colorA);
      body.addColorStop(0.78, mix(colorA, colorB, 0.7));
      body.addColorStop(1, mix(colorB, '#05030f', 0.55));
      ctx.fillStyle = body;
      ctx.fillRect(0, 0, RES, RES);

      let s = (seed * 2654435761 + 1) >>> 0;
      const rng = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0xffffffff;
      };

      // defined latitude bands
      const bands = 4 + (seed % 3);
      for (let i = 0; i < bands; i++) {
        const yy = cy - r + ((i + 0.5) / bands) * 2 * r + Math.sin((reduceMotion ? 0 : time * 0.0003) + i) * 3;
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = i % 2 ? mix(colorB, '#ffffff', 0.4) : mix(colorA, '#06030f', 0.4);
        ctx.beginPath();
        ctx.ellipse(cx, yy, r * 1.2, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // continents with harder edges
      const blobs = 4 + (seed % 4);
      for (let i = 0; i < blobs; i++) {
        const a = rng() * Math.PI * 2;
        const d = rng() * r * 0.62;
        const bx = cx + Math.cos(a) * d;
        const by = cy + Math.sin(a) * d;
        const br = r * (0.14 + rng() * 0.2);
        ctx.globalAlpha = 0.34;
        ctx.fillStyle = mix(mix(colorA, colorB, rng()), rng() > 0.5 ? '#ffffff' : '#06030f', 0.25);
        ctx.beginPath();
        ctx.ellipse(bx, by, br, br * (0.6 + rng() * 0.4), rng() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // bright specular highlight
      const spec = ctx.createRadialGradient(cx - r * 0.42, cy - r * 0.44, 0, cx - r * 0.42, cy - r * 0.44, r * 0.5);
      spec.addColorStop(0, hexA('#ffffff', 0.7));
      spec.addColorStop(0.4, hexA('#ffffff', 0.12));
      spec.addColorStop(1, hexA('#ffffff', 0));
      ctx.fillStyle = spec;
      ctx.fillRect(0, 0, RES, RES);

      // terminator shadow lower-right
      const shade = ctx.createRadialGradient(cx + r * 0.6, cy + r * 0.6, r * 0.1, cx, cy, r * 1.1);
      shade.addColorStop(0, hexA('#02010a', 0));
      shade.addColorStop(1, hexA('#02010a', 0.7));
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, RES, RES);
      ctx.restore();

      // sharp atmosphere rim on the lit edge
      ctx.lineWidth = RES * 0.012;
      const rim = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      rim.addColorStop(0, hexA('#ffffff', 0.85));
      rim.addColorStop(0.45, hexA(colorB, 0.25));
      rim.addColorStop(1, hexA('#000000', 0));
      ctx.strokeStyle = rim;
      ctx.beginPath();
      ctx.arc(cx, cy, r - ctx.lineWidth * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    };

    let raf = 0;
    let running = true;
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
  }, [colorA, colorB, seed]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto' }} aria-hidden="true" />;
}

function hexA(hex, alpha) {
  const v = hex.replace('#', '');
  const f = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
  const n = parseInt(f, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
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
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}
