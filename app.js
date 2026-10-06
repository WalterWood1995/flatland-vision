/* Flatland Vision - a 2D creature's 1D retina.
   Vanilla JS, no dependencies. MIT License. */
(() => {
"use strict";

// ---------- i18n ----------
const I18N = {
  zh: {
    title: "二维生物的眼睛",
    subtitle: "一个二维生物只能看到一条线段。它绕着星体走一圈，用线段的明暗变化，在头脑里拼出星体的形状。",
    world: "上帝视角：二维膜", worldHint: "拖动太阳改变光向；拖动生物改变位置；自定义形状时在画布上点击添加顶点。",
    retina: "生物眼中的线段（视网膜）", retinaDepth: "只有距离（远处变暗）", retinaLight: "只有光照（朗伯反射 + 阴影）", retinaBoth: "两者叠加（生物实际看到的）",
    signature: "绕一圈的变化曲线", sigHint: "横轴：生物在轨道上的角度。黄线：线段的张角。白线：线段平均亮度。不同形状的星体，曲线的“指纹”不同。",
    mind: "头脑里拼出的星体", mindHint: "生物只知道自己走到了哪里、朝哪个方向看、以及那个方向有多亮。它假设“越暗越远”，把每一点放回去。打开光照后，这个假设会出错，拼出的形状会变形。",
    controls: "控制", shape: "星体形状", circle: "圆盘", triangle: "三角形", square: "正方形", pentagon: "五边形", star: "五角星", crescent: "月牙（非凸）", hexagon: "六边形", ellipse: "椭圆", egg: "蛋形", rounded: "圆角方形", gear: "齿轮（非凸）", asteroid: "小行星（随机）", navVision: "看星体", navEclipse: "日食与月食", custom: "自定义（点击画布）",
    size: "星体大小", orbit: "轨道半径", fov: "视场角", fog: "雾的深度（越小远处越暗）", speed: "自动绕行速度",
    lightOn: "开启光照", assumeDepth: "大脑假设：亮度只来自距离", clearMind: "清空头脑里的图",
    footer: "开源项目 · MIT 许可 · 欢迎加入创作",
    sun: "太阳", creature: "生物", angleW: "张角", bright: "亮度"
  },
  en: {
    title: "Flatland Vision",
    subtitle: "A 2D creature sees only a line segment. Walking around a planet, it uses the changing brightness along that segment to build the planet's shape in its mind.",
    world: "God's eye view: the 2D membrane", worldHint: "Drag the sun to change the light; drag the creature to move it; in custom mode click the canvas to add vertices.",
    retina: "What the creature sees (its retina)", retinaDepth: "Depth only (farther = darker)", retinaLight: "Lighting only (Lambert + shadow)", retinaBoth: "Both combined (what it actually sees)",
    signature: "Signature over one orbit", sigHint: "x: orbital angle of the creature. Yellow: angular width of the planet. White: mean brightness. Each shape has its own fingerprint.",
    mind: "The planet reconstructed in its mind", mindHint: "The creature knows only where it is, which way it looks, and how bright that direction is. It assumes 'darker = farther' and places each point back. With lighting on, that assumption fails and the reconstruction warps.",
    controls: "Controls", shape: "Planet shape", circle: "Disk", triangle: "Triangle", square: "Square", pentagon: "Pentagon", star: "Star", crescent: "Crescent (non-convex)", hexagon: "Hexagon", ellipse: "Ellipse", egg: "Egg", rounded: "Rounded square", gear: "Gear (non-convex)", asteroid: "Asteroid (random)", navVision: "Seeing a planet", navEclipse: "Eclipses", custom: "Custom (click canvas)",
    size: "Planet size", orbit: "Orbit radius", fov: "Field of view", fog: "Fog depth (smaller = darker far away)", speed: "Auto-walk speed",
    lightOn: "Lighting on", assumeDepth: "Brain assumes: brightness = distance only", clearMind: "Clear mental map",
    footer: "Open source · MIT License · contributions welcome",
    sun: "sun", creature: "creature", angleW: "width", bright: "brightness"
  }
};
let lang = "zh";
function applyLang() {
  document.querySelectorAll("[data-i18n]").forEach(el => { const k = el.dataset.i18n; if (I18N[lang][k]) el.textContent = I18N[lang][k]; });
  document.documentElement.lang = lang;
}
const T = k => I18N[lang][k];

// ---------- DOM ----------
const $ = id => document.getElementById(id);
const W = $("world"), wc = W.getContext("2d");
const RD = $("retina-depth"), RL = $("retina-light"), RB = $("retina-both");
const SG = $("signature"), sgc = SG.getContext("2d");
const MD = $("mind"), mdc = MD.getContext("2d");

// ---------- State ----------
const state = {
  shape: "circle", size: 100, orbit: 220, fov: 90, fog: 350, speed: 30,
  lightOn: true, assumeDepth: true,
  sun: { x: 110, y: 90 },
  creatureAngle: 0, autoWalk: true,
  custom: [],
  center: { x: 280, y: 340 },
  mind: [],          // reconstructed points {x,y,b}
  signature: new Array(360).fill(null)
};
const N_RAYS = 240;
const WORLD_W = 800;
window.__flatland = state; // for debugging and experiments

// ---------- Geometry ----------
function regular(n, r, rot = -Math.PI / 2) {
  const p = []; for (let i = 0; i < n; i++) { const a = rot + i * 2 * Math.PI / n; p.push([Math.cos(a) * r, Math.sin(a) * r]); } return p;
}
function starShape(r) {
  const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r * 0.45 : r; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return p;
}
function crescent(r) {
  const p = []; const n = 40;
  for (let i = 0; i <= n; i++) { const a = -Math.PI * 0.75 + i * (1.5 * Math.PI) / n; p.push([Math.cos(a) * r, Math.sin(a) * r]); }
  for (let i = n; i >= 0; i--) { const a = -Math.PI * 0.55 + i * (1.1 * Math.PI) / n; p.push([Math.cos(a) * r * 0.75 + r * 0.25, Math.sin(a) * r * 0.75]); }
  return p;
}
function ellipseShape(r, k) { const p = []; for (let i = 0; i < 64; i++) { const a = i * 2 * Math.PI / 64; p.push([Math.cos(a) * r, Math.sin(a) * r * k]); } return p; }
function eggShape(r) { const p = []; for (let i = 0; i < 64; i++) { const a = i * 2 * Math.PI / 64; const rr = r * (1 + 0.25 * Math.cos(a)) / 1.1; p.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.8]); } return p; }
function roundedSquare(r) { const p = []; const c = r * 0.5, s = r * 0.5; for (let q = 0; q < 4; q++) { const cx = Math.cos(q * Math.PI / 2 + Math.PI / 4) * Math.SQRT2 * s * 0.7, cy = Math.sin(q * Math.PI / 2 + Math.PI / 4) * Math.SQRT2 * s * 0.7; for (let i = 0; i <= 8; i++) { const a = q * Math.PI / 2 + i * Math.PI / 16; p.push([cx + Math.cos(a) * c, cy + Math.sin(a) * c]); } } return p; }
function gearShape(r) { const p = []; for (let i = 0; i < 48; i++) { const a = i * 2 * Math.PI / 48; const rr = (Math.floor(i / 3) % 2) ? r : r * 0.72; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return p; }
let asteroidSeed = 7;
function asteroidShape(r) { let x = asteroidSeed; const rnd = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
  const n = 36, amp = [], ph = []; for (let k = 0; k < 4; k++) { amp.push(0.08 + 0.12 * rnd()); ph.push(rnd() * 6.28); }
  const p = []; for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n; let rr = 1; amp.forEach((A, k) => rr += A * Math.cos((k + 2) * a + ph[k])); p.push([Math.cos(a) * r * rr * 0.85, Math.sin(a) * r * rr * 0.85]); } return p; }
