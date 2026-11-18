/* <soma-viewer>: a lightweight, reusable 3D model viewer for Soma, built on <model-viewer>.
   Usage:
     <soma-viewer src="assets/3dmodels/Amoeba.glb" title="Amoeba" alt="3D model of an amoeba">
       <soma-note position="x y z" normal="x y z" title="Nucleus">Text shown in the tooltip.</soma-note>
     </soma-viewer>
   Optional attributes: poster (preview image), autoload (load when scrolled into view), camera-orbit, exposure,
   shadow-intensity, environment-image, ar="false" (hide the AR button), auto-rotate="false".
   Nothing heavy loads (not the viewer library, not the model) until the visitor taps "View in 3D". */
(function () {
  "use strict";

  var script = document.currentScript;
  var BASE = script && script.src ? script.src.replace(/[^\/]*$/, "") : "assets/js/";
  var LIB_URL = BASE + "model-viewer.min.js";
  var DRACO_URL = BASE + "draco/";
  var libPromise = null;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var conn = navigator.connection;
  var lowData = !!(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "")));

  function loadLib() {
    if (!libPromise) {
      libPromise = import(LIB_URL).then(function (m) {
        if (m && m.ModelViewerElement) m.ModelViewerElement.dracoDecoderLocation = DRACO_URL;
        return customElements.whenDefined("model-viewer");
      });
    }
    return libPromise;
  }

  var I = {
    play:  '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" stroke="none"/>',
    pin:   '<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    ar:    '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
    full:  '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    exit:  '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'
  };
  function icon(name, filled) {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[name] + "</svg>";
  }

  var CSS = [
    "soma-viewer{position:relative;display:block;width:100%;aspect-ratio:16/9;min-height:260px;overflow:hidden;border-radius:inherit;color:#fff;",
    "background:radial-gradient(120% 90% at 30% 15%,#17386b 0%,#0c1a3a 55%,#070e22 100%);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-tap-highlight-color:transparent}",
    ".responsive-iframe-container>soma-viewer{position:absolute;inset:0;aspect-ratio:auto;min-height:0}",
    "soma-viewer.sv-expanded{position:fixed!important;inset:0!important;z-index:3000;border-radius:0}",
    "soma-viewer model-viewer{position:absolute;inset:0;width:100%;height:100%;background:transparent;--poster-color:transparent;--progress-bar-color:transparent;outline:none}",
    ".sv-start{position:absolute;inset:0;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;border:0;",
    "background:center/cover no-repeat;color:#fff;cursor:pointer;text-align:center;font:inherit}",
    ".sv-start:focus-visible{outline:3px solid #1caad9;outline-offset:-6px}",
    ".sv-play{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.16);",
    "border:1px solid rgba(255,255,255,.35);backdrop-filter:blur(8px);transition:transform .2s ease,background .2s ease}",
    ".sv-start:hover .sv-play,.sv-start:focus-visible .sv-play{transform:scale(1.08);background:rgba(28,170,217,.55)}",
    ".sv-start strong{font-size:1.05rem}.sv-start small{opacity:.75;font-size:.8rem}",
    ".sv-title{position:absolute;top:10px;left:10px;padding:3px 10px;border-radius:999px;background:rgba(0,0,0,.45);font-size:12px;font-weight:600;pointer-events:none}",
    ".sv-hint{position:absolute;left:12px;bottom:14px;font-size:12px;opacity:.8;pointer-events:none;transition:opacity .6s ease;text-shadow:0 1px 3px rgba(0,0,0,.6)}",
    ".sv-hint.sv-gone{opacity:0}",
    ".sv-progress{position:absolute;left:0;right:0;bottom:0;height:4px;background:rgba(255,255,255,.12);transition:opacity .4s ease}",
    ".sv-progress i{display:block;height:100%;width:0;background:#1caad9;transition:width .15s linear}",
    ".sv-progress.sv-done{opacity:0}",
    ".sv-tools{position:absolute;right:10px;bottom:10px;display:flex;gap:6px;z-index:5}",
    ".sv-btn{width:36px;height:36px;padding:0;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;cursor:pointer;",
    "background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.24);backdrop-filter:blur(8px);transition:background .2s ease}",
    ".sv-btn:hover,.sv-btn:focus-visible{background:rgba(255,255,255,.28);outline:none}",
    ".sv-btn[aria-pressed='true']{background:#1caad9;border-color:transparent}",
    ".sv-btn[hidden]{display:none}",
    ".sv-error{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;text-align:center;background:rgba(7,14,34,.85)}",
    ".sv-error button{padding:6px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.4);background:transparent;color:#fff;cursor:pointer}",
    ".sv-hot{position:relative;width:28px;height:28px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.96);color:#1b1f2a;cursor:pointer;",
    "box-shadow:0 0 0 3px rgba(255,255,255,.35),0 4px 12px rgba(0,0,0,.35);transition:opacity .25s,transform .2s,background .2s,color .2s}",
    ".sv-hot:hover,.sv-hot:focus-visible{transform:scale(1.15);outline:none}",
    ".sv-hot.sv-on{background:#1caad9;color:#fff;transform:scale(1.15)}",
    ".sv-hot:not([data-visible]){opacity:.3;pointer-events:none}",
    ".sv-hot:not([data-visible]) .sv-tip{display:none}",
    ".sv-num{display:block;font:700 13px/28px system-ui,sans-serif;pointer-events:none}",
    "soma-viewer.sv-notes-off .sv-hot{display:none}",
    ".sv-tip{--ax:50%;position:absolute;left:50%;bottom:calc(100% + 12px);transform:translateX(-50%) translateY(4px);display:block;width:max-content;max-width:230px;",
    "padding:10px 12px;border-radius:10px;background:rgba(15,18,32,.95);border:1px solid rgba(255,255,255,.14);box-shadow:0 8px 24px rgba(0,0,0,.4);",
    "color:#fff;text-align:left;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .2s,transform .2s,visibility .2s;z-index:10}",
    ".sv-tip::after{content:'';position:absolute;left:var(--ax);top:100%;width:10px;height:10px;background:rgba(15,18,32,.95);",
    "border-right:1px solid rgba(255,255,255,.14);border-bottom:1px solid rgba(255,255,255,.14);transform:translate(-50%,-50%) rotate(45deg)}",
    ".sv-hot.sv-below .sv-tip{bottom:auto;top:calc(100% + 12px)}",
    ".sv-hot.sv-below .sv-tip::after{top:0;border:0;border-left:1px solid rgba(255,255,255,.14);border-top:1px solid rgba(255,255,255,.14)}",
    ".sv-hot.sv-on .sv-tip{opacity:1;visibility:visible;transform:translateX(0) translateY(0)}",
    ".sv-tip strong{display:block;font-size:14px;color:#1caad9}",
    ".sv-tip span{display:block;margin-top:4px;font-size:12.5px;line-height:1.4;color:rgba(255,255,255,.9)}",
    "@media (max-width:575.98px){.sv-btn{width:34px;height:34px}.sv-tip{max-width:190px}.sv-hint{display:none}}",
    "@media (prefers-reduced-motion:reduce){.sv-hot,.sv-tip,.sv-progress,.sv-hint{transition:none}}"
  ].join("");

  function nums(text) { return String(text || "").trim().split(/\s+/).map(parseFloat); }
  function orbitFor(normal) {
    var n = nums(normal), l = Math.hypot(n[0], n[1], n[2]) || 1;
    var theta = Math.atan2(n[0] / l, n[2] / l) * 180 / Math.PI;
    var phi = Math.acos(Math.max(-1, Math.min(1, n[1] / l))) * 180 / Math.PI;
    return theta.toFixed(1) + "deg " + Math.min(105, Math.max(60, phi)).toFixed(1) + "deg 60%";
  }

  class SomaViewer extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      if (!document.getElementById("somaViewerStyle")) {
        var st = document.createElement("style");
        st.id = "somaViewerStyle";
        st.textContent = CSS;
        document.head.appendChild(st);
      }
      this._notes = Array.prototype.map.call(this.querySelectorAll("soma-note"), function (n) {
        return { position: n.getAttribute("position"), normal: n.getAttribute("normal") || "0 0 1", title: n.getAttribute("title") || "",
                 text: (n.textContent || "").trim(), orbit: n.getAttribute("orbit"), target: n.getAttribute("target") };
      });
      this._name = this.getAttribute("title") || "3D model";
      this._buildStart();
      if (this.hasAttribute("autoload") && "IntersectionObserver" in window && !lowData) {
        this._io = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { this._io.disconnect(); this._activate(); }
        }.bind(this), { rootMargin: "200px" });
        this._io.observe(this);
      }
    }

    disconnectedCallback() {
      if (this._io) this._io.disconnect();
      this._release();
      this._init = false;
    }

    _buildStart() {
      this.textContent = "";
      this.setAttribute("role", "region");
      this.setAttribute("aria-label", this._name + " 3D viewer");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "sv-start";
      var poster = this.getAttribute("poster");
      if (poster) b.style.backgroundImage = "linear-gradient(rgba(7,14,34,.45),rgba(7,14,34,.65)),url('" + poster + "')";
      b.innerHTML = '<span class="sv-play">' + icon("play") + '</span><strong>View in 3D</strong><small>' + this._name + " · interactive model</small>";
      var warm = function () { loadLib().catch(function () {}); };
      b.addEventListener("pointerenter", warm, { once: true });
      b.addEventListener("focus", warm, { once: true });
      b.addEventListener("touchstart", warm, { once: true, passive: true });
      b.addEventListener("click", this._activate.bind(this));
      this.appendChild(b);
      this._start = b;
    }

    _activate() {
      if (this._mv || this._busy) return;
      var other = SomaViewer.active;
      if (other && other !== this) other._release();   // one live 3D scene at a time keeps phones smooth
      SomaViewer.active = this;
      this._busy = true;
      this._start.disabled = true;
      this._start.querySelector("strong").textContent = "Loading…";
      SomaViewer.loadLib().then(this._mount.bind(this)).catch(this._fail.bind(this));
    }

    _attr(name, fallback) { return this.getAttribute(name) || fallback; }

    _mount() {
      var self = this, mv = document.createElement("model-viewer");
      this._mv = mv;
      mv.setAttribute("src", this.getAttribute("src"));
      mv.setAttribute("alt", this.getAttribute("alt") || this._name + " 3D model");
      mv.setAttribute("camera-controls", "");
      mv.setAttribute("touch-action", "pan-y");
      mv.setAttribute("interaction-prompt", "none");
      mv.setAttribute("environment-image", this._attr("environment-image", "neutral"));
      mv.setAttribute("tone-mapping", "neutral");
      mv.setAttribute("exposure", this._attr("exposure", "1.05"));
      mv.setAttribute("shadow-intensity", this._attr("shadow-intensity", "0.8"));
      mv.setAttribute("interpolation-decay", "120");
      mv.setAttribute("loading", "eager");
      mv.setAttribute("reveal", "auto");
      if (this.getAttribute("camera-orbit")) mv.setAttribute("camera-orbit", this.getAttribute("camera-orbit"));
      if (this.getAttribute("ar") !== "false") { mv.setAttribute("ar", ""); mv.setAttribute("ar-modes", "webxr scene-viewer quick-look"); }
      this._spin = this.getAttribute("auto-rotate") !== "false" && !reduceMotion && !lowData;
      if (this._spin) { mv.setAttribute("auto-rotate", ""); mv.setAttribute("auto-rotate-delay", "1500"); mv.setAttribute("rotation-per-second", "18deg"); }

      this._notes.forEach(function (note, i) {
        if (!note.position) return;
        var h = document.createElement("button");
        h.type = "button";
        h.className = "sv-hot";
        h.slot = "hotspot-" + (i + 1);
        h.setAttribute("data-position", note.position);
        h.setAttribute("data-normal", note.normal);
        h.setAttribute("data-visibility-attribute", "visible");
        h.setAttribute("aria-label", "Note " + (i + 1) + ": " + note.title);
        h.innerHTML = '<span class="sv-num">' + (i + 1) + '</span><span class="sv-tip" role="tooltip"><strong></strong><span></span></span>';
        h.querySelector("strong").textContent = note.title;
        h.querySelector(".sv-tip span").textContent = note.text;
        h._note = note;
        h.addEventListener("click", function () { self._toggleNote(h); });
        mv.appendChild(h);
      });

      mv.addEventListener("progress", function (e) {
        var p = Math.round(((e.detail && e.detail.totalProgress) || 0) * 100);
        if (self._bar) self._bar.style.width = p + "%";
      });
      mv.addEventListener("load", function () { self._ready(); }, { once: true });
      mv.addEventListener("error", function () { self._fail(); }, { once: true });
      mv.addEventListener("camera-change", function (e) {
        if (e.detail && e.detail.source === "user-interaction" && self._hint) self._hint.classList.add("sv-gone");
        if (self._cur) self._place(self._cur);
      });
      var down = [0, 0];
      mv.addEventListener("pointerdown", function (e) { down = [e.clientX, e.clientY]; });
      mv.addEventListener("click", function (e) {
        if (!self._cur || (e.target.closest && e.target.closest(".sv-hot"))) return;
        if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
        self._closeNote(true);
      });

      this.appendChild(mv);
      this._progress = document.createElement("div");
      this._progress.className = "sv-progress";
      this._progress.innerHTML = "<i></i>";
      this._bar = this._progress.firstChild;
      this.appendChild(this._progress);
    }

    _ready() {
      var self = this;
      this._busy = false;
      if (this._start) { this._start.remove(); this._start = null; }
      if (this._progress) this._progress.classList.add("sv-done");

      var t = document.createElement("span");
      t.className = "sv-title";
      t.textContent = this._name;
      this._hint = document.createElement("span");
      this._hint.className = "sv-hint";
      this._hint.textContent = "Drag to rotate · scroll or pinch to zoom" + (this._notes.length ? " · tap the numbers" : "");
      var tools = document.createElement("div");
      tools.className = "sv-tools";
      var mk = function (name, label, onclick, pressed) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "sv-btn";
        b.title = label;
        b.setAttribute("aria-label", label);
        b.innerHTML = icon(name);
        if (pressed !== undefined) b.setAttribute("aria-pressed", String(pressed));
        b.addEventListener("click", onclick);
        tools.appendChild(b);
        return b;
      };
      this._spinBtn = mk("pause", "Auto-rotate", function () {
        self._mv.autoRotate = !self._mv.autoRotate;
        self._spin = self._mv.autoRotate;
        self._syncSpin();
      }, this._spin);
      this._syncSpin();
      if (this._notes.length) {
        mk("pin", "Show or hide notes", function (e) {
          var off = self.classList.toggle("sv-notes-off");
          e.currentTarget.setAttribute("aria-pressed", String(!off));
          self._closeNote(false);
        }, true);
      }
      mk("reset", "Reset view", function () { self._reset(); });
      var arBtn = mk("ar", "View in your space (AR)", function () { if (self._mv.activateAR) self._mv.activateAR(); });
      arBtn.hidden = !self._mv.canActivateAR;
      this._fsBtn = mk("full", "Full screen", function () { self._fullscreen(); }, false);
      this.appendChild(t);
      this.appendChild(this._hint);
      this.appendChild(tools);

      this._onKey = function (e) { if (e.key === "Escape") { if (self._cur) self._closeNote(true); else if (self.classList.contains("sv-expanded")) self._fullscreen(); } };
      document.addEventListener("keydown", this._onKey);
      this._onFs = function () { self._syncFs(); };
      document.addEventListener("fullscreenchange", this._onFs);
      this.dispatchEvent(new CustomEvent("sv-ready", { bubbles: true }));
    }

    _syncSpin() {
      this._spinBtn.innerHTML = icon(this._mv.autoRotate ? "pause" : "play");
      this._spinBtn.setAttribute("aria-pressed", String(!!this._mv.autoRotate));
    }

    _syncFs() {
      var on = document.fullscreenElement === this || this.classList.contains("sv-expanded");
      this._fsBtn.innerHTML = icon(on ? "exit" : "full");
      this._fsBtn.title = on ? "Exit full screen" : "Full screen";
      this._fsBtn.setAttribute("aria-pressed", String(on));
    }

    _fullscreen() {
      if (document.fullscreenElement === this) { document.exitFullscreen(); return; }
      if (this.classList.contains("sv-expanded")) { this.classList.remove("sv-expanded"); this._syncFs(); return; }
      if (this.requestFullscreen) {
        this.requestFullscreen().catch(function () { this.classList.add("sv-expanded"); this._syncFs(); }.bind(this));
      } else {
        this.classList.add("sv-expanded");   // iPhone Safari has no element fullscreen, so fill the screen instead
        this._syncFs();
      }
    }

    _reset() {
      var mv = this._mv;
      this._closeNote(false);
      mv.cameraTarget = "auto auto auto";
      mv.cameraOrbit = this.getAttribute("camera-orbit") || "0deg 75deg 105%";
      mv.fieldOfView = "auto";
      if (this.getAttribute("auto-rotate") !== "false" && !reduceMotion && !lowData) { mv.autoRotate = true; this._spin = true; }
      this._syncSpin();
    }

    _place(h) {
      var tip = h.querySelector(".sv-tip"), v = this._mv.getBoundingClientRect(), b = h.getBoundingClientRect();
      var tw = tip.offsetWidth, th = tip.offsetHeight, cx = b.left + b.width / 2 - v.left;
      var left = Math.min(Math.max(cx - tw / 2, 8), Math.max(v.width - tw - 8, 8));
      tip.style.left = (left - (b.left - v.left)) + "px";
      tip.style.transform = "";
      tip.style.setProperty("--ax", Math.min(Math.max(cx - left, 14), tw - 14) + "px");
      h.classList.toggle("sv-below", (b.top - v.top) - th - 16 < 8);
    }

    _toggleNote(h) {
      if (this._cur === h) { this._closeNote(true); return; }
      if (this._cur) this._cur.classList.remove("sv-on");
      else this._wasSpinning = !!this._mv.autoRotate;
      this._cur = h;
      h.classList.add("sv-on");
      var note = h._note, mv = this._mv;
      mv.autoRotate = false;
      this._syncSpin();
      mv.cameraTarget = note.target || note.position;
      mv.cameraOrbit = note.orbit || orbitFor(note.normal);
      this._place(h);
    }

    _closeNote(restoreView) {
      if (!this._cur) return;
      this._cur.classList.remove("sv-on");
      this._cur = null;
      if (restoreView) {
        this._mv.cameraTarget = "auto auto auto";
        this._mv.cameraOrbit = this.getAttribute("camera-orbit") || "0deg 75deg 105%";
        if (this._wasSpinning) this._mv.autoRotate = true;
        this._syncSpin();
      }
    }

    _fail() {
      this._busy = false;
      libPromise = null;
      var self = this;
      if (this._mv) { this._mv.remove(); this._mv = null; }
      if (this._progress) this._progress.remove();
      this.querySelectorAll(".sv-error").forEach(function (n) { n.remove(); });
      var e = document.createElement("div");
      e.className = "sv-error";
      e.innerHTML = "<span>Sorry, the 3D model could not be loaded.</span>";
      var r = document.createElement("button");
      r.type = "button";
      r.textContent = "Try again";
      r.addEventListener("click", function () { self._release(); self._activate(); });
      e.appendChild(r);
      this.appendChild(e);
    }

    // Frees the 3D scene (GPU memory) and shows the start screen again.
    _release() {
      if (!this._init) return;
      if (this._mv) { this._mv.removeAttribute("src"); this._mv.remove(); }
      this._mv = null; this._cur = null; this._busy = false; this._hint = null; this._progress = null;
      if (this._onKey) document.removeEventListener("keydown", this._onKey);
      if (this._onFs) document.removeEventListener("fullscreenchange", this._onFs);
      this.classList.remove("sv-expanded", "sv-notes-off");
      if (SomaViewer.active === this) SomaViewer.active = null;
      this._buildStart();
    }
  }

  SomaViewer.active = null;
  SomaViewer.loadLib = loadLib;
  window.SomaViewer = SomaViewer;
  if (!customElements.get("soma-viewer")) customElements.define("soma-viewer", SomaViewer);
}());