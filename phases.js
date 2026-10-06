/* Flatland moon phases. MIT License. */
(() => {
"use strict"; const F = window.FL;
const I18N = {
  zh: { title: "二维世界的月相", subtitle: "卫星绕着行星转，太阳从远处照过来。站在行星上的生物，眼里的卫星是一条线段，被照亮的部分从一端长到另一端，再缩回去。二维里没有弯弯的月牙，只有亮段的长短。",
    world: "上帝视角", worldHint: "拖动绿色生物可以沿行星表面移动。卫星白色的一侧朝向太阳。", retina: "生物眼中的卫星（放大）", curve: "亮段占比随相位的变化",
    curveHint: "纵轴：卫星线段里被照亮的比例。0 是“新月”，1 是“满月”。曲线不是正弦，因为二维里亮段的边界是一个点，不是一条弧。", strip: "一个周期里的八个相位",
    controls: "控制", moonDist: "卫星轨道半径", moonSize: "卫星大小", sunAngle: "太阳方向", speed: "公转速度", track: "生物始终望向卫星", notes: "二维世界里的不同",
    notes1: "三维的月相是圆盘上一条明暗交界的弧，因为月球是球，照亮的是半个球面。二维的卫星是圆盘，照亮的是半个圆周，生物看到的是一条线段，亮段和暗段之间只有一个分界点。",
    notes2: "“新月”时卫星在太阳和行星之间，正好也是日食的位置。二维里月相和食是同一件事的两个侧面。", footer: "开源项目 · MIT 许可 · 欢迎加入创作",
    creature: "生物", sunLabel: "太阳光", below: "卫星在地平线以下", lit: "亮段占 {p}%", names: ["新月", "蛾眉", "上弦", "盈凸", "满月", "亏凸", "下弦", "残月"] },
  en: { title: "Moon phases in Flatland", subtitle: "A moon orbits the planet, lit by a distant sun. To a creature on the planet the moon is a line segment whose lit part grows from one end to the other and shrinks back. No crescents in 2D, only the length of the bright part.",
    world: "God's eye view", worldHint: "Drag the green creature along the surface. The moon's white side faces the sun.", retina: "The moon as the creature sees it (zoomed)", curve: "Lit fraction vs phase",
    curveHint: "y: fraction of the moon's segment that is lit. 0 is new, 1 is full. Not a sine, because in 2D the terminator is a point, not an arc.", strip: "Eight phases of one cycle",
    controls: "Controls", moonDist: "Moon orbit radius", moonSize: "Moon size", sunAngle: "Sun direction", speed: "Orbital speed", track: "Creature always faces the moon", notes: "What is different in 2D",
    notes1: "In 3D the phase is an arc-shaped terminator on a disk, because the Moon is a sphere and half its surface is lit. In 2D the moon is a disk, half its rim is lit, and the creature sees a segment with a single boundary point between bright and dark.",
    notes2: "At 'new moon' the moon sits between sun and planet, which is also where solar eclipses happen. In 2D phases and eclipses are two faces of the same geometry.", footer: "Open source · MIT License · contributions welcome",
    creature: "creature", sunLabel: "sunlight", below: "moon below the horizon", lit: "lit fraction {p}%", names: ["new", "waxing crescent", "first quarter", "waxing gibbous", "full", "waning gibbous", "last quarter", "waning crescent"] }
};
const T = k => I18N[F.lang][k];
const $ = id => document.getElementById(id); const W = $("world"), wc = W.getContext("2d"), RT = $("retina"), rc = RT.getContext("2d"), CV = $("curve"), cc = CV.getContext("2d"), ST = $("strip"), sc = ST.getContext("2d");
const state = { texture: "craters", spin: 12, rot: 0, moonDist: 220, moonSize: 28, sunAngle: 180, speed: 25, track: true, phase: 0.1, obs: Math.PI, center: { x: 400, y: 330 }, R: 70, curve: new Array(360).fill(null) };
const N = 300;
const sunDir = () => { const a = state.sunAngle * Math.PI / 180; return { x: Math.cos(a), y: Math.sin(a) }; };
const moonPos = (ph = state.phase) => { const a = ph * 2 * Math.PI + state.sunAngle * Math.PI / 180; return { x: state.center.x + Math.cos(a) * state.moonDist, y: state.center.y + Math.sin(a) * state.moonDist }; };
const obsPos = () => ({ x: state.center.x + Math.cos(state.obs) * state.R, y: state.center.y + Math.sin(state.obs) * state.R, nx: Math.cos(state.obs), ny: Math.sin(state.obs) });
// sample the moon's apparent segment from the observer; each ray hits the moon rim, lit if rim normal faces the sun
function sampleMoon(o, m, n = N) {
  const S = sunDir(); const d = Math.hypot(m.x - o.x, m.y - o.y); const ang = Math.asin(Math.min(1, state.moonSize / d)); const base = Math.atan2(m.y - o.y, m.x - o.x);
  const out = []; for (let i = 0; i < n; i++) { const a = base - ang + 2 * ang * (i + 0.5) / n; const dx = Math.cos(a), dy = Math.sin(a);
    const t = F.rayCircle(o.x, o.y, dx, dy, m.x, m.y, state.moonSize); if (!t) { out.push(0); continue; }
    const px = o.x + dx * t, py = o.y + dy * t; const nx = (px - m.x) / state.moonSize, ny = (py - m.y) / state.moonSize; const l = nx * S.x + ny * S.y;
    const k = l > 0 ? 0.25 + 0.75 * l : 0.04; const alb = F.albedo(state.texture, (Math.atan2(ny, nx) - state.rot) / (2 * Math.PI)); out.push({ k, rgb: alb.map(v => v * k) }); }
  return { out, visible: (m.x - o.x) * o.nx + (m.y - o.y) * o.ny > 0, litFrac: out.filter(v => v.k > 0.1).length / out.length };
}
function drawWorld(V) {
  const w = W.width, h = W.height; F.grid(wc, w, h); const S = sunDir(), c = state.center, m = moonPos(), o = obsPos(); const perp = { x: -S.y, y: S.x };
  wc.strokeStyle = "rgba(255,210,63,0.35)"; for (let k = -7; k <= 7; k++) { const ox = c.x + S.x * 380 + perp.x * k * 40, oy = c.y + S.y * 380 + perp.y * k * 40; wc.beginPath(); wc.moveTo(ox, oy); wc.lineTo(ox - S.x * 60, oy - S.y * 60); wc.stroke(); }
  wc.fillStyle = "#ffd23f"; wc.font = "11px sans-serif"; wc.fillText(T("sunLabel") + " →", c.x + S.x * 330 - 20, c.y + S.y * 330 - 8);
  wc.strokeStyle = "#1f2a44"; wc.setLineDash([3, 5]); wc.beginPath(); wc.arc(c.x, c.y, state.moonDist, 0, 7); wc.stroke(); wc.setLineDash([]);
  const sa = Math.atan2(S.y, S.x);
  wc.fillStyle = "#1c2438"; wc.beginPath(); wc.arc(c.x, c.y, state.R, 0, 7); wc.fill(); wc.strokeStyle = "#cfd6e6"; wc.lineWidth = 4; wc.beginPath(); wc.arc(c.x, c.y, state.R, sa - Math.PI / 2, sa + Math.PI / 2); wc.stroke();
  wc.fillStyle = "#2a3148"; wc.beginPath(); wc.arc(m.x, m.y, state.moonSize, 0, 7); wc.fill(); wc.lineWidth = 1;
  F.texturedRim(wc, m.x, m.y, state.moonSize, state.texture, state.rot, a => Math.max(0, Math.cos(a) * S.x + Math.sin(a) * S.y), 4);
  // line of sight
  wc.strokeStyle = "rgba(60,255,122,0.35)"; wc.setLineDash([4, 4]); wc.beginPath(); wc.moveTo(o.x, o.y); wc.lineTo(m.x, m.y); wc.stroke(); wc.setLineDash([]);
  wc.fillStyle = "#3cff7a"; wc.beginPath(); wc.arc(o.x, o.y, 6, 0, 7); wc.fill(); wc.fillText(T("creature"), o.x + o.nx * 14, o.y + o.ny * 14);
}
function drawRetina(V) { const w = RT.width, h = RT.height; rc.fillStyle = "#070a14"; rc.fillRect(0, 0, w, h);
  if (!V.visible) { $("status").textContent = T("below"); return; }
  const cw = w / N; V.out.forEach((v, i) => { rc.fillStyle = F.rgb(v.rgb, 1); rc.fillRect(i * cw, 0, Math.ceil(cw), h); });
  const idx = Math.floor((((state.phase % 1) + 1) % 1) * 8 + 0.5) % 8; $("status").textContent = T("names")[idx] + " · " + T("lit").replace("{p}", Math.round(100 * V.litFrac)); }
function drawCurve(V) { const idx = Math.floor((((state.phase % 1) + 1) % 1) * 360); state.curve[idx] = V.litFrac;
  const w = CV.width, h = CV.height; cc.fillStyle = "#070a14"; cc.fillRect(0, 0, w, h); cc.strokeStyle = "#1f2a44"; for (let k = 0; k <= 4; k++) { cc.beginPath(); cc.moveTo(k * w / 4, 0); cc.lineTo(k * w / 4, h); cc.stroke(); }
  cc.strokeStyle = "#e6e9f0"; cc.lineWidth = 1.5; cc.beginPath(); let pen = false; for (let d = 0; d < 360; d++) { const v = state.curve[d]; if (v == null) { pen = false; continue; } const x = d / 360 * w, y = h - 12 - v * (h - 24); pen ? cc.lineTo(x, y) : cc.moveTo(x, y); pen = true; } cc.stroke();
  cc.strokeStyle = "#3cff7a"; cc.beginPath(); cc.moveTo(idx / 360 * w, 0); cc.lineTo(idx / 360 * w, h); cc.stroke(); }
function drawStrip() { const w = ST.width, h = ST.height; sc.fillStyle = "#070a14"; sc.fillRect(0, 0, w, h); const o = { x: state.center.x, y: state.center.y, nx: 0, ny: 0 };
  for (let k = 0; k < 8; k++) { const m = moonPos(k / 8); const V = sampleMoon(o, m, 60); const x0 = k * w / 8 + 6, bw = w / 8 - 12;
    V.out.forEach((v, i) => { sc.fillStyle = F.rgb(v.rgb, 1); sc.fillRect(x0 + i * bw / 60, 8, Math.ceil(bw / 60), 24); });
    sc.fillStyle = "#8a93a8"; sc.font = "10px sans-serif"; sc.fillText(T("names")[k], x0, h - 8); } }
F.fillTextureSelect($("texture")); $("texture").value = state.texture; $("texture").addEventListener("input", e => state.texture = e.target.value);
F.setupLang(I18N); F.bindRanges(state, ["moonDist", "moonSize", "sunAngle", "speed", "spin"], () => state.curve = new Array(360).fill(null));
$("track").addEventListener("change", e => state.track = e.target.checked);
F.dragOn(W, p => { const o = obsPos(); return Math.hypot(p.x - o.x, p.y - o.y) < 18; }, p => { state.obs = Math.atan2(p.y - state.center.y, p.x - state.center.x); });
F.loop(dt => { state.phase += dt * state.speed / 100 * 0.08; state.rot += dt * state.spin * Math.PI / 180; if (state.track) { const m = moonPos(); state.obs = Math.atan2(m.y - state.center.y, m.x - state.center.x); }
  const V = sampleMoon(obsPos(), moonPos()); drawWorld(V); drawRetina(V); drawCurve(V); drawStrip(); });
})();