function planetPolygon() {
  const r = state.size, c = state.center;
  let pts;
  switch (state.shape) {
    case "circle": pts = regular(64, r); break;
    case "triangle": pts = regular(3, r); break;
    case "square": pts = regular(4, r, -Math.PI / 4); break;
    case "pentagon": pts = regular(5, r); break;
    case "star": pts = starShape(r); break;
    case "crescent": pts = crescent(r); break;
    case "hexagon": pts = regular(6, r); break;
    case "ellipse": pts = ellipseShape(r, 0.6); break;
    case "egg": pts = eggShape(r); break;
    case "rounded": pts = roundedSquare(r); break;
    case "gear": pts = gearShape(r); break;
    case "asteroid": pts = asteroidShape(r); break;
    case "custom": return state.custom.length >= 3 ? state.custom.map(p => [p[0], p[1]]) : [];
  }
  return pts.map(([x, y]) => [x + c.x, y + c.y]);
}
function segments(poly) {
  const s = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; s.push([a, b]); } return s;
}
function raySeg(ox, oy, dx, dy, [[x1, y1], [x2, y2]]) {
  const ex = x2 - x1, ey = y2 - y1; const den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) return null;
  const t = ((x1 - ox) * ey - (y1 - oy) * ex) / den; const u = ((x1 - ox) * dy - (y1 - oy) * dx) / den;
  if (t > 1e-6 && u >= 0 && u <= 1) { let nx = ey, ny = -ex; const l = Math.hypot(nx, ny); nx /= l; ny /= l; if (nx * dx + ny * dy > 0) { nx = -nx; ny = -ny; } return { t, nx, ny }; }
  return null;
}
function castRay(ox, oy, dx, dy, segs) {
  let best = null; for (const s of segs) { const h = raySeg(ox, oy, dx, dy, s); if (h && (!best || h.t < best.t)) best = h; } return best;
}
// ---------- Creature & light ----------
function orbitRadius() { return Math.max(state.size + 30, state.orbit); }
function creaturePos() { const a = state.creatureAngle, r = orbitRadius(); return { x: state.center.x + Math.cos(a) * r, y: state.center.y + Math.sin(a) * r, facing: a + Math.PI }; }
function lightDir() { const c = state.center; const lx = state.sun.x - c.x, ly = state.sun.y - c.y; const l = Math.hypot(lx, ly) || 1; return { x: lx / l, y: ly / l }; }

