/* ═══════════════════════════════════════════════════════
   PORTFOLIO v3 — SCRIPT
   · Custom glowing cursor
   · Antigravity particle field (repel on hover)
   · Scroll reveal
   · Stat counters
   · 3D magnetic tilt cards
   · Active nav on scroll
═══════════════════════════════════════════════════════ */

/* ─── 1. CUSTOM CURSOR ──────────────────────────────── */
const cur   = document.getElementById('cursor');
const trail = document.getElementById('cursor-trail');
let mx = 0, my = 0, tx = 0, ty = 0;

document.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
document.addEventListener('pointerleave', () => { cur.style.opacity = '0'; trail.style.opacity = '0'; });
document.addEventListener('pointerenter', () => { cur.style.opacity = '1'; trail.style.opacity = '1'; });

(function cursorLoop() {
  // Dot snaps instantly
  cur.style.left = mx + 'px';
  cur.style.top  = my + 'px';
  // Trail lags behind
  tx += (mx - tx) * 0.12;
  ty += (my - ty) * 0.12;
  trail.style.left = tx + 'px';
  trail.style.top  = ty + 'px';
  requestAnimationFrame(cursorLoop);
})();

document.querySelectorAll('a, button, .tilt-card, .tilt-btn').forEach(el => {
  el.addEventListener('pointerenter', () => {
    cur.style.width  = '50px';
    cur.style.height = '50px';
    cur.style.opacity = '0.15';
    trail.style.width  = '80px';
    trail.style.height = '80px';
    trail.style.borderColor = 'rgba(0,230,195,0.5)';
  });
  el.addEventListener('pointerleave', () => {
    cur.style.width  = '10px';
    cur.style.height = '10px';
    cur.style.opacity = '1';
    trail.style.width  = '36px';
    trail.style.height = '36px';
    trail.style.borderColor = 'rgba(0,230,195,0.35)';
  });
});


/* ─── 2. PARTICLE CANVAS — ANTIGRAVITY REPEL ────────── */
(function particles() {
  const canvas = document.getElementById('canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, dpr, raf;

  const mouse = { x: -9999, y: -9999 };
  let pts = [];

  const N          = 130;
  const REPEL_R    = 130;
  const REPEL_F    = 6.5;
  const SPRING     = 0.076;
  const DAMP       = 0.80;
  const DOT_R      = 2.2;
  const LINE_D     = 110;

  const DARK_COLORS = ['#00e6c3','#38bdf8','#818cf8','#10b981','#a78bfa'];
  const LIGHT_COLORS = ['#4f46e5','#2563eb','#d946ef','#8b5cf6','#6366f1'];

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W   = window.innerWidth;
    H   = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.cssText = `position:fixed;inset:0;width:${W}px;height:${H}px`;
    ctx.scale(dpr, dpr);
  }

  class P {
    constructor() {
      this.ox = Math.random() * W;
      this.oy = Math.random() * H;
      this.x  = this.ox;
      this.y  = this.oy;
      this.vx = 0; this.vy = 0;
      this.colorIndex = Math.floor(Math.random() * 5);
      this.r  = DOT_R * (0.55 + Math.random() * 0.9);
      this.a  = 0.3 + Math.random() * 0.5;
    }

    tick() {
      const dx   = mouse.x - this.x;
      const dy   = mouse.y - this.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < REPEL_R && dist > 0) {
        const f = ((REPEL_R - dist) / REPEL_R) * REPEL_F;
        const a = Math.atan2(dy, dx);
        this.vx -= Math.cos(a) * f;
        this.vy -= Math.sin(a) * f;
      }
      this.vx += (this.ox - this.x) * SPRING;
      this.vy += (this.oy - this.y) * SPRING;
      this.vx *= DAMP;
      this.vy *= DAMP;
      this.x  += this.vx;
      this.y  += this.vy;
    }

    draw() {
      const isLight = document.documentElement.classList.contains('light');
      const colors = isLight ? LIGHT_COLORS : DARK_COLORS;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
      ctx.fillStyle   = colors[this.colorIndex];
      ctx.globalAlpha = this.a;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function init() {
    pts = Array.from({ length: N }, () => new P());
  }

  function drawLines() {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i+1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const dx = a.x-b.x, dy = a.y-b.y;
        const d  = Math.sqrt(dx*dx+dy*dy);
        if (d < LINE_D) {
          const alpha = (1 - d/LINE_D) * 0.22;
          const isLight = document.documentElement.classList.contains('light');
          const colors = isLight ? LIGHT_COLORS : DARK_COLORS;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle  = colors[a.colorIndex];
          ctx.globalAlpha  = alpha;
          ctx.lineWidth    = 0.8;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  function drawHalo() {
    if (mouse.x < 0 || mouse.x > W) return;
    const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, REPEL_R*1.4);
    g.addColorStop(0,   'rgba(0,230,195,0.07)');
    g.addColorStop(0.4, 'rgba(56,189,248,0.04)');
    g.addColorStop(1,   'rgba(0,230,195,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, REPEL_R*1.4, 0, Math.PI*2);
    ctx.fill();
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawHalo();
    drawLines();
    pts.forEach(p => { p.tick(); p.draw(); });
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('pointerleave', () => { mouse.x = -9999; mouse.y = -9999; });
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    resize(); init(); loop();
  });

  resize(); init(); loop();
})();


/* ─── 3. NAVBAR ─────────────────────────────────────── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('stuck', window.scrollY > 60);
}, { passive: true });


/* ─── 4. MOBILE MENU ────────────────────────────────── */
const ham  = document.getElementById('ham');
const mob  = document.getElementById('mob-menu');
ham.addEventListener('click', () => {
  const open = ham.getAttribute('aria-expanded') === 'true';
  ham.setAttribute('aria-expanded', String(!open));
  mob.hidden = open;
  // Animate hamburger to X
  const spans = ham.querySelectorAll('span');
  if (!open) {
    spans[0].style.transform = 'translateY(8px) rotate(45deg)';
    spans[1].style.transform = 'translateY(-8px) rotate(-45deg)';
  } else {
    spans[0].style.transform = '';
    spans[1].style.transform = '';
  }
});
mob.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  ham.setAttribute('aria-expanded','false');
  mob.hidden = true;
  ham.querySelectorAll('span').forEach(s => s.style.transform = '');
}));


