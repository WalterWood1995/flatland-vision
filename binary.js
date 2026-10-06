/* Flatland binary stars. MIT License. */
(() => {
"use strict"; const F = window.FL;
const I18N = {
  zh: { title: "二维世界的双星", subtitle: "两颗恒星绕着共同的质心转。远处的生物看它们，是两段亮线时而分开、时而合并。合并的时候，一颗挡住另一颗，总亮度下降。二维里每一对双星都是食双星。",
    world: "上帝视角", worldHint: "拖动绿色生物改变观察方向。叉号是质心。", retina: "生物眼中的双星（放大）", curve: "光变曲线", curveHint: "纵轴：生物收到的总亮度。一个周期里有两次下陷：亮星被挡是主食，暗星被挡是次食。两次下陷的深度不同。", sep: "两段亮线的间距",
    controls: "控制", q: "质量比 m2 / m1", sepr: "两星间距", s1: "主星半径", s2: "伴星半径", b2: "伴星表面亮度（主星为 1）", speed: "公转速度", notes: "二维世界里的不同",
    notes1: "三维里只有轨道面几乎对着我们的双星才会互相遮挡，所以食双星是少数。二维里轨道和视线在同一张膜上，每一对双星每转一圈必定互相遮挡两次。",
    notes2: "两颗星绕质心转，质量大的离质心近、转得慢。拖动质量比，可以看到质心往哪边挪。", footer: "开源项目 · MIT 许可 · 欢迎加入创作",
    creature: "生物", bary: "质心", primary: "主食：主星被挡住", secondary: "次食：伴星被挡住", none: "两颗星分开", bright: "总亮度 {p}%" },
  en: { title: "Binary stars in Flatland", subtitle: "Two stars orbit their common centre of mass. A distant creature sees two bright segments that separate and merge. When they merge, one star hides the other and the total brightness drops. In 2D every binary is an eclipsing binary.",
    world: "God's eye view", worldHint: "Drag the green creature to change the viewing direction. The cross is the barycentre.", retina: "The binary as the creature sees it (zoomed)", curve: "Light curve", curveHint: "y: total brightness received. Two dips per orbit: the primary eclipse when the bright star is hidden, the secondary when the faint one is. The dips differ in depth.", sep: "Separation of the two segments",
    controls: "Controls", q: "Mass ratio m2 / m1", sepr: "Separation", s1: "Primary radius", s2: "Companion radius", b2: "Companion surface brightness (primary = 1)", speed: "Orbital speed", notes: "What is different in 2D",
    notes1: "In 3D only binaries whose orbital plane nearly faces us eclipse, so eclipsing binaries are a minority. In 2D orbit and line of sight share one membrane, so every binary eclipses twice per orbit.",
    notes2: "Both stars orbit the barycentre; the heavier one stays closer to it and moves slower. Drag the mass ratio to watch the barycentre shift.", footer: "Open source · MIT License · contributions welcome",
    creature: "creature", bary: "barycentre", primary: "primary eclipse: bright star hidden", secondary: "secondary eclipse: companion hidden", none: "stars separated", bright: "total brightness {p}%" }
};
const T = k => I18N[F.lang][k];
const $ = id => document.getElementById(id); const W = $("world"), wc = W.getContext("2d"), RT = $("retina"), rc = RT.getContext("2d"), CV = $("curve"), cc = CV.getContext("2d"), SP = $("sepc"), spc = SP.getContext("2d");
const state = { q: 0.5, sepr: 140, s1: 26, s2: 16, b2: 0.35, speed: 25, phase: 0.1, obsAng: Math.PI, center: { x: 400, y: 330 }, curve: new Array(360).fill(null), sepc: new Array(360).fill(null) };
const N = 300;
function starsPos() { const a = state.phase * 2 * Math.PI; const q = state.q; const d1 = state.sepr * q / (1 + q), d2 = state.sepr / (1 + q); const c = state.center;
  return { s1: { x: c.x + Math.cos(a) * d1, y: c.y + Math.sin(a) * d1, r: state.s1, b: 1 }, s2: { x: c.x - Math.cos(a) * d2, y: c.y - Math.sin(a) * d2, r: state.s2, b: state.b2 } }; }
const obsPos = () => ({ x: state.center.x + Math.cos(state.obsAng) * 290, y: state.center.y + Math.sin(state.obsAng) * 290 });
function sample(o, S) { const base = Math.atan2(state.center.y - o.y, state.center.x - o.x); const ang = 0.5; const out = []; let total = 0, tot1 = 0, tot2 = 0, hid1 = 0, hid2 = 0;
  for (let i = 0; i < N; i++) { const a = base - ang + 2 * ang * (i + 0.5) / N; const dx = Math.cos(a), dy = Math.sin(a);
    const t1 = F.rayCircle(o.x, o.y, dx, dy, S.s1.x, S.s1.y, S.s1.r), t2 = F.rayCircle(o.x, o.y, dx, dy, S.s2.x, S.s2.y, S.s2.r);
    let v = 0, who = 0; if (t1 && (!t2 || t1 < t2)) { v = 1; who = 1; if (t2) hid2++; } else if (t2) { v = state.b2; who = 2; if (t1) hid1++; }
    if (t1) tot1++; if (t2) tot2++; total += v; out.push({ v, who }); }
  // separation of segment centres on the sky
  const c1 = Math.atan2(S.s1.y - o.y, S.s1.x - o.x), c2 = Math.atan2(S.s2.y - o.y, S.s2.x - o.x);
  return { out, total: total / N, hid1, hid2, tot1, tot2, sep: Math.abs(F.wrapAngle(c1 - c2)) }; }
function drawWorld(S, o) { const w = W.width, h = W.height; F.grid(wc, w, h); const c = state.center;
  wc.strokeStyle = "#1f2a44"; wc.setLineDash([3, 5]); [state.sepr * state.q / (1 + state.q), state.sepr / (1 + state.q)].forEach(r => { wc.beginPath(); wc.arc(c.x, c.y, r, 0, 7); wc.stroke(); }); wc.setLineDash([]);
  wc.strokeStyle = "#8a93a8"; wc.beginPath(); wc.moveTo(c.x - 6, c.y - 6); wc.lineTo(c.x + 6, c.y + 6); wc.moveTo(c.x + 6, c.y - 6); wc.lineTo(c.x - 6, c.y + 6); wc.stroke(); wc.font = "11px sans-serif"; wc.fillStyle = "#8a93a8"; wc.fillText(T("bary"), c.x + 10, c.y - 8);
  const draw = (s, col) => { const g = wc.createRadialGradient(s.x, s.y, s.r * 0.3, s.x, s.y, s.r * 2.2); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); wc.fillStyle = g; wc.beginPath(); wc.arc(s.x, s.y, s.r * 2.2, 0, 7); wc.fill(); wc.fillStyle = col; wc.beginPath(); wc.arc(s.x, s.y, s.r, 0, 7); wc.fill(); };
  draw(S.s2, `rgba(255,${Math.round(120 + 100 * state.b2)},${Math.round(60 + 60 * state.b2)},1)`); draw(S.s1, "#fff3a0");
  wc.strokeStyle = "rgba(60,255,122,0.3)"; wc.setLineDash([4, 4]); wc.beginPath(); wc.moveTo(o.x, o.y); wc.lineTo(c.x, c.y); wc.stroke(); wc.setLineDash([]);
  wc.fillStyle = "#3cff7a"; wc.beginPath(); wc.arc(o.x, o.y, 7, 0, 7); wc.fill(); wc.fillText(T("creature"), o.x + 10, o.y - 8); }
function drawRetina(V) { const w = RT.width, h = RT.height; rc.fillStyle = "#070a14"; rc.fillRect(0, 0, w, h); const cw = w / N;
  V.out.forEach((s, i) => { if (!s.who) return; rc.fillStyle = s.who === 1 ? "#fff3a0" : `rgb(255,${Math.round(120 + 100 * state.b2)},${Math.round(60 + 60 * state.b2)})`; rc.fillRect(i * cw, 0, Math.ceil(cw), h); });
  let msg = T("none"); if (V.hid1 > 0.5 * V.tot1) msg = T("primary"); else if (V.hid2 > 0.5 * V.tot2) msg = T("secondary");
  $("status").textContent = msg + " · " + T("bright").replace("{p}", Math.round(100 * V.total / Math.max(state.maxTotal || V.total, 1e-6))); }
function plot(ctx, canvas, arr, key, color, idx) { const w = canvas.width, h = canvas.height; ctx.fillStyle = "#070a14"; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = "#1f2a44"; for (let k = 0; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(k * w / 4, 0); ctx.lineTo(k * w / 4, h); ctx.stroke(); }
  const vals = arr.filter(v => v != null).map(v => v[key]); const mx = Math.max(...vals, 1e-6); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); let pen = false;
  for (let d = 0; d < 360; d++) { const v = arr[d]; if (v == null) { pen = false; continue; } const x = d / 360 * w, y = h - 10 - v[key] / mx * (h - 20); pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; } ctx.stroke();
  ctx.strokeStyle = "#3cff7a"; ctx.beginPath(); ctx.moveTo(idx / 360 * w, 0); ctx.lineTo(idx / 360 * w, h); ctx.stroke(); }
const reset = () => { state.curve = new Array(360).fill(null); state.maxTotal = 0; };
F.setupLang(I18N); F.bindRanges(state, ["q", "sepr", "s1", "s2", "b2", "speed"], reset);
F.dragOn(W, p => { const o = obsPos(); return Math.hypot(p.x - o.x, p.y - o.y) < 20; }, p => { state.obsAng = Math.atan2(p.y - state.center.y, p.x - state.center.x); reset(); });
F.loop(dt => { state.phase += dt * state.speed / 100 * 0.08; const S = starsPos(), o = obsPos(); const V = sample(o, S); state.maxTotal = Math.max(state.maxTotal || 0, V.total);
  const idx = Math.floor((((state.phase % 1) + 1) % 1) * 360); state.curve[idx] = { total: V.total, sep: V.sep };
  drawWorld(S, o); drawRetina(V); plot(cc, CV, state.curve, "total", "#ffd23f", idx); plot(spc, SP, state.curve, "sep", "#e6e9f0", idx); });
})();