function lit(px, py, nx, ny, segs) {
  const L = lightDir(); const d = nx * L.x + ny * L.y; if (d <= 0) return 0;
  // shadow test toward the sun (for non-convex shapes)
  const h = castRay(px + nx * 0.5, py + ny * 0.5, L.x, L.y, segs); if (h && h.t < 2000) return 0;
  return d;
}

// ---------- Rendering helpers ----------
function sampleRetina() {
  const poly = planetPolygon(); const segs = segments(poly);
  const cp = creaturePos(); const fov = state.fov * Math.PI / 180;
  const out = [];
  for (let i = 0; i < N_RAYS; i++) {
    const a = cp.facing - fov / 2 + fov * (i + 0.5) / N_RAYS; const dx = Math.cos(a), dy = Math.sin(a);
    const h = castRay(cp.x, cp.y, dx, dy, segs);
    if (!h) { out.push(null); continue; }
    const depth = Math.exp(-h.t / state.fog);
    const hx = cp.x + dx * h.t, hy = cp.y + dy * h.t;
    const li = state.lightOn ? (0.12 + 0.88 * lit(hx, hy, h.nx, h.ny, segs)) : 1;
    out.push({ a, dx, dy, t: h.t, depth, light: li, both: depth * li, hx, hy });
  }
  return { out, poly, segs, cp };
}

function drawRetina(canvas, samples, key) {
  const c = canvas.getContext("2d"); const w = canvas.width, h = canvas.height; c.fillStyle = "#070a14"; c.fillRect(0, 0, w, h);
  const cw = w / samples.length;
  samples.forEach((s, i) => { if (!s) return; const v = Math.round(255 * Math.min(1, s[key])); c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(i * cw, 0, Math.ceil(cw), h); });
  c.strokeStyle = "#2a3350"; c.strokeRect(0.5, 0.5, w - 1, h - 1);
}

