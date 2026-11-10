// Confeti y estrellas de celebración (canvas 2D, ~3 s).

export function startConfetti(canvas, ms = 3200) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const resize = () => {
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
  };
  resize();
  const colors = ['#2f7bf6', '#35c3a8', '#ffc83d', '#ff8fa6', '#6c4bd8', '#ffffff'];
  const W = canvas.width;
  const H = canvas.height;
  const parts = Array.from({ length: 110 }, (_, i) => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3,
    y: H * 0.35,
    vx: (Math.random() - 0.5) * 9 * dpr,
    vy: (-Math.random() * 11 - 4) * dpr,
    r: (4 + Math.random() * 5) * dpr,
    rot: Math.random() * 6,
    vr: (Math.random() - 0.5) * 0.3,
    c: colors[i % colors.length],
    star: i % 7 === 0,
  }));
  const t0 = performance.now();
  const frame = (now) => {
    const k = (now - t0) / ms;
    ctx.clearRect(0, 0, W, H);
    if (k >= 1) return;
    ctx.globalAlpha = Math.min(1, (1 - k) * 2);
    for (const p of parts) {
      p.vy += 0.28 * dpr;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.star ? '#ffc83d' : p.c;
      if (p.star) {
        ctx.beginPath();
        for (let j = 0; j < 10; j++) {
          const a = (j / 10) * Math.PI * 2;
          const rr = j % 2 ? p.r * 0.9 : p.r * 2;
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.fill();
      } else {
        ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8);
      }
      ctx.restore();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