/* ─── 5. SCROLL REVEAL ──────────────────────────────── */
const reveals = document.querySelectorAll('.reveal');
const revObs  = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revObs.unobserve(e.target); } });
}, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });
reveals.forEach(el => revObs.observe(el));


/* ─── 6. STAT COUNTERS ──────────────────────────────── */
document.querySelectorAll('.count[data-to]').forEach(el => {
  const target = parseInt(el.dataset.to, 10);
  let fired = false;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !fired) {
        fired = true;
        obs.disconnect();
        let start = null;
        const dur = 1600;
        function step(ts) {
          if (!start) start = ts;
          const p = Math.min((ts - start) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.floor(ease * target);
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target;
        }
        requestAnimationFrame(step);
      }
    });
  }, { threshold: 0.1 });
  obs.observe(el);
});


/* ─── 7. 3D MAGNETIC TILT CARDS ─────────────────────── */
document.querySelectorAll('.tilt-card').forEach(card => {
  const MAX = 8;
  let raf;

  card.addEventListener('pointermove', e => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const r   = card.getBoundingClientRect();
      const dx  = ((e.clientX - (r.left + r.width  / 2)) / (r.width  / 2));
      const dy  = ((e.clientY - (r.top  + r.height / 2)) / (r.height / 2));
      const rx  = -dy * MAX;
      const ry  =  dx * MAX;
      card.style.transform  = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px)`;
      card.style.transition = 'none';
    });
  });

  card.addEventListener('pointerleave', () => {
    cancelAnimationFrame(raf);
    card.style.transform  = '';
    card.style.transition = 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s, box-shadow 0.3s';
  });
});


/* ─── 8. MAGNETIC BUTTON FOLLOW ─────────────────────── */
document.querySelectorAll('.tilt-btn').forEach(btn => {
  btn.addEventListener('pointermove', e => {
    const r  = btn.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width/2))  * 0.28;
    const dy = (e.clientY - (r.top  + r.height/2)) * 0.28;
    btn.style.transform  = `translate(${dx}px, ${dy}px) scale(1.04)`;
    btn.style.transition = 'transform 0.1s ease';
  });
  btn.addEventListener('pointerleave', () => {
    btn.style.transform  = '';
    btn.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease';
  });
});


/* ─── 9. ACTIVE NAV ON SCROLL ───────────────────────── */
const allSections = document.querySelectorAll('section[id]');
const allNavLinks = document.querySelectorAll('.nav-links a');

new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.id;
      allNavLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    }
  });
}, { threshold: 0.35 }).observe
  ? allSections.forEach(s => {
      new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            allNavLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
          }
        });
      }, { threshold: 0.35 }).observe(s);
    })
  : null;


/* ─── 10. THEME SWITCHER ────────────────────────────── */
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  // Load saved theme or check default
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light');
  }

  themeToggle.addEventListener('click', () => {
    const isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
}


/* ─── 11. TYPEWRITER EFFECT ─────────────────────────── */
(function typewriter() {
  const words = [
    "Federated Learning",
    "Federated Unlearning",
    "Trustworthy AI",
    "Privacy-Preserving Machine Learning",
    "Medical AI",
    "Computer Vision",
    "Representation Learning",
    "Distributed AI Systems"
  ];
  const el = document.getElementById('tw-text');
  if (!el) return;

  let wordIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let delay = 100;

  function tick() {
    const currentWord = words[wordIdx];
    if (isDeleting) {
      el.textContent = currentWord.substring(0, charIdx - 1);
      charIdx--;
      delay = 50;
    } else {
      el.textContent = currentWord.substring(0, charIdx + 1);
      charIdx++;
      delay = 100;
    }

    if (!isDeleting && charIdx === currentWord.length) {
      isDeleting = true;
      delay = 1800; // Pause at full word
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      wordIdx = (wordIdx + 1) % words.length;
      delay = 400; // Pause before typing next word
    }

    setTimeout(tick, delay);
  }

  tick();
})();
