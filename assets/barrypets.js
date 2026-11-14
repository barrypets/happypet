/*
 * barrypets: el botón de reservar para la web de un negocio (BARRY-562).
 *
 *   <div class="barrypets-reservar" data-negocio="ID" data-local="ID"
 *        data-formato="boton|servicios" data-color="#FF7A1A"
 *        data-servicios="ID,ID"></div>   (optional: only these, in the list)
 *   <script src="https://barrypets.es/widget.js" async></script>
 *
 * Optional, all of them (BARRY-755, the panel writes them; absent = the look before):
 *   data-texto="Pedir cita" (30 at most)   data-forma="redondeado|cuadrado"
 *   data-tamano="grande"   data-alinear="centro|ancho"   data-color-texto="#RRGGBB"
 *   data-fuente="barrypets"   data-vista="tarjetas|compacta"   data-columnas="2"
 *   data-mostrar="foto,precio,duracion,descripcion"   data-fondo="claro|oscuro"
 *   data-esquinas="recto|redondo"   data-color-reserva="#RRGGBB" (the booking window)
 * Each is checked against its own list: nothing typed ever becomes a style.
 *
 * The booking opens over the shop's page in a frame of /reservar/{id}/embed,
 * the one route allowed in a frame (next.config.ts). Without barrypets Pro
 * the button goes to the shop's barrypets page instead. Everything from the
 * server goes in as text (textContent), never as HTML: this runs on their site.
 */
