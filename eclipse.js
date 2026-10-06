/* Flatland Eclipse - solar and lunar eclipses in a 2D world. MIT License. */
(() => {
"use strict";
const I18N = {
  zh: { title: "二维世界的日食与月食", subtitle: "一颗二维行星，一颗二维卫星，一个远处的太阳。站在行星表面的二维生物，眼里只有一条线段。卫星挡住太阳，是日食；卫星走进行星的影子，是月食。",
    world: "上帝视角", worldHint: "拖动绿色生物可以沿行星表面移动。深色扇形是本影，浅色扇形是半影。",
    retina: "生物眼中的线段", lgSun: "太阳", lgMoon: "卫星（被照亮）", lgDark: "卫星（在影子里）", lgGround: "地平线以下",
    curves: "光变曲线", curvesHint: "黄线：生物收到的太阳光。白线：卫星的亮度。日食时黄线下陷，月食时白线下陷。横轴是卫星公转的相位。",
    sky: "生物眼中的“天空”（展开成一圈）", skyHint: "把生物能看到的全部方向展开成一条线。中间是头顶，两端是地平线。",
    controls: "控制", moonDist: "卫星轨道半径", moonSize: "卫星大小", sunSize: "太阳角直径（决定半影宽度）", sunAngle: "太阳方向", speed: "卫星公转速度", fov: "视场角", lockSun: "生物始终望向太阳",
    goSolar: "跳到下一次日食", goLunar: "跳到下一次月食", pause: "暂停 / 继续",
    notes: "二维世界里的不同",
    notes1: "在三维里，月亮的轨道面和地球绕太阳的轨道面有一个夹角，所以不是每个月都有日食。在二维里，所有东西都在同一张膜上，卫星每转一圈必定挡一次太阳、进一次影子。日食和月食在二维世界里是家常便饭。",
    notes2: "本影在三维里是一个圆锥，在二维里是一个楔形。太阳越大，半影越宽，影子的边缘越模糊。把太阳角直径调到零，影子就有了锋利的边。",
    footer: "开源项目 · MIT 许可 · 欢迎加入创作", navVision: "看星体", navEclipse: "日食与月食",
    stSolarTotal: "日全食：太阳被完全挡住", stSolarPartial: "日偏食：太阳被挡住 {p}%", stLunarTotal: "月全食：卫星完全在本影里", stLunarPartial: "月偏食：卫星部分进入本影", stPenumbra: "半影月食：卫星在半影里，略微变暗", stNight: "夜晚：太阳在地平线以下", stNone: "平常的白天",
    sunLabel: "太阳光", moonLabel: "卫星", creature: "生物", umbra: "本影", penumbra: "半影" },
  en: { title: "Eclipses in Flatland", subtitle: "A 2D planet, a 2D moon, a distant sun. A creature on the planet's surface sees only a line segment. When the moon covers the sun, that is a solar eclipse; when the moon enters the planet's shadow, a lunar eclipse.",
    world: "God's eye view", worldHint: "Drag the green creature along the surface. Dark wedge: umbra. Light wedge: penumbra.",
    retina: "What the creature sees", lgSun: "sun", lgMoon: "moon (lit)", lgDark: "moon (in shadow)", lgGround: "below horizon",
    curves: "Light curves", curvesHint: "Yellow: sunlight received by the creature. White: moon brightness. Solar eclipses dip the yellow line, lunar eclipses dip the white one. x: orbital phase of the moon.",
    sky: "The creature's whole sky, unrolled", skyHint: "Every direction the creature can see, laid out on one line. Middle is overhead, ends are the horizon.",
    controls: "Controls", moonDist: "Moon orbit radius", moonSize: "Moon size", sunSize: "Sun angular diameter (sets penumbra width)", sunAngle: "Sun direction", speed: "Moon orbital speed", fov: "Field of view", lockSun: "Creature always faces the sun",
    goSolar: "Jump to next solar eclipse", goLunar: "Jump to next lunar eclipse", pause: "Pause / resume",
    notes: "What is different in 2D",
    notes1: "In 3D the Moon's orbit is tilted relative to Earth's orbit, so eclipses do not happen every month. In 2D everything lies on the same membrane: every orbit the moon must cover the sun once and enter the shadow once. Eclipses are routine in Flatland.",
    notes2: "The umbra is a cone in 3D and a wedge in 2D. A bigger sun makes a wider penumbra and a softer shadow edge. Set the sun's angular diameter to zero and the shadow gets a sharp edge.",
    footer: "Open source · MIT License · contributions welcome", navVision: "Seeing a planet", navEclipse: "Eclipses",
    stSolarTotal: "Total solar eclipse: the sun is fully covered", stSolarPartial: "Partial solar eclipse: {p}% of the sun covered", stLunarTotal: "Total lunar eclipse: moon fully in the umbra", stLunarPartial: "Partial lunar eclipse: moon partly in the umbra", stPenumbra: "Penumbral eclipse: moon slightly dimmed", stNight: "Night: sun below the horizon", stNone: "An ordinary day",
    sunLabel: "sunlight", moonLabel: "moon", creature: "creature", umbra: "umbra", penumbra: "penumbra" }
};
let lang = "zh"; const T = k => I18N[window.FL.lang][k];
function applyLang() { window.FL.lang = lang; window.FL.applyLang(I18N); return; document.querySelectorAll("[data-i18n]").forEach(el => { const k = el.dataset.i18n; if (I18N[lang][k]) el.textContent = I18N[lang][k]; }); document.documentElement.lang = lang; }

const $ = id => document.getElementById(id);
const W = $("world"), wc = W.getContext("2d"); const RT = $("retina"), rc = RT.getContext("2d");
const CV = $("curves"), cc = CV.getContext("2d"); const SK = $("sky"), skc = SK.getContext("2d");

const state = { texture: "craters", spin: 12, rot: 0, moonDist: 210, moonSize: 24, sunSize: 4, sunAngle: 180, speed: 25, fov: 120, lockSun: true, paused: false,
  phase: 0.3, obs: Math.PI, center: { x: 400, y: 330 }, R: 70, sunDist: 100000, curves: new Array(360).fill(null) };
const N = 300;

// ---------- geometry ----------
function sunDir() { const a = state.sunAngle * Math.PI / 180; return { x: Math.cos(a), y: Math.sin(a) }; }
function moonPos() { const a = state.phase * 2 * Math.PI; return { x: state.center.x + Math.cos(a) * state.moonDist, y: state.center.y + Math.sin(a) * state.moonDist }; }
function obsPos() { return { x: state.center.x + Math.cos(state.obs) * state.R, y: state.center.y + Math.sin(state.obs) * state.R, nx: Math.cos(state.obs), ny: Math.sin(state.obs) }; }
function rayCircle(ox, oy, dx, dy, cx, cy, r) { const fx = ox - cx, fy = oy - cy; const b = fx * dx + fy * dy; const c = fx * fx + fy * fy - r * r; const d = b * b - c; if (d < 0) return null; const t = -b - Math.sqrt(d); return t > 1e-6 ? t : null; }
// fraction of the sun disk visible from point p: sample the sun's angular extent, test occlusion by the planet and the moon
function sunVisible(px, py, ignoreMoon) {
  const S = sunDir(), half = state.sunSize * Math.PI / 360; const n = 15; let vis = 0;
  const m = moonPos();
  for (let i = 0; i < n; i++) { const a = Math.atan2(S.y, S.x) - half + (2 * half) * (i + 0.5) / n; const dx = Math.cos(a), dy = Math.sin(a);
    if (rayCircle(px, py, dx, dy, state.center.x, state.center.y, state.R)) continue;
    if (!ignoreMoon && rayCircle(px, py, dx, dy, m.x, m.y, state.moonSize)) continue; vis++; }
  return vis / n;
}
// shadow wedge polygons of the planet (umbra and penumbra), from tangent lines of planet vs finite sun
function shadowWedges() {
  const S = sunDir(), half = state.sunSize * Math.PI / 360; const c = state.center, R = state.R; const L = 2000;
  const back = { x: -S.x, y: -S.y }; const perp = { x: -S.y, y: S.x };
  const edge = (side, ang) => { // tangent point on side, ray direction rotated by ang
    const px = c.x + perp.x * R * side, py = c.y + perp.y * R * side; const a = Math.atan2(back.y, back.x) + ang; return [[px, py], [px + Math.cos(a) * L, py + Math.sin(a) * L]]; };
  // umbra: rays converge (rotate inward by half), penumbra: diverge (rotate outward)
  const uL = edge(1, -half), uR = edge(-1, half), pL = edge(1, half), pR = edge(-1, -half);
  return { umbra: [uL[0], uL[1], uR[1], uR[0]], penumbra: [pL[0], pL[1], pR[1], pR[0]] };
}
function moonLight() { const m = moonPos(); return sunVisible(m.x, m.y, true); } // 1 lit, 0 in umbra, between in penumbra

// ---------- retina sampling ----------
function sampleView() {
  const o = obsPos(); const S = sunDir(); const m = moonPos();
  const facing = state.lockSun ? Math.atan2(S.y, S.x) : Math.atan2(o.ny, o.nx);
  const fov = state.fov * Math.PI / 180; const sunA = Math.atan2(S.y, S.x), half = state.sunSize * Math.PI / 360;
  const ml = moonLight(); const out = [];
  for (let i = 0; i < N; i++) { const a = facing - fov / 2 + fov * (i + 0.5) / N; const dx = Math.cos(a), dy = Math.sin(a);
    if (dx * o.nx + dy * o.ny < 0) { out.push({ kind: "ground" }); continue; }
    const tm = rayCircle(o.x, o.y, dx, dy, m.x, m.y, state.moonSize);
    if (tm) { const px = o.x + dx * tm, py = o.y + dy * tm; const alb = window.FL.albedo(state.texture, (Math.atan2(py - m.y, px - m.x) - state.rot) / (2 * Math.PI));
      const v = 0.08 + 0.72 * ml; out.push({ kind: "moon", v, rgb: alb.map(c => c * v) }); continue; }
    let da = Math.atan2(Math.sin(a - sunA), Math.cos(a - sunA));
    if (Math.abs(da) <= Math.max(half, 0.004)) { out.push({ kind: "sun" }); continue; }
    out.push({ kind: "sky" });
  }
  return { out, facing, o, m, ml };
}

// ---------- drawing ----------
function drawWorld(V) {
  const w = W.width, h = W.height; wc.fillStyle = "#070a14"; wc.fillRect(0, 0, w, h);
  wc.strokeStyle = "#141c30"; for (let x = 0; x < w; x += 40) { wc.beginPath(); wc.moveTo(x, 0); wc.lineTo(x, h); wc.stroke(); } for (let y = 0; y < h; y += 40) { wc.beginPath(); wc.moveTo(0, y); wc.lineTo(w, y); wc.stroke(); }
  const { umbra, penumbra } = shadowWedges();
  const poly = (p, fill) => { wc.fillStyle = fill; wc.beginPath(); p.forEach(([x, y], i) => i ? wc.lineTo(x, y) : wc.moveTo(x, y)); wc.closePath(); wc.fill(); };
  poly(penumbra, "rgba(40,50,90,0.35)"); poly(umbra, "rgba(5,8,20,0.9)");
  // moon shadow wedges too (for solar eclipse on the ground)
  const m = V.m; const S = sunDir(), half = state.sunSize * Math.PI / 360, back = Math.atan2(-S.y, -S.x), perp = { x: -S.y, y: S.x }, r = state.moonSize, L = 2000;
  const mw = (ang, side) => [m.x + perp.x * r * side, m.y + perp.y * r * side, Math.cos(back + ang), Math.sin(back + ang)];
  const [ax, ay, adx, ady] = mw(-half, 1), [bx, by, bdx, bdy] = mw(half, -1), [cx2, cy2, cdx, cdy] = mw(half, 1), [ex, ey, edx, edy] = mw(-half, -1);
  poly([[cx2, cy2], [cx2 + cdx * L, cy2 + cdy * L], [ex + edx * L, ey + edy * L], [ex, ey]], "rgba(40,50,90,0.3)");
  poly([[ax, ay], [ax + adx * L, ay + ady * L], [bx + bdx * L, by + bdy * L], [bx, by]], "rgba(5,8,20,0.85)");
  wc.fillStyle = "#6b7bff"; wc.font = "11px sans-serif"; wc.fillText(T("umbra"), umbra[1][0] * 0.25 + umbra[0][0] * 0.75, umbra[1][1] * 0.25 + umbra[0][1] * 0.75);
  // sunlight arrows from the sun direction
  wc.strokeStyle = "rgba(255,210,63,0.35)"; for (let k = -7; k <= 7; k++) { const ox = state.center.x + S.x * 380 + perp.x * k * 40, oy = state.center.y + S.y * 380 + perp.y * k * 40; wc.beginPath(); wc.moveTo(ox, oy); wc.lineTo(ox - S.x * 60, oy - S.y * 60); wc.stroke(); }
  wc.fillStyle = "#ffd23f"; wc.fillText(T("sunLabel") + " →", state.center.x + S.x * 330 - 20, state.center.y + S.y * 330 - 8);
  // moon orbit
  wc.strokeStyle = "#1f2a44"; wc.setLineDash([3, 5]); wc.beginPath(); wc.arc(state.center.x, state.center.y, state.moonDist, 0, 7); wc.stroke(); wc.setLineDash([]);
  // planet: lit half
  const c = state.center; wc.fillStyle = "#1c2438"; wc.beginPath(); wc.arc(c.x, c.y, state.R, 0, 7); wc.fill();
  const sa = Math.atan2(S.y, S.x); wc.strokeStyle = "#cfd6e6"; wc.lineWidth = 4; wc.beginPath(); wc.arc(c.x, c.y, state.R, sa - Math.PI / 2, sa + Math.PI / 2); wc.stroke(); wc.lineWidth = 1;
  // moon with lit side
  const ml = V.ml; wc.fillStyle = `rgb(${Math.round(40 + 120 * ml)},${Math.round(44 + 120 * ml)},${Math.round(60 + 110 * ml)})`; wc.beginPath(); wc.arc(m.x, m.y, state.moonSize, 0, 7); wc.fill();
  window.FL.texturedRim(wc, m.x, m.y, state.moonSize, state.texture, state.rot, a => ml * Math.max(0, Math.cos(a) * S.x + Math.sin(a) * S.y), 4);
  if (ml < 0.02) { wc.strokeStyle = "#ff6b6b"; wc.beginPath(); wc.arc(m.x, m.y, state.moonSize + 3, 0, 7); wc.stroke(); }
  wc.fillStyle = "#e6e9f0"; wc.fillText(T("moonLabel"), m.x + state.moonSize + 4, m.y + 4);
  // creature and its view wedge
  const o = V.o; const fov = state.fov * Math.PI / 180;
  wc.fillStyle = "rgba(60,255,122,0.07)"; wc.beginPath(); wc.moveTo(o.x, o.y); wc.arc(o.x, o.y, 900, V.facing - fov / 2, V.facing + fov / 2); wc.closePath(); wc.fill();
  wc.fillStyle = "#3cff7a"; wc.beginPath(); wc.arc(o.x, o.y, 6, 0, 7); wc.fill(); wc.fillText(T("creature"), o.x + o.nx * 14, o.y + o.ny * 14);
}
function drawRetina(V) {
  const w = RT.width, h = RT.height; rc.fillStyle = "#070a14"; rc.fillRect(0, 0, w, h); const cw = w / N;
  V.out.forEach((s, i) => { let col = "#0b1020"; if (s.kind === "sun") col = "#fff3a0"; else if (s.kind === "moon") { col = s.v < 0.15 ? `rgb(${Math.round(255 * s.rgb[0]) + 40},${Math.round(255 * s.rgb[1])},${Math.round(255 * s.rgb[2])})` : window.FL.rgb(s.rgb, 1); } else if (s.kind === "ground") col = "#2a2318";
    rc.fillStyle = col; rc.fillRect(i * cw, 0, Math.ceil(cw), h); });
}
function drawSky(V) {
  const w = SK.width, h = SK.height; skc.fillStyle = "#070a14"; skc.fillRect(0, 0, w, h);
  const o = V.o, S = sunDir(), m = V.m; const up = Math.atan2(o.ny, o.nx); const half = state.sunSize * Math.PI / 360;
  for (let i = 0; i < w; i++) { const a = up - Math.PI / 2 + Math.PI * (i + 0.5) / w; const dx = Math.cos(a), dy = Math.sin(a); let col = "#0b1020";
    const tmm = rayCircle(o.x, o.y, dx, dy, m.x, m.y, state.moonSize);
    if (tmm) { const px = o.x + dx * tmm, py = o.y + dy * tmm; const alb = window.FL.albedo(state.texture, (Math.atan2(py - m.y, px - m.x) - state.rot) / (2 * Math.PI)); col = window.FL.rgb(alb, 0.08 + 0.72 * V.ml); }
    else { const da = Math.atan2(Math.sin(a - Math.atan2(S.y, S.x)), Math.cos(a - Math.atan2(S.y, S.x))); if (Math.abs(da) <= Math.max(half, 0.004)) col = "#fff3a0"; }
    skc.fillStyle = col; skc.fillRect(i, 0, 1, h); }
  skc.fillStyle = "#8a93a8"; skc.font = "10px sans-serif"; skc.fillText("↑", w / 2 - 3, h - 4);
}
function status(V) {
  const o = V.o; const sunFrac = sunVisible(o.x, o.y, false), sunFree = sunVisible(o.x, o.y, true); const ml = V.ml;
  let msg; if (sunFree < 0.02) msg = T("stNight"); else if (sunFrac < 0.02) msg = T("stSolarTotal"); else if (sunFrac < sunFree - 0.02) msg = T("stSolarPartial").replace("{p}", Math.round(100 * (1 - sunFrac / sunFree)));
  else if (ml < 0.02) msg = T("stLunarTotal"); else if (ml < 0.6) msg = T("stLunarPartial"); else if (ml < 0.98) msg = T("stPenumbra"); else msg = T("stNone");
  $("status").textContent = msg; return { sunFrac, ml };
}
function drawCurves(st) {
  const idx = Math.floor(((state.phase % 1) + 1) % 1 * 360); state.curves[idx] = st;
  const w = CV.width, h = CV.height; cc.fillStyle = "#070a14"; cc.fillRect(0, 0, w, h);
  cc.strokeStyle = "#1f2a44"; for (let k = 0; k <= 4; k++) { cc.beginPath(); cc.moveTo(k * w / 4, 0); cc.lineTo(k * w / 4, h); cc.stroke(); }
  const plot = (key, color) => { cc.strokeStyle = color; cc.lineWidth = 1.5; cc.beginPath(); let pen = false; for (let d = 0; d < 360; d++) { const v = state.curves[d]; if (!v) { pen = false; continue; } const x = d / 360 * w, y = h - 12 - v[key] * (h - 24); pen ? cc.lineTo(x, y) : cc.moveTo(x, y); pen = true; } cc.stroke(); };
  plot("sunFrac", "#ffd23f"); plot("ml", "#e6e9f0");
  cc.strokeStyle = "#3cff7a"; cc.beginPath(); cc.moveTo(idx / 360 * w, 0); cc.lineTo(idx / 360 * w, h); cc.stroke();
}

// ---------- loop ----------
let last = performance.now();
function frame(now) { const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (!state.paused) { state.phase += dt * state.speed / 100 * 0.08; state.rot += dt * state.spin * Math.PI / 180; }
  const V = sampleView(); drawWorld(V); drawRetina(V); drawSky(V); drawCurves(status(V)); requestAnimationFrame(frame); }

// ---------- UI ----------
const bind = (id, key) => { $(id).addEventListener("input", e => { state[key] = +e.target.value; state.curves = new Array(360).fill(null); }); };
["moonDist", "moonSize", "sunSize", "sunAngle", "speed", "fov", "spin"].forEach(k => bind(k, k));
window.FL.fillTextureSelect($("texture")); $("texture").value = state.texture; $("texture").addEventListener("input", e => state.texture = e.target.value);
$("lockSun").addEventListener("change", e => state.lockSun = e.target.checked);
$("pause").onclick = () => state.paused = !state.paused;
function jumpTo(test) { const start = state.phase; for (let k = 1; k <= 720; k++) { state.phase = start + k / 720; if (test()) return; } state.phase = start; }
$("goSolar").onclick = () => { state.obs = state.sunAngle * Math.PI / 180; state.lockSun = true; $("lockSun").checked = true; // stand at noon, face the sun
  jumpTo(() => { const o = obsPos(); return sunVisible(o.x, o.y, false) < sunVisible(o.x, o.y, true) - 0.1; }); };
$("goLunar").onclick = () => { state.obs = state.sunAngle * Math.PI / 180 + Math.PI; state.lockSun = false; $("lockSun").checked = false; // stand at midnight, face the sky
  jumpTo(() => moonLight() < 0.5); };

let drag = false; const pos = e => { const r = W.getBoundingClientRect(); return { x: (e.clientX - r.left) * W.width / r.width, y: (e.clientY - r.top) * W.height / r.height }; };
W.addEventListener("mousedown", e => { const p = pos(e), o = obsPos(); if (Math.hypot(p.x - o.x, p.y - o.y) < 18) drag = true; });
window.addEventListener("mousemove", e => { if (!drag) return; const p = pos(e); state.obs = Math.atan2(p.y - state.center.y, p.x - state.center.x); });
window.addEventListener("mouseup", () => drag = false);
window.__eclipse = state;
window.FL.setupLang(I18N); applyLang(); requestAnimationFrame(frame);
})();
