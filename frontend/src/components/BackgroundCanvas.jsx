import { useEffect, useRef } from 'react';

export default function BackgroundCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W, H, mx = 0, my = 0, tmx = 0, tmy = 0, animId;

    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', e => { tmx = e.clientX; tmy = e.clientY; });

    // Particles
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.1, vy: (Math.random() - 0.5) * 0.1,
      r: Math.random() * 1 + 0.3, a: Math.random() * 0.15 + 0.03,
      ba: 0,
    }));
    particles.forEach(p => p.ba = p.a);

    // Light orbs
    const orbs = [
      { x: W * 0.3, y: H * 0.3, tx: 0, ty: 0, sz: 250, sp: 0.005, hue: '79,209,255', a: 0.018, off: 0 },
      { x: W * 0.6, y: H * 0.5, tx: 0, ty: 0, sz: 300, sp: 0.008, hue: '123,97,255', a: 0.014, off: 2 },
      { x: W * 0.5, y: H * 0.7, tx: 0, ty: 0, sz: 220, sp: 0.006, hue: '192,192,192', a: 0.012, off: 4 },
    ];

    function loop(t) {
      ctx.clearRect(0, 0, W, H);
      mx += (tmx - mx) * 0.04;
      my += (tmy - my) * 0.04;

      // Orbs
      orbs.forEach(o => {
        o.tx = mx + Math.sin(t * 0.0003 + o.off) * 120;
        o.ty = my + Math.cos(t * 0.0002 + o.off) * 80;
        o.x += (o.tx - o.x) * o.sp;
        o.y += (o.ty - o.y) * o.sp;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.sz);
        g.addColorStop(0, `rgba(${o.hue},${o.a})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.sz, 0, Math.PI * 2);
        ctx.fill();
      });

      // Particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
        if (d < 180) {
          const f = (180 - d) / 180 * 0.04;
          p.vx += dx / d * f;
          p.vy += dy / d * f;
        }
        p.vx *= 0.997;
        p.vy *= 0.997;
        p.a = p.ba + (d < 280 ? 0.1 * (280 - d) / 280 : 0);
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(79,209,255,${p.a})`;
        ctx.fill();
      });

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const d = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (d < 100) {
            ctx.strokeStyle = `rgba(79,209,255,${0.03 * (1 - d / 100)})`;
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}
