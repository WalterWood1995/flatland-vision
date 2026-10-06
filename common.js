/* Shared helpers for Flatland pages. MIT License. */
window.FL = (() => {
  const NAV = [["index.html", "navVision"], ["eclipse.html", "navEclipse"], ["phases.html", "navPhases"], ["retrograde.html", "navRetro"], ["binary.html", "navBinary"]];
  const NAVTEXT = { zh: { navVision: "看星体", navEclipse: "日食与月食", navPhases: "月相", navRetro: "行星逆行", navBinary: "双星" },
                    en: { navVision: "Seeing a planet", navEclipse: "Eclipses", navPhases: "Moon phases", navRetro: "Retrograde", navBinary: "Binary stars" } };
  let lang = "zh";
  function buildNav() { const nav = document.querySelector("nav.nav"); if (!nav) return; const here = location.pathname.split("/").pop() || "index.html";
    nav.innerHTML = NAV.map(([h, k]) => `<a href="${h}" class="${h === here ? "active" : ""}" data-nav="${k}"></a>`).join(""); }
  function applyLang(I18N) { lang = window.FL.lang; document.querySelectorAll("[data-i18n]").forEach(el => { const k = el.dataset.i18n; if (I18N[lang][k]) el.textContent = I18N[lang][k]; });
    document.querySelectorAll("[data-nav]").forEach(el => el.textContent = NAVTEXT[lang][el.dataset.nav]);
    document.querySelectorAll("[data-tex]").forEach(el => el.textContent = TEXTEXT[lang][el.dataset.tex]);
    document.querySelectorAll("[data-textext]").forEach(el => el.textContent = TEXTEXT[lang][el.dataset.textext]); document.documentElement.lang = lang; }
  function rayCircle(ox, oy, dx, dy, cx, cy, r) { const fx = ox - cx, fy = oy - cy; const b = fx * dx + fy * dy; const c = fx * fx + fy * fy - r * r; const d = b * b - c; if (d < 0) return null; const t = -b - Math.sqrt(d); return t > 1e-6 ? t : null; }
  function grid(ctx, w, h) { ctx.fillStyle = "#070a14"; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = "#141c30"; for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); } for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); } }
  function wrapAngle(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
  function setupLang(I18N) { buildNav(); window.FL.lang = "zh"; applyLang(I18N);
    document.getElementById("btn-zh").onclick = () => { window.FL.lang = "zh"; applyLang(I18N); }; document.getElementById("btn-en").onclick = () => { window.FL.lang = "en"; applyLang(I18N); }; }
  function bindRanges(state, ids, after) { ids.forEach(id => { const el = document.getElementById(id); el.addEventListener("input", () => { state[id] = +el.value; if (after) after(id); }); }); }
  function dragOn(canvas, pick, move) { let on = false; const pos = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height }; };
    canvas.addEventListener("mousedown", e => { on = pick(pos(e)); }); window.addEventListener("mousemove", e => { if (on) move(pos(e)); }); window.addEventListener("mouseup", () => on = false); }
  // Surface texture along a rim: u in [0,1), returns [r,g,b] albedo
  function tnoise(u, seed) { let v = 0; for (let k = 1; k <= 4; k++) v += Math.sin(2 * Math.PI * (k * 2 + 1) * u + seed * k * 1.7) / k; return 0.5 + 0.5 * Math.max(-1, Math.min(1, v / 1.6)); }
  function albedo(kind, u) { u = ((u % 1) + 1) % 1;
    switch (kind) {
      case "stripes": return (Math.floor(u * 14) % 2) ? [1, 0.95, 0.85] : [0.4, 0.45, 0.6];
      case "bands": { const n = tnoise(u, 3); return n > 0.55 ? [0.95, 0.9, 0.8] : (n > 0.4 ? [0.7, 0.6, 0.5] : [0.35, 0.4, 0.55]); }
      case "spots": { const n = tnoise(u * 3, 11); return n > 0.68 ? [0.25, 0.25, 0.3] : [0.9, 0.85, 0.75]; }
      case "continents": { const n = tnoise(u, 5); return n > 0.52 ? [0.78, 0.66, 0.42] : [0.25, 0.42, 0.8]; }
      case "craters": { const n = tnoise(u * 4, 17); return n > 0.72 ? [0.45, 0.45, 0.48] : [0.82, 0.8, 0.76]; }
      case "noise": { const n = 0.35 + 0.65 * tnoise(u * 5, 23); return [n, n, n]; }
      default: return [1, 1, 1]; } }
  const TEXTURES = ["craters", "continents", "stripes", "bands", "spots", "noise", "none"];
  const TEXTEXT = { zh: { craters: "环形山", continents: "大陆与海洋", stripes: "条纹", bands: "宽窄带", spots: "斑点", noise: "杂色", none: "无", texture: "卫星纹路", spin: "卫星自转" },
                    en: { craters: "Craters", continents: "Continents", stripes: "Stripes", bands: "Bands", spots: "Spots", noise: "Mottled", none: "None", texture: "Moon texture", spin: "Moon spin" } };
  function fillTextureSelect(sel) { sel.innerHTML = TEXTURES.map(t => `<option value="${t}" data-tex="${t}"></option>`).join(""); }
  function rgb(a, k) { return `rgb(${Math.round(255 * Math.min(1, a[0] * k))},${Math.round(255 * Math.min(1, a[1] * k))},${Math.round(255 * Math.min(1, a[2] * k))})`; }
  // draw a circular body's rim with texture; lit(angle) returns 0..1 light factor for rim angle
  function texturedRim(ctx, cx, cy, r, kind, rot, lit, width) { const n = Math.max(24, Math.round(r * 1.2)); ctx.lineWidth = width;
    for (let i = 0; i < n; i++) { const a0 = i * 2 * Math.PI / n, a1 = (i + 1) * 2 * Math.PI / n; const am = (a0 + a1) / 2; const k = 0.25 + 0.75 * lit(am);
      ctx.strokeStyle = rgb(albedo(kind, (am - rot) / (2 * Math.PI)), k); ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1 + 0.01); ctx.stroke(); } ctx.lineWidth = 1; }
  function loop(step) { let last = performance.now(); const f = now => { const dt = Math.min((now - last) / 1000, 0.05); last = now; step(dt); requestAnimationFrame(f); }; requestAnimationFrame(f); }
  return { lang, NAVTEXT, applyLang, setupLang, rayCircle, grid, wrapAngle, bindRanges, dragOn, loop, albedo, fillTextureSelect, rgb, texturedRim };
})();