function drawWorld(S) {
  const { out, poly, cp } = S; const w = W.width, h = W.height;
  wc.fillStyle = "#070a14"; wc.fillRect(0, 0, w, h);
  // membrane grid
  wc.strokeStyle = "#141c30"; wc.lineWidth = 1;
  for (let x = 0; x < w; x += 40) { wc.beginPath(); wc.moveTo(x, 0); wc.lineTo(x, h); wc.stroke(); }
  for (let y = 0; y < h; y += 40) { wc.beginPath(); wc.moveTo(0, y); wc.lineTo(w, y); wc.stroke(); }
  // orbit
  wc.strokeStyle = "#1f2a44"; wc.setLineDash([3, 5]); wc.beginPath(); wc.arc(state.center.x, state.center.y, orbitRadius(), 0, 2 * Math.PI); wc.stroke(); wc.setLineDash([]);
  // rays
  const fov = state.fov * Math.PI / 180;
  out.forEach((s, i) => { if (i % 4) return;
    const a = cp.facing - fov / 2 + fov * (i + 0.5) / N_RAYS;
    wc.beginPath(); wc.moveTo(cp.x, cp.y);
    if (!s) { wc.strokeStyle = "rgba(90,169,255,0.07)"; wc.lineTo(cp.x + Math.cos(a) * 900, cp.y + Math.sin(a) * 900); }
    else { wc.strokeStyle = "rgba(255,210,63,0.35)"; wc.lineTo(s.hx, s.hy); }
    wc.stroke(); });
  // planet with lighting
  if (poly.length) {
    const segs = segments(poly);
    wc.fillStyle = "#1c2438"; wc.beginPath(); poly.forEach(([x, y], i) => i ? wc.lineTo(x, y) : wc.moveTo(x, y)); wc.closePath(); wc.fill();
    segs.forEach(([[x1, y1], [x2, y2]]) => { let nx = y2 - y1, ny = -(x2 - x1); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      // outward normal: polygon orientation check via centroid
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; if ((mx - state.center.x) * nx + (my - state.center.y) * ny < 0) { nx = -nx; ny = -ny; }
      const v = state.lightOn ? 0.15 + 0.85 * lit(mx, my, nx, ny, segs) : 0.9;
      wc.strokeStyle = `rgba(${Math.round(120 + 135 * v)},${Math.round(130 + 120 * v)},${Math.round(160 + 90 * v)},1)`; wc.lineWidth = 4; wc.beginPath(); wc.moveTo(x1, y1); wc.lineTo(x2, y2); wc.stroke(); });
    wc.lineWidth = 1;
  }
  if (state.shape === "custom") { wc.fillStyle = "#ffd23f"; state.custom.forEach(([x, y]) => { wc.beginPath(); wc.arc(x, y, 3, 0, 7); wc.fill(); }); }
  // sun
  wc.fillStyle = "#ffd23f"; wc.beginPath(); wc.arc(state.sun.x, state.sun.y, 14, 0, 2 * Math.PI); wc.fill();
  const L = lightDir(); wc.strokeStyle = "rgba(255,210,63,0.5)"; for (let k = -2; k <= 2; k++) { const ox = -L.y * k * 18, oy = L.x * k * 18; wc.beginPath(); wc.moveTo(state.sun.x + ox, state.sun.y + oy); wc.lineTo(state.sun.x + ox - L.x * 60, state.sun.y + oy - L.y * 60); wc.stroke(); }
  wc.fillStyle = "#ffd23f"; wc.font = "12px sans-serif"; wc.fillText(T("sun"), state.sun.x + 18, state.sun.y + 4);
  // creature
  wc.fillStyle = "#3cff7a"; wc.beginPath(); wc.arc(cp.x, cp.y, 7, 0, 2 * Math.PI); wc.fill();
  wc.strokeStyle = "#3cff7a"; wc.lineWidth = 2; wc.beginPath(); wc.moveTo(cp.x, cp.y); wc.lineTo(cp.x + Math.cos(cp.facing) * 18, cp.y + Math.sin(cp.facing) * 18); wc.stroke(); wc.lineWidth = 1;
  wc.fillText(T("creature"), cp.x + 10, cp.y - 10);
}

function updateMind(S) {
  const { out, cp } = S;
  out.forEach((s, i) => { if (!s || i % 2) return;
    // creature's inference: depth from brightness
    const b = state.assumeDepth ? s.both : s.depth; const dEst = -state.fog * Math.log(Math.max(b, 1e-4));
    const x = cp.x + s.dx * dEst, y = cp.y + s.dy * dEst; state.mind.push({ x, y, b: s.both });
  });
  if (state.mind.length > 20000) state.mind.splice(0, state.mind.length - 20000);
  const w = MD.width, h = MD.height; mdc.fillStyle = "#070a14"; mdc.fillRect(0, 0, w, h);
  const sc = w / WORLD_W; mdc.save(); mdc.scale(sc, sc);
  state.mind.forEach(p => { mdc.fillStyle = `rgba(230,233,240,${0.45 + 0.55 * p.b})`; mdc.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); });
  mdc.fillStyle = "#3cff7a"; mdc.beginPath(); mdc.arc(cp.x, cp.y, 5, 0, 7); mdc.fill();
  mdc.restore();
}