(function () {
  var me = document.currentScript;
  // A copy kept on the shop's own site says where barrypets is (data-origin).
  var origin = (me && me.getAttribute("data-origin")) || (me && me.src ? new URL(me.src).origin : "https://barrypets.es");
  var Z = 2147483000;
  // Only a plain origin goes into the style sheet.
  var fontAt = (/^https?:\/\/[\w.-]+(:\d+)?$/.test(origin) ? origin : "https://barrypets.es") + "/fonts/wix-madefor-text-latin.woff2";
  // English (BARRY-729): the host page in English and English on for the shop
  // (booking-link answers english: true). Set once the shop's answer is in.
  var EN = false;
  function T(es, en) { return EN ? en : es; }

  function hex(c) { return /^#[0-9a-f]{6}$/i.test(c || ""); }
  function colorOf(c) { return hex(c) ? c : "#FF7A1A"; }
  // White or dark letters, whichever reads on the shop's colour.
  function inkOn(hex) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return 0.299 * r + 0.587 * g + 0.114 * b > 170 ? "#1c1917" : "#ffffff";
  }
  function el(tag, style, text) {
    var e = document.createElement(tag);
    if (style) e.style.cssText = style;
    if (text != null) e.textContent = text;
    return e;
  }
  function euros(n) { return EN ? new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n) : (Math.round(n * 100) / 100).toLocaleString("es-ES") + " €"; }
  // "25 €", or "desde 20 €" when it depends on the pet. Same rule as the app
  // (lib/catalogPricing.ts): the floor is the cheapest size or the flat price;
  // coat and age only ever add on top, so they make it "desde" but never set it.
  function priceText(s) {
    function nums(o) { return Object.keys(o || {}).map(function (k) { return o[k]; }).filter(function (n) { return typeof n === "number"; }); }
    var sizes = nums(s.priceBySize);
    var extra = nums(s.priceByCoatType).concat(nums(s.priceByLifeStage));
    var all = (typeof s.price === "number" ? [s.price] : []).concat(sizes);
    if (!all.length) return "";
    var min = Math.min.apply(null, all);
    var varies = sizes.length > 0 || extra.some(function (n) { return n > 0; });
    return min > 0 || varies ? (varies ? T("desde ", "from ") : "") + euros(min) : "";
  }

  // "45 min", "1 h 30 min"; the shortest when it depends on the pet.
  function durationText(s) {
    if (s.bookingType === "stay") return ""; // nights, not minutes
    function nums(o) { return Object.keys(o || {}).map(function (k) { return o[k]; }).filter(function (n) { return typeof n === "number" && n > 0; }); }
    var all = (typeof s.durationMinutes === "number" && s.durationMinutes > 0 ? [s.durationMinutes] : []).concat(nums(s.durationBySize));
    if (!all.length) return "";
    var m = Math.min.apply(null, all), h = Math.floor(m / 60), r = m % 60;
    return (all.length > 1 ? T("desde ", "from ") : "") + (h ? h + " h" + (r ? " " + r + " min" : "") : r + " min");
  }

  // Press feedback for our buttons: inline styles cannot hold :active, one small sheet does.
  function css() {
    if (document.getElementById("barrypets-css")) return;
    var st = el("style");
    st.id = "barrypets-css";
    st.textContent = ".barrypets-btn{transition:transform .16s cubic-bezier(.23,1,.32,1)}.barrypets-btn:active{transform:scale(.97)}" +
      "@media (prefers-reduced-motion:reduce){.barrypets-btn:active{transform:none;filter:brightness(.94)}}" +
      // The barrypets letter (data-fuente), self-hosted: never from Google.
      "@font-face{font-family:'barrypets sans';font-style:normal;font-weight:400 800;font-display:swap;src:url(" + fontAt + ") format('woff2')}";
    document.head.appendChild(st);
  }
  var calm = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  // Enter with a strong ease-out, leave faster than it came. A phone gets a sheet from the bottom.
  function move(node, frames, ms, easing) {
    return node.animate ? node.animate(frames, { duration: ms, easing: easing, fill: "forwards" }) : null;
  }

  // Booked with a barrypets account (lib/admission.ts needsAccount), and the
  // requirements as the shop's page lists them (admissionLabels). Same lists as there.
  // Only when the shop chose «Solo con cuenta» (BARRY-747): the rest is asked while booking.
  function needsAccount(ad) {
    return !!(ad && ad.accountOnly);
  }
  function requirements(ad, services) {
    ad = ad || {};
    // Any one of them will do (BARRY-746, lib/admission.ts trialIds).
    var ids = ad.trialItemIds && ad.trialItemIds.length ? ad.trialItemIds : ad.trialItemId ? [ad.trialItemId] : [];
    var trials = services.filter(function (x) { return ids.indexOf(x.id) >= 0; }).map(function (x) { return x.name; });
    return [ad.neutered && T("Castrado", "Neutered"), ad.emergencyContact && T("Contacto de emergencia", "Emergency contact"), ad.insurance && T("Seguro de responsabilidad civil", "Third-party liability insurance"),
      ad.noPpp && T("Sin razas PPP", "No restricted breeds (PPP)"), ids.length && (trials.length ? T("Antes: ", "First: ") + trials.join(T(" o ", " or ")) : T("Prueba de adaptación previa", "Adaptation trial first")),
      ad.approval && T("Cada reserva la confirma el negocio", "Each booking is confirmed by the business")].filter(Boolean);
  }

  // The service as on the shop's barrypets page (9 nov 2026): photo, price,
  // requirements and the whole description, then Reservar.
  function detail(s, o, services, book) {
    var d = el("div", "height:100%;overflow-y:auto;display:flex;flex-direction:column;font-family:system-ui,-apple-system,sans-serif;color:#1c1917;");
    if (/^https:\/\//.test(s.photo || "")) {
      var img = el("img", "display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:rgba(0,0,0,.05);flex:none;");
      img.src = s.photo;
      img.alt = s.name;
      img.onerror = function () { img.remove(); };
      d.appendChild(img);
    }
    var pad = el("div", "padding:20px 20px 8px;flex:1;");
    pad.appendChild(el("h2", "margin:0 44px 0 0;font-size:22px;line-height:1.25;font-weight:700;", s.name));
    var p = priceText(s);
    if (p) pad.appendChild(el("div", "margin-top:6px;font-size:17px;font-weight:700;", p));
    var req = requirements(s.admission, services);
    if (req.length) pad.appendChild(el("div", "margin-top:8px;font-size:13px;line-height:1.45;opacity:.65;", T("Requisitos: ", "Requirements: ") + req.join(" · ") + "."));
    if (s.description) pad.appendChild(el("p", "margin:14px 0 0;font-size:15px;line-height:1.6;white-space:pre-line;opacity:.85;", s.description));
    if (needsAccount(s.admission)) pad.appendChild(el("p", "margin:14px 0 0;font-size:14px;opacity:.75;", T("Se reserva con una cuenta de barrypets.", "Booked with a barrypets account.")));
    d.appendChild(pad);
    // Always in reach, however long the description.
    var foot = el("div", "position:sticky;bottom:0;padding:12px 20px calc(12px + env(safe-area-inset-bottom));background:#fafaf9;border-top:1px solid rgba(0,0,0,.08);");
    var b = button(T("Reservar", "Book"), o);
    b.style.width = "100%";
    b.onclick = book;
    foot.appendChild(b);
    d.appendChild(foot);
    return d;
  }

  // The booking over the shop's page; with a service, that service first, and
  // its Reservar turns the same window into the booking.
  function open(src, s, o, services) {
    var back = el("div", "position:fixed;inset:0;z-index:" + Z + ";background:rgba(28,25,23,.55);display:flex;align-items:center;justify-content:center;");
    var phone = window.innerWidth < 600;
    var box = el("div", "position:relative;background:#fafaf9;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3);" +
      (phone ? "width:100%;height:100%;" : "width:480px;max-width:calc(100% - 32px);height:min(760px,calc(100% - 48px));border-radius:16px;"));
    var close = el("button", "position:absolute;top:10px;right:10px;width:40px;height:40px;border-radius:50%;border:0;background:#fff;color:#1c1917;font:600 22px/40px system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2);", "×");
    close.type = "button";
    close.className = "barrypets-btn";
    close.setAttribute("aria-label", T("Cerrar", "Close"));
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.appendChild(el("div"));
    box.appendChild(close);
    function book() {
      var frame = el("iframe", "border:0;width:100%;height:100%;display:block;");
      frame.src = src;
      frame.title = T("Reservar cita con barrypets", "Book an appointment with barrypets");
      box.replaceChild(frame, box.firstChild);
      box.setAttribute("aria-label", T("Reservar cita", "Book an appointment"));
      close.focus();
    }
    if (s) {
      box.replaceChild(detail(s, o, services, book), box.firstChild);
      box.setAttribute("aria-label", s.name);
    } else book();
    back.appendChild(box);
    var before = document.activeElement, overflow = document.documentElement.style.overflow;
    var leaving = false;
    function gone() {
      back.remove();
      document.documentElement.style.overflow = overflow;
      if (before && before.focus) before.focus();
    }
    function done() {
      if (leaving) return;
      leaving = true;
      document.removeEventListener("keydown", onKey);
      var fade = move(back, [{ opacity: 1 }, { opacity: 0 }], 160, "ease-out");
      if (!calm) move(box, phone ? [{ transform: "none" }, { transform: "translateY(100%)" }] : [{ transform: "none" }, { transform: "scale(.97)" }], 160, "ease-out");
      if (fade) fade.onfinish = gone; else gone();
    }
    function onKey(e) { if (e.key === "Escape") done(); }
    close.onclick = done;
    back.onclick = function (e) { if (e.target === back) done(); };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    document.body.appendChild(back);
    move(back, [{ opacity: 0 }, { opacity: 1 }], 200, "ease-out");
    if (!calm) move(box, phone ? [{ transform: "translateY(100%)" }, { transform: "none" }] : [{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }],
      phone ? 320 : 220, phone ? "cubic-bezier(.32,.72,0,1)" : "cubic-bezier(.23,1,.32,1)");
    close.focus();
  }

  // The look the shop chose, each from its own list; absent, the look before.
  function options(host) {
    function pick(name, list) { var v = host.getAttribute("data-" + name); return list.indexOf(v) >= 0 ? v : ""; }
    var color = colorOf(host.getAttribute("data-color"));
    var shown = host.getAttribute("data-mostrar");
    return {
      color: color,
      ink: hex(host.getAttribute("data-color-texto")) ? host.getAttribute("data-color-texto") : inkOn(color),
      label: (host.getAttribute("data-texto") || "").replace(/[\x00-\x1f\x7f\s]+/g, " ").trim().slice(0, 30),
      shape: pick("forma", ["redondeado", "cuadrado"]),
      big: pick("tamano", ["grande"]) === "grande",
      align: pick("alinear", ["centro", "ancho"]),
      font: pick("fuente", ["barrypets"]) ? "'barrypets sans',system-ui,-apple-system,sans-serif" : "inherit",
      view: pick("vista", ["tarjetas", "compacta"]) || "lista",
      two: pick("columnas", ["2"]) === "2",
      show: (shown == null ? "foto,precio,descripcion" : shown).split(","),
      bg: pick("fondo", ["claro", "oscuro"]),
      radius: { recto: 0, redondo: 20, "": 12 }[pick("esquinas", ["recto", "redondo"])],
      window: hex(host.getAttribute("data-color-reserva")) ? host.getAttribute("data-color-reserva").slice(1) : "",
    };
  }
  function shows(o, field) { return o.show.indexOf(field) >= 0; }

  function buttonStyle(o, small) {
    var size = o.big ? (small ? "15px;padding:10px 20px" : "18px;padding:16px 32px") : (small ? "14px;padding:8px 16px" : "16px;padding:12px 24px");
    var round = o.shape === "cuadrado" ? "0" : o.shape === "redondeado" ? (o.big ? "12px" : "10px") : "999px";
    return "display:inline-block;box-sizing:border-box;border:0;text-decoration:none;text-align:center;border-radius:" + round + ";cursor:pointer;font-family:inherit;font-weight:700;line-height:1.2;" +
      "font-size:" + size + ";background:" + o.color + ";color:" + o.ink + ";";
  }
  function button(label, o, small) {
    var b = el("button", buttonStyle(o, small), label);
    b.type = "button";
    b.className = "barrypets-btn";
    return b;
  }
  // The one big button, where the shop placed it.
  function main(node, o, root) {
    if (o.align === "ancho") { node.style.display = "block"; node.style.width = "100%"; }
    root.style.textAlign = o.align === "centro" ? "center" : "";
    root.appendChild(node);
  }

  function draw(host) {
    if (host.getAttribute("data-barrypets-listo")) return;
    host.setAttribute("data-barrypets-listo", "1");
    css();
    var id = host.getAttribute("data-negocio") || "";
    var sede = host.getAttribute("data-local") || "";
    if (!/^[\w-]{1,128}$/.test(id) || (sede && !/^[\w-]{1,128}$/.test(sede))) return;
    var list = host.getAttribute("data-formato") === "servicios";
    var o = options(host);
    var dark = o.bg === "oscuro";
    var line = dark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.1)";
    var root = el("div", "font-family:" + o.font + ";" + (o.bg ? "padding:16px;border-radius:" + o.radius + "px;" +
      (dark ? "background:#1c1917;color:#fafaf9;" : "background:#ffffff;color:#1c1917;border:1px solid rgba(0,0,0,.08);") : ""));
    host.appendChild(root);
    var q = sede ? "sede=" + encodeURIComponent(sede) : "";
    var bookAt = function (item) {
      var qs = [q, item ? "item=" + encodeURIComponent(item) : "", EN ? "lang=en" : "", o.window ? "color=" + o.window : ""].filter(Boolean).join("&");
      return origin + "/reservar/" + encodeURIComponent(id) + "/embed" + (qs ? "?" + qs : "");
    };
    fetch(origin + "/api/booking-link?b=" + encodeURIComponent(id) + (q ? "&" + q : ""))
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (page) {
        EN = !!(page && page.english) && /^en/i.test(document.documentElement.lang || "");
        var label = o.label || T("Reservar cita", "Book an appointment");
        // No online booking (no Pro, or switched off): the shop's page, in a new tab.
        if (page && page.open === false) {
          var a = el("a", buttonStyle(o), label);
          a.href = origin + "/negocios/" + encodeURIComponent(id) + (q ? "?" + q : "");
          a.target = "_blank";
          a.className = "barrypets-btn";
          a.rel = "noopener";
          main(a, o, root);
          return;
        }
        var ids = {};
        if (page) page.sedes.forEach(function (s) { s.serviceIds.forEach(function (x) { ids[x] = true; }); });
        // The shop may pick some services one by one (data-servicios).
        var only = (host.getAttribute("data-servicios") || "").split(",").filter(Boolean);
        // None of them offered any more: all of them, as with none picked.
        var offered = page ? page.services.filter(function (s) { return ids[s.id]; }) : [];
        var picked = offered.filter(function (s) { return only.indexOf(s.id) >= 0; });
        var services = picked.length ? picked : offered;
        // A hidden business (a demo) answers nothing here: the button, and
        // the booking decides who may see it.
        if (!list || !services.length) {
          var b = button(label, o);
          b.onclick = function () { open(bookAt()); };
          main(b, o, root);
          return;
        }
        var cards = o.view === "tarjetas", compact = o.view === "compacta";
        // Two columns where they fit, one on a phone.
        var ul = el("ul", "list-style:none;margin:0;padding:0;font-family:inherit;display:grid;gap:" + (cards ? "16px" : "0 24px") + ";" +
          "grid-template-columns:" + (o.two ? "repeat(auto-fill,minmax(max(240px,calc(50% - 12px)),1fr))" : "minmax(0,1fr)") + ";");
        services.forEach(function (s) {
          // Photo, name, two lines of description and price; a tap shows the whole service (9 nov 2026).
          var li = el("li", cards ? "display:flex;flex-direction:column;overflow:hidden;border-radius:" + o.radius + "px;border:1px solid " + line + ";" + (dark ? "background:rgba(255,255,255,.06);" : "background:#ffffff;color:#1c1917;")
            : "display:flex;align-items:" + (compact ? "center" : "flex-start") + ";gap:" + (compact ? "12px" : "14px") + ";padding:" + (compact ? "12px 0" : "16px 0") + ";border-bottom:1px solid " + line + ";");
          if (shows(o, "foto") && /^https:\/\//.test(s.photo || "")) {
            var side = compact ? 44 : 64;
            var img = el("img", cards ? "display:block;width:100%;aspect-ratio:16/10;object-fit:cover;background:rgba(0,0,0,.05);"
              : "flex:0 0 " + side + "px;width:" + side + "px;height:" + side + "px;border-radius:" + Math.min(o.radius, side / 2) + "px;object-fit:cover;background:rgba(0,0,0,.05);");
            img.src = s.photo;
            img.alt = "";
            img.loading = "lazy";
            img.onerror = function () { img.remove(); };
            li.appendChild(img);
          }
          var text = el("div", "flex:1;min-width:0;" + (cards ? "display:flex;flex-direction:column;padding:14px 16px 16px;" : ""));
          var show = function () { open(bookAt(s.id), s, o, services); };
          li.style.cursor = "pointer";
          li.onclick = show;
          var name = el("button", "background:none;border:0;padding:0;margin:0;font:inherit;font-weight:700;color:inherit;text-align:left;cursor:pointer;line-height:1.3;", s.name);
          name.type = "button";
          text.appendChild(name);
          if (!compact && shows(o, "descripcion") && s.description) text.appendChild(el("div", "font-size:14px;line-height:1.45;opacity:.75;margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;", s.description));
          var p = [shows(o, "precio") ? priceText(s) : "", shows(o, "duracion") ? durationText(s) : "", needsAccount(s.admission) ? T("con cuenta de barrypets", "with a barrypets account") : ""].filter(Boolean).join(" · ");
          var b = button(T("Reservar", "Book"), o, true);
          b.setAttribute("aria-label", T("Reservar ", "Book ") + s.name);
          b.onclick = function (e) { e.stopPropagation(); open(bookAt(s.id)); };
          if (compact) {
            if (p) text.appendChild(el("div", "font-size:14px;opacity:.75;margin-top:2px;", p));
            li.appendChild(text);
            li.appendChild(b);
          } else {
            var foot = el("div", "display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:" + (cards ? "auto" : "10px") + ";" + (cards ? "padding-top:12px;" : ""));
            foot.appendChild(el("div", "font-size:14px;font-weight:600;", p));
            foot.appendChild(b);
            text.appendChild(foot);
            li.appendChild(text);
          }
          ul.appendChild(li);
        });
        root.appendChild(ul);
      });
  }

  function all() { Array.prototype.forEach.call(document.querySelectorAll(".barrypets-reservar"), draw); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", all);
  else all();
})();
