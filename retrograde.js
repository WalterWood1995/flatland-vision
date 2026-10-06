/* Flatland retrograde motion. MIT License. */
(() => {
"use strict"; const F = window.FL;
const I18N = {
  zh: { title: "二维世界的行星逆行", subtitle: "两颗行星绕着太阳转，里面那颗转得快。站在里面那颗上的生物，看外面那颗在背景恒星之间移动。追上并超过的时候，外面那颗在天上倒退。",
    world: "上帝视角", worldHint: "绿色是生物所在的行星，橙色是被观察的行星。虚线是视线，外圈的小点是远处的背景恒星。", retina: "生物眼中的天空（展开成一圈）", curve: "行星在天上的位置随时间的变化",
    curveHint: "纵轴：行星相对背景恒星的角位置。曲线往回走的那一段就是逆行。红色标出逆行期。", trail: "在天上画出的轨迹", trailHint: "把最近一段时间行星在天上的位置连起来。三维里是一个环套，二维里只能来回折一下。",
    controls: "控制", r1: "内行星轨道半径", r2: "外行星轨道半径", speed: "时间流速", swap: "改为站在外行星上观察内行星", clear: "清空曲线", notes: "二维世界里的不同",
    notes1: "两颗行星的周期按开普勒第三定律设定：周期与轨道半径的 1.5 次方成正比。这一点在二维膜上仍然成立，因为它只依赖圆轨道上的力平衡。",
    notes2: "三维里逆行时行星在天上画出一个小环，因为两条轨道面有夹角。二维里所有轨道在同一张膜上，逆行只是在一条线上倒退一段，更干净，也更容易看出它只是视角效应。",
    footer: "开源项目 · MIT 许可 · 欢迎加入创作", home: "生物在这里", target: "被观察的行星", sun: "太阳", prograde: "顺行：行星在天上向东走", retro: "逆行：行星在天上倒退", stars: "背景恒星" },
  en: { title: "Retrograde motion in Flatland", subtitle: "Two planets orbit the sun; the inner one is faster. A creature on the inner planet watches the outer one move among the background stars. When it overtakes, the outer planet appears to move backwards.",
    world: "God's eye view", worldHint: "Green: the creature's planet. Orange: the observed planet. Dashed: line of sight. Dots on the rim: distant background stars.", retina: "The creature's sky, unrolled", curve: "Sky position of the planet over time",
    curveHint: "y: angular position against the background stars. The parts where the curve turns back are retrograde, marked in red.", trail: "Path traced on the sky", trailHint: "Recent sky positions joined up. In 3D this makes a loop; in 2D it can only fold back along a line.",
    controls: "Controls", r1: "Inner orbit radius", r2: "Outer orbit radius", speed: "Time rate", swap: "Observe the inner planet from the outer one instead", clear: "Clear curve", notes: "What is different in 2D",
    notes1: "Periods follow Kepler's third law: period scales with radius to the 1.5 power. This still holds on a 2D membrane because it only needs force balance on a circular orbit.",
    notes2: "In 3D the retrograde planet draws a small loop because the two orbital planes are tilted. In 2D all orbits share one membrane, so the planet just slides back along a line, which makes it obvious that retrograde motion is a viewpoint effect.",
    footer: "Open source · MIT License · contributions welcome", home: "creature here", target: "observed planet", sun: "sun", prograde: "prograde: moving east on the sky", retro: "retrograde: moving backwards", stars: "background stars" }
};
const T = k => I18N[F.lang][k];
const $ = id => document.getElementById(id); const W = $("world"), wc = W.getContext("2d"), SK = $("sky"), skc = SK.getContext("2d"), CV = $("curve"), cc = CV.getContext("2d"), TR = $("trail"), trc = TR.getContext("2d");
const state = { r1: 110, r2: 200, speed: 30, swap: false, t: 0, center: { x: 400, y: 330 }, hist: [], lastAng: null };
const stars = []; for (let i = 0; i < 48; i++) stars.push(i * 2 * Math.PI / 48 + (Math.sin(i * 12.9898) * 0.5) * 0.08);
const pos = (r, t) => { const a = t * Math.pow(100 / r, 1.5); return { x: state.center.x + Math.cos(a) * r, y: state.center.y + Math.sin(a) * r, a }; };
function current() { const p1 = pos(state.r1, state.t), p2 = pos(state.r2, state.t); const home = state.swap ? p2 : p1, tgt = state.swap ? p1 : p2;
  const ang = Math.atan2(tgt.y - home.y, tgt.x - home.x); return { home, tgt, ang }; }
function drawWorld(C) { const w = W.width, h = W.height; F.grid(wc, w, h); const c = state.center;
  wc.fillStyle = "#8a93a8"; stars.forEach(a => { wc.beginPath(); wc.arc(c.x + Math.cos(a) * 305, c.y + Math.sin(a) * 305, 1.5, 0, 7); wc.fill(); }); wc.font = "11px sans-serif"; wc.fillText(T("stars"), c.x + 230, c.y - 300);
  wc.strokeStyle = "#1f2a44"; wc.setLineDash([3, 5]); [state.r1, state.r2].forEach(r => { wc.beginPath(); wc.arc(c.x, c.y, r, 0, 7); wc.stroke(); }); wc.setLineDash([]);
  wc.fillStyle = "#ffd23f"; wc.beginPath(); wc.arc(c.x, c.y, 14, 0, 7); wc.fill(); wc.fillText(T("sun"), c.x + 18, c.y + 4);
  const { home, tgt, ang } = C; wc.strokeStyle = "rgba(60,255,122,0.5)"; wc.setLineDash([4, 4]); wc.beginPath(); wc.moveTo(home.x, home.y); wc.lineTo(home.x + Math.cos(ang) * 700, home.y + Math.sin(ang) * 700); wc.stroke(); wc.setLineDash([]);
  wc.fillStyle = "#ff9a1f"; wc.beginPath(); wc.arc(tgt.x, tgt.y, 8, 0, 7); wc.fill(); wc.fillText(T("target"), tgt.x + 12, tgt.y + 4);
  wc.fillStyle = "#3cff7a"; wc.beginPath(); wc.arc(home.x, home.y, 8, 0, 7); wc.fill(); wc.fillText(T("home"), home.x + 12, home.y + 4); }
function drawSky(C) { const w = SK.width, h = SK.height; skc.fillStyle = "#070a14"; skc.fillRect(0, 0, w, h);
  // unrolled sky: angle -pi..pi left to right, stars fixed, planet at its angle
  skc.fillStyle = "#8a93a8"; stars.forEach(a => { const x = (F.wrapAngle(a) + Math.PI) / (2 * Math.PI) * w; skc.fillRect(x, h / 2 - 1, 2, 2); });
  const x = (F.wrapAngle(C.ang) + Math.PI) / (2 * Math.PI) * w; skc.fillStyle = "#ff9a1f"; skc.beginPath(); skc.arc(x, h / 2, 5, 0, 7); skc.fill(); }
function drawCurve(C) { const w = CV.width, h = CV.height; cc.fillStyle = "#070a14"; cc.fillRect(0, 0, w, h); const H = state.hist; if (H.length < 2) return;
  const t0 = H[0].t, t1 = H[H.length - 1].t; const span = Math.max(t1 - t0, 1e-6);
  for (let i = 1; i < H.length; i++) { const a = H[i - 1], b = H[i]; const dA = F.wrapAngle(b.ang - a.ang); if (Math.abs(dA) > 1) continue; cc.strokeStyle = dA < 0 ? "#ff3b1f" : "#e6e9f0"; cc.lineWidth = 1.5; cc.beginPath();
    cc.moveTo((a.t - t0) / span * w, h / 2 - a.u / Math.PI * (h / 2 - 10)); cc.lineTo((b.t - t0) / span * w, h / 2 - b.u / Math.PI * (h / 2 - 10)); cc.stroke(); } }
function drawTrail() { const w = TR.width, h = TR.height; trc.fillStyle = "#070a14"; trc.fillRect(0, 0, w, h); const H = state.hist.slice(-400); if (H.length < 2) return;
  trc.fillStyle = "#8a93a8"; stars.forEach(a => { trc.fillRect((F.wrapAngle(a) + Math.PI) / (2 * Math.PI) * w, h / 2 - 1, 2, 2); });
  H.forEach((p, i) => { const x = (F.wrapAngle(p.ang) + Math.PI) / (2 * Math.PI) * w; const y = 10 + (i / H.length) * (h - 20); trc.fillStyle = p.retro ? "#ff3b1f" : "#ff9a1f"; trc.fillRect(x - 1, y, 2, 2); }); }
F.setupLang(I18N); F.bindRanges(state, ["r1", "r2", "speed"], () => { state.hist = []; state.lastAng = null; });
$("swap").addEventListener("change", e => { state.swap = e.target.checked; state.hist = []; state.lastAng = null; }); $("clear").onclick = () => { state.hist = []; };
let unwrapped = 0, lastA = null;
F.loop(dt => { state.t += dt * state.speed / 100 * 0.6; const C = current();
  if (lastA !== null) unwrapped += F.wrapAngle(C.ang - lastA); lastA = C.ang;
  const retro = state.hist.length && F.wrapAngle(C.ang - state.hist[state.hist.length - 1].ang) < 0;
  state.hist.push({ t: state.t, ang: C.ang, u: F.wrapAngle(unwrapped), retro }); if (state.hist.length > 1500) state.hist.shift();
  $("status").textContent = retro ? T("retro") : T("prograde"); $("status").style.color = retro ? "#ff6b6b" : "#ffd23f";
  drawWorld(C); drawSky(C); drawCurve(C); drawTrail(); });
})();
