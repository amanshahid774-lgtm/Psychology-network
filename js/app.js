(function () {
  "use strict";
  var D = window.PN_DATA, CFG = window.SITE_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var KEY = "pn_saved_v1";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---- saved items (this browser only) ---- */
  var saved = new Set();
  function loadSaved() {
    try {
      var raw = localStorage.getItem(KEY);
      var arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) saved = new Set(arr.filter(function (id) {
        return D.opportunities.some(function (o) { return o.id === id; });
      }));
    } catch (e) { saved = new Set(); }
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(Array.from(saved))); } catch (e) { /* storage blocked: saves last for this visit only */ }
  }
  function toggleSave(id) {
    if (saved.has(id)) saved.delete(id); else saved.add(id);
    persist(); renderOpps(); updateCount();
  }
  function updateCount() { $("savedCount").textContent = saved.size; }

  /* ---- dates ---- */
  function fmtDate(d) {
    if (!d) return "Rolling (no fixed deadline)";
    var p = d.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  /* ---- filters ---- */
  function fillSelect(id, key) {
    var vals = Array.from(new Set(D.opportunities.map(function (o) { return o[key]; }))).sort();
    $(id).insertAdjacentHTML("beforeend", vals.map(function (v) { return '<option>' + esc(v) + '</option>'; }).join(""));
  }
  var F = { q: "", type: "", field: "", city: "", pay: "", savedOnly: false };

  function matches(o) {
    if (F.type && o.type !== F.type) return false;
    if (F.field && o.field !== F.field) return false;
    if (F.city && o.city !== F.city) return false;
    if (F.pay && o.pay !== F.pay) return false;
    if (F.savedOnly && !saved.has(o.id)) return false;
    if (F.q) {
      var hay = [o.title, o.org, o.type, o.field, o.city, o.pay, o.about].join(" ").toLowerCase();
      return F.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
    }
    return true;
  }

  function renderOpps() {
    var list = D.opportunities.filter(matches);
    $("count").textContent = list.length + " of " + D.opportunities.length + " demonstration listings";
    if (!list.length) {
      $("opps").innerHTML = '<div class="empty" style="grid-column:1/-1">' +
        (F.savedOnly && !saved.size ? 'You have not saved any listings yet. Use Save on a listing to keep it here.' : 'No listings match these filters. Clear a filter to see more.') + '</div>';
      return;
    }
    $("opps").innerHTML = list.map(function (o) {
      var s = saved.has(o.id);
      return '<article class="card"><div class="tags"><span class="tag">' + esc(o.type) + '</span><span class="tag">' + esc(o.field) + '</span><span class="tag demo">Demo</span></div>' +
        '<h3>' + esc(o.title) + '</h3><p>' + esc(o.org) + ' · ' + esc(o.city) + ' · ' + esc(o.pay) + '</p>' +
        '<div class="row"><span>Deadline: ' + esc(fmtDate(o.deadline)) + '</span><span class="acts">' +
        '<button class="btn ghost" data-open="opp:' + o.id + '" type="button">Details</button>' +
        '<button class="save" data-save="' + o.id + '" aria-pressed="' + s + '" type="button" aria-label="' + (s ? "Remove " : "Save ") + esc(o.title) + '">' + (s ? "Saved" : "Save") + '</button></span></div></article>';
    }).join("");
  }

  function readFilters() {
    F.q = $("search").value.trim(); F.type = $("fType").value; F.field = $("fField").value;
    F.city = $("fCity").value; F.pay = $("fPay").value; F.savedOnly = $("savedOnly").checked;
    renderOpps();
  }

  /* ---- other sections ---- */
  function renderResearch() {
    $("researchGrid").innerHTML = D.research.map(function (r) {
      return '<article class="card"><div class="tags"><span class="tag">' + esc(r.stage) + '</span><span class="tag">' + esc(r.place) + '</span><span class="tag demo">Demo</span></div>' +
        '<h3>' + esc(r.title) + '</h3><p>' + esc(r.about) + '</p><p><b>Looking for:</b> ' + esc(r.needs.join(", ")) + '</p>' +
        '<div class="row"><span>Skills: ' + esc(r.skills) + '</span><button class="btn ghost" data-open="res:' + r.id + '" type="button">Details</button></div></article>';
    }).join("");
  }
  function renderEvents() {
    $("eventGrid").innerHTML = D.events.map(function (e) {
      return '<article class="card"><div class="tags"><span class="tag">' + esc(e.kind) + '</span><span class="tag">' + esc(e.cost) + '</span><span class="tag demo">Demo</span></div>' +
        '<h3>' + esc(e.title) + '</h3><p>' + esc(e.about) + '</p>' +
        '<div class="row"><span>' + esc(e.where) + ' · ' + esc(e.when) + '</span><button class="btn ghost" data-open="evt:' + e.id + '" type="button">Details</button></div></article>';
    }).join("");
  }
  var cat = "All";
  function renderCommunity() {
    $("chips").innerHTML = D.categories.map(function (c) {
      return '<button class="chip" type="button" data-cat="' + esc(c) + '" aria-pressed="' + (c === cat) + '">' + esc(c) + '</button>';
    }).join("");
    var t = D.threads.filter(function (x) { return cat === "All" || x.c === cat; });
    $("threads").innerHTML = t.length ? t.map(function (x) {
      return '<div class="thread"><b>' + esc(x.t) + '</b><span>' + esc(x.c) + ' · sample title</span></div>';
    }).join("") : '<div class="empty">No sample threads in this category yet.</div>';
  }

  /* ---- details dialog ---- */
  var dlg = $("dlg"), lastFocus = null;
  function row(k, v) { return '<dt>' + esc(k) + '</dt><dd>' + v + '</dd>'; }
  function openDetails(ref) {
    var p = ref.split(":"), kind = p[0], id = p[1], html = "";
    if (kind === "opp") {
      var o = D.opportunities.find(function (x) { return x.id === id; }); if (!o) return;
      var s = saved.has(o.id);
      html = '<div class="tags"><span class="tag">' + esc(o.type) + '</span><span class="tag demo">Demonstration listing</span></div><h3 id="dlgTitle">' + esc(o.title) + '</h3><p>' + esc(o.about) + '</p><dl>' +
        row("Organization", esc(o.org)) + row("Location", esc(o.city)) + row("Pay", esc(o.pay)) + row("Field", esc(o.field)) + row("Deadline", esc(fmtDate(o.deadline))) + row("Eligibility", esc(o.eligibility)) +
        row("Responsibilities", '<ul>' + o.duties.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join("") + '</ul>') + '</dl>' +
        '<p class="sub" style="margin:0">This listing is invented for demonstration. There is nothing to apply to.</p>' +
        '<div class="foot"><button class="save" data-save="' + o.id + '" data-keep="1" aria-pressed="' + s + '" type="button">' + (s ? "Saved" : "Save") + '</button><button class="btn" data-close type="button">Close</button></div>';
    } else if (kind === "res") {
      var r = D.research.find(function (x) { return x.id === id; }); if (!r) return;
      html = '<div class="tags"><span class="tag">' + esc(r.stage) + '</span><span class="tag demo">Demonstration project</span></div><h3 id="dlgTitle">' + esc(r.title) + '</h3><p>' + esc(r.about) + '</p><dl>' +
        row("Looking for", esc(r.needs.join(", "))) + row("Skills", esc(r.skills)) + row("Location", esc(r.place)) + row("Ethics", esc(r.ethics)) + '</dl>' +
        '<p class="sub" style="margin:0">This project is invented. Collaboration requests are not available.</p><div class="foot"><button class="btn" data-close type="button">Close</button></div>';
    } else {
      var e = D.events.find(function (x) { return x.id === id; }); if (!e) return;
      html = '<div class="tags"><span class="tag">' + esc(e.kind) + '</span><span class="tag demo">Demonstration event</span></div><h3 id="dlgTitle">' + esc(e.title) + '</h3><p>' + esc(e.about) + '</p><dl>' +
        row("Format", esc(e.where)) + row("When", esc(e.when)) + row("Cost", esc(e.cost)) + '</dl>' +
        '<p class="sub" style="margin:0">This event is invented. There is nothing to register for.</p><div class="foot"><button class="btn" data-close type="button">Close</button></div>';
    }
    $("dlgBody").innerHTML = html;
    lastFocus = document.activeElement;
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  }
  function closeDlg() { if (dlg.open) dlg.close(); }
  dlg.addEventListener("close", function () { if (lastFocus && lastFocus.focus) lastFocus.focus(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) closeDlg(); });

  /* ---- events ---- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-save],[data-open],[data-close],[data-cat]"); if (!t) return;
    if (t.hasAttribute("data-save")) {
      var id = t.getAttribute("data-save"); toggleSave(id);
      if (t.hasAttribute("data-keep")) { var s = saved.has(id); t.textContent = s ? "Saved" : "Save"; t.setAttribute("aria-pressed", s); }
    } else if (t.hasAttribute("data-open")) openDetails(t.getAttribute("data-open"));
    else if (t.hasAttribute("data-close")) closeDlg();
    else if (t.hasAttribute("data-cat")) { cat = t.getAttribute("data-cat"); renderCommunity(); }
  });

  ["fType", "fField", "fCity", "fPay", "savedOnly"].forEach(function (id) { $(id).addEventListener("change", readFilters); });
  $("search").addEventListener("input", readFilters);
  $("clear").addEventListener("click", function () {
    $("search").value = ""; $("heroInput").value = "";
    ["fType", "fField", "fCity", "fPay"].forEach(function (id) { $(id).value = ""; });
    $("savedOnly").checked = false; readFilters();
  });
  $("heroSearch").addEventListener("submit", function (e) {
    e.preventDefault(); $("search").value = $("heroInput").value; readFilters();
    $("opportunities").scrollIntoView({ behavior: "smooth" });
  });
  $("savedLink").addEventListener("click", function () {
    $("savedOnly").checked = true; readFilters();
  });

  /* mobile menu */
  var burger = $("burger"), menu = $("menu");
  function setMenu(open) { menu.classList.toggle("open", open); burger.setAttribute("aria-expanded", open); burger.textContent = open ? "Close" : "Menu"; }
  burger.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  menu.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  /* highlight current section in nav */
  if ("IntersectionObserver" in window) {
    var links = {}; Array.prototype.forEach.call(menu.querySelectorAll("a"), function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { Object.keys(links).forEach(function (k) { links[k].classList.toggle("active", k === x.target.id); }); } });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(links).forEach(function (k) { var el = $(k); if (el) io.observe(el); });
  }

  /* keep saved count in sync across tabs */
  window.addEventListener("storage", function (e) { if (e.key === KEY) { loadSaved(); renderOpps(); updateCount(); } });

  /* join section: no registration, optional contact email only */
  if (CFG.contactEmail && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(CFG.contactEmail)) {
    $("contact").innerHTML = '<a class="btn light" href="mailto:' + esc(CFG.contactEmail) + '?subject=' + encodeURIComponent("Notify me about The Psychology Network") + '">Email us to hear about launch</a>';
  }

  /* init */
  loadSaved();
  fillSelect("fType", "type"); fillSelect("fField", "field"); fillSelect("fCity", "city"); fillSelect("fPay", "pay");
  renderOpps(); renderResearch(); renderEvents(); renderCommunity(); updateCount();
})();