function updateSignature(S) {
  const { out } = S; const hits = out.filter(Boolean);
  const idx = ((Math.round(state.creatureAngle * 180 / Math.PI) % 360) + 360) % 360;
  if (hits.length) { let first = out.findIndex(Boolean), last = out.length - 1 - [...out].reverse().findIndex(Boolean);
    const width = (last - first + 1) / N_RAYS * state.fov; const mean = hits.reduce((a, s) => a + s.both, 0) / hits.length; state.signature[idx] = { width, mean }; }
  else state.signature[idx] = { width: 0, mean: 0 };
  const w = SG.width, h = SG.height; sgc.fillStyle = "#070a14"; sgc.fillRect(0, 0, w, h);
  sgc.strokeStyle = "#1f2a44"; for (let k = 0; k <= 4; k++) { const x = k * w / 4; sgc.beginPath(); sgc.moveTo(x, 0); sgc.lineTo(x, h); sgc.stroke(); }
  sgc.fillStyle = "#8a93a8"; sgc.font = "11px sans-serif"; ["0°", "90°", "180°", "270°", "360°"].forEach((t, k) => sgc.fillText(t, k * w / 4 + 3, h - 4));
  const plot = (key, scale, color) => { sgc.strokeStyle = color; sgc.lineWidth = 1.5; sgc.beginPath(); let pen = false;
    for (let d = 0; d < 360; d++) { const v = state.signature[d]; if (!v) { pen = false; continue; } const x = d / 360 * w, y = h - 12 - v[key] / scale * (h - 24); pen ? sgc.lineTo(x, y) : sgc.moveTo(x, y); pen = true; } sgc.stroke(); };
  plot("width", state.fov, "#ffd23f"); plot("mean", 1, "#e6e9f0");
  sgc.fillStyle = "#ffd23f"; sgc.fillText(T("angleW"), 6, 14); sgc.fillStyle = "#e6e9f0"; sgc.fillText(T("bright"), 6, 28);
  const x = idx / 360 * w; sgc.strokeStyle = "#3cff7a"; sgc.beginPath(); sgc.moveTo(x, 0); sgc.lineTo(x, h); sgc.stroke();
}

// ---------- Main loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now; // clamp so a hidden tab does not jump
  if (state.autoWalk) state.creatureAngle += dt * state.speed / 100 * 1.2;
  const S = sampleRetina();
  drawWorld(S); drawRetina(RD, S.out, "depth"); drawRetina(RL, S.out, "light"); drawRetina(RB, S.out, "both");
  updateMind(S); updateSignature(S);
  requestAnimationFrame(frame);
}

// ---------- UI wiring ----------
const bind = (id, key, f = v => +v) => { const el = $(id); el.addEventListener("input", () => { state[key] = f(el.value); if (["shape", "size", "orbit", "fog"].includes(id)) resetMind(); }); };
bind("shape", "shape", v => { if (v === "asteroid") asteroidSeed = (asteroidSeed * 7 + 3) % 1000 + 1; return v; }); bind("size", "size"); bind("orbit", "orbit"); bind("fov", "fov"); bind("fog", "fog"); bind("speed", "speed");
$("lightOn").addEventListener("change", e => { state.lightOn = e.target.checked; resetMind(); });
$("assumeDepth").addEventListener("change", e => { state.assumeDepth = e.target.checked; resetMind(); });
$("clearMind").addEventListener("click", resetMind);
function resetMind() { state.mind = []; state.signature = new Array(360).fill(null); }
$("btn-zh").onclick = () => { lang = "zh"; applyLang(); }; $("btn-en").onclick = () => { lang = "en"; applyLang(); };

// mouse interaction on world canvas
let drag = null;
function pos(e) { const r = W.getBoundingClientRect(); return { x: (e.clientX - r.left) * W.width / r.width, y: (e.clientY - r.top) * W.height / r.height }; }
W.addEventListener("mousedown", e => { const p = pos(e); const cp = creaturePos();
  if (Math.hypot(p.x - state.sun.x, p.y - state.sun.y) < 20) drag = "sun";
  else if (Math.hypot(p.x - cp.x, p.y - cp.y) < 16) { drag = "creature"; state.autoWalk = false; }
  else if (state.shape === "custom") { state.custom.push([p.x, p.y]); resetMind(); }
});
window.addEventListener("mousemove", e => { if (!drag) return; const p = pos(e);
  if (drag === "sun") state.sun = p; else { state.creatureAngle = Math.atan2(p.y - state.center.y, p.x - state.center.x); } });
window.addEventListener("mouseup", () => { if (drag === "creature") state.autoWalk = state.speed > 0; drag = null; });
W.addEventListener("dblclick", () => { if (state.shape === "custom") { state.custom = []; resetMind(); } });

applyLang(); requestAnimationFrame(frame);
})();
