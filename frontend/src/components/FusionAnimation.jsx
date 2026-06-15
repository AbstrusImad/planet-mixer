import { useEffect, useRef } from 'react';
import { RARITIES } from '../data/planets.js';

// Full screen fusion moment: two parent orbs fly toward the center, a particle
// burst and flash fire on impact, then onDone reveals the result card.
// Rarer results get more particles and warmer colors.
export default function FusionAnimation({ parentA, parentB, result, onDone }) {
  const canvasRef = useRef(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = window.innerWidth;
    let h = window.innerHeight;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const rarity = RARITIES[result?.rarity] ?? RARITIES.Common;
    const cx = w / 2;
    const cy = h / 2;

    const colors = [parentA.colorA, parentA.colorB, parentB.colorA, parentB.colorB, rarity.color];
    const burst = [];
    const makeBurst = () => {
      const count = rarity.particles * 2;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 7;
        burst.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.008 + Math.random() * 0.02,
          rad: 1.5 + Math.random() * 3.5,
          color: colors[(Math.random() * colors.length) | 0],
        });
      }
    };

    const DURATION = reduceMotion ? 350 : 1700;
    const IMPACT = 0.62; // fraction of duration when orbs meet
    const start = performance.now();
    let flashed = false;
    let raf = 0;

    const orbA = { startX: cx - Math.min(w * 0.3, 260), startY: cy };
    const orbB = { startX: cx + Math.min(w * 0.3, 260), startY: cy };

    const drawOrb = (x, y, r, ca, cb) => {
      const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      g.addColorStop(0, ca);
      g.addColorStop(1, cb);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = (now) => {
      const t = Math.min(1, (now - start) / DURATION);
      ctx.clearRect(0, 0, w, h);

      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      if (t < IMPACT) {
        const k = ease / (IMPACT < 1 ? 1 : 1);
        const p = Math.min(1, t / IMPACT);
        const ax = orbA.startX + (cx - orbA.startX) * p;
        const bx = orbB.startX + (cx - orbB.startX) * p;
        const spin = p * 6;
        const r = 64 * (1 - p * 0.25);
        ctx.save();
        ctx.globalAlpha = 0.95;
        drawOrb(ax + Math.cos(spin) * 6, cy, r, parentA.colorA, parentA.colorB);
        drawOrb(bx - Math.cos(spin) * 6, cy, r, parentB.colorA, parentB.colorB);
        ctx.restore();
      } else {
        if (!flashed) {
          flashed = true;
          makeBurst();
        }
        // flash
        const ft = (t - IMPACT) / (1 - IMPACT);
        const flashAlpha = Math.max(0, 1 - ft * 2.2);
        if (flashAlpha > 0) {
          const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5);
          fg.addColorStop(0, `rgba(255,255,255,${flashAlpha})`);
          fg.addColorStop(0.3, `${rarity.glow}`);
          fg.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = fg;
          ctx.fillRect(0, 0, w, h);
        }
        // emerging result core
        const r = 70 + ft * 30;
        ctx.globalAlpha = Math.min(1, ft * 1.5);
        drawOrb(cx, cy, r, result.colorA, result.colorB);
        ctx.globalAlpha = 1;
      }

      // particles
      for (const pt of burst) {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vx *= 0.97;
        pt.vy *= 0.97;
        pt.life -= pt.decay;
        if (pt.life <= 0) continue;
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (t >= 1) {
        doneRef.current?.();
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [parentA, parentB, result]);

  return (
    <div className="fusion-overlay" role="presentation">
      <canvas ref={canvasRef} className="fusion-canvas" />
      <p className="fusion-label">Fusing worlds</p>
    </div>
  );
}
