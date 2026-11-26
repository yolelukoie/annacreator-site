// Dial ticks: 60 marks, every fifth one gold, like a clock face.
(function ticks() {
  const g = document.querySelector('.ticks');
  if (!g) return;
  const ns = 'http://www.w3.org/2000/svg';
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    const a = (i / 60) * Math.PI * 2;
    const r1 = 286, r2 = major ? 274 : 280;
    const l = document.createElementNS(ns, 'line');
    l.setAttribute('x1', 300 + r1 * Math.cos(a));
    l.setAttribute('y1', 300 + r1 * Math.sin(a));
    l.setAttribute('x2', 300 + r2 * Math.cos(a));
    l.setAttribute('y2', 300 + r2 * Math.sin(a));
    if (major) l.setAttribute('class', 'major');
    g.appendChild(l);
  }
})();

// Drifting dust, like the motes in Anna's portrait. Still when reduced motion is requested.
(function dust() {
  const c = document.getElementById('dust');
  if (!c || !c.getContext) return;
  const ctx = c.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, dpr, motes = [];

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.clientWidth; h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, (w * h) / 16000));
    motes = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.3,
      vy: -(Math.random() * 0.12 + 0.03),
      vx: (Math.random() - 0.5) * 0.06,
      p: Math.random() * Math.PI * 2,
      gold: Math.random() < 0.18,
    }));
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const m of motes) {
      if (!still) {
        m.x += m.vx; m.y += m.vy;
        if (m.y < -4) { m.y = h + 4; m.x = Math.random() * w; }
      }
      const a = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t / 1400 + m.p));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = m.gold ? `rgba(212,178,122,${a})` : `rgba(243,223,230,${a * 0.8})`;
      ctx.fill();
    }
    if (!still) requestAnimationFrame(draw);
  }

  size();
  window.addEventListener('resize', size);
  requestAnimationFrame(draw);
})();

// Decision tree: one voice open at a time. Without JS every panel stays visible.
(function tree() {
  const tabs = Array.from(document.querySelectorAll('.tone'));
  if (!tabs.length) return;
  const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
  panels.forEach(p => p.querySelectorAll('.branches li').forEach((li, i) => li.style.setProperty('--i', i)));

  function select(i, focus) {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
      panels[j].classList.toggle('enter', on);
    });
    if (focus) tabs[i].focus();
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', e => {
      let d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (document.dir === 'rtl') d = -d;
      if (d) { e.preventDefault(); select((i + d + tabs.length) % tabs.length, true); }
    });
  });
  select(0);
  panels[0].classList.remove('enter');
})();

// Languages: English is in the page, Russian and Hebrew come from i18n.js.
// Choice order: ?lang= in the link, then the visitor's last choice, then the browser language.
(function languages() {
  const dict = window.I18N || {};
  const nodes = Array.from(document.querySelectorAll('[data-i18n]'));
  const en = new Map(nodes.map(n => [n, n.innerHTML]));
  const enTitle = document.title;
  const desc = document.querySelector('meta[data-i18n-desc]');
  const enDesc = desc ? desc.content : '';
  const buttons = Array.from(document.querySelectorAll('.langs [data-lang]'));
  const ok = l => l === 'en' || !!dict[l];

  function apply(lang) {
    const t = dict[lang];
    nodes.forEach(n => {
      const v = t ? t[n.dataset.i18n] : en.get(n);
      if (v !== undefined && n.innerHTML !== v) n.innerHTML = v;
    });
    document.title = t ? t._title : enTitle;
    if (desc) desc.content = t ? t._desc : enDesc;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    buttons.forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  }

  function pick() {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && ok(q)) return q;
    try { const s = localStorage.getItem('lang'); if (s && ok(s)) return s; } catch (e) {}
    for (const l of navigator.languages || [navigator.language || '']) {
      const c = (l || '').slice(0, 2).toLowerCase();
      if (c === 'iw') return 'he';
      if (ok(c)) return c;
    }
    return 'en';
  }

  buttons.forEach(b => b.addEventListener('click', () => {
    const l = b.dataset.lang;
    try { localStorage.setItem('lang', l); } catch (e) {}
    apply(l);
    const u = new URL(location.href);
    if (l === 'en') u.searchParams.delete('lang'); else u.searchParams.set('lang', l);
    history.replaceState(null, '', u);
  }));

  const first = pick();
  if (first !== 'en') apply(first);
})();
