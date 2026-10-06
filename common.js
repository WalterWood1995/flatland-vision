/* Shared helpers for Flatland pages. MIT License. */
window.FL = (() => {
  const NAV = [["index.html", "navVision"], ["eclipse.html", "navEclipse"], ["phases.html", "navPhases"], ["retrograde.html", "navRetro"], ["binary.html", "navBinary"]];
  const NAVTEXT = { zh: { navVision: "看星体", navEclipse: "日食与月食", navPhases: "月相", navRetro: "行星逆行", navBinary: "双星" },
                    en: { navVision: "Seeing a planet", navEclipse: "Eclipses", navPhases: "Moon phases", navRetro: "Retrograde", navBinary: "Binary stars" } };
  let lang = "zh";
  function buildNav() { const nav = document.querySelector("nav.nav"); if (!nav) return; const here = location.pathname.split("/").pop() || "index.html";
    nav.innerHTML = NAV.map(([h, k]) => `<a href="${h}" class="${h === here ? "active" : ""}" data-nav="${k}"></a>`).join(""); }
  function applyLang(I18N) { lang = window.FL.lang; document.querySelectorAll("[data-i18n]").forEach(el => { const k = el.dataset.i18n; if (I18N[lang][k]) el.textContent = I18N[lang][k]; });
    document.querySelectorAll("[data-nav]").forEach(el => el.textContent = NAVTEXT[lang][el.dataset.nav]); document.documentElement.lang = lang; }
  function rayCircle(ox, oy, dx, dy, cx, cy, r) { const fx = ox - cx, fy = oy - cy; const b = fx * dx + fy * dy; const c = fx * fx + fy * fy - r * r; const d = b * b - c; if (d < 0) return null; const t = -b - Math.sqrt(d); return t > 1e-6 ? t : null; }
  function grid(ctx, w, h) { ctx.fillStyle = "#070a14"; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = "#141c30"; for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); } for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); } }
  function wrapAngle(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
  function setupLang(I18N) { buildNav(); window.FL.lang = "zh"; applyLang(I18N);
    document.getElementById("btn-zh").onclick = () => { window.FL.lang = "zh"; applyLang(I18N); }; document.getElementById("btn-en").onclick = () => { window.FL.lang = "en"; applyLang(I18N); }; }
  function bindRanges(state, ids, after) { ids.forEach(id => { const el = document.getElementById(id); el.addEventListener("input", () => { state[id] = +el.value; if (after) after(id); }); }); }
  function dragOn(canvas, pick, move) { let on = false; const pos = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height }; };
    canvas.addEventListener("mousedown", e => { on = pick(pos(e)); }); window.addEventListener("mousemove", e => { if (on) move(pos(e)); }); window.addEventListener("mouseup", () => on = false); }
  function loop(step) { let last = performance.now(); const f = now => { const dt = Math.min((now - last) / 1000, 0.05); last = now; step(dt); requestAnimationFrame(f); }; requestAnimationFrame(f); }
  return { lang, NAVTEXT, applyLang, setupLang, rayCircle, grid, wrapAngle, bindRanges, dragOn, loop };
})();
