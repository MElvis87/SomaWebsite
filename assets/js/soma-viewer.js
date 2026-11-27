/* <soma-viewer>: a lightweight, reusable 3D model viewer for Soma, built on <model-viewer>.
   Usage:
     <soma-viewer src="assets/3dmodels/Amoeba.glb" title="Amoeba" alt="3D model of an amoeba">
       <soma-note position="x y z" normal="x y z" title="Nucleus">Text shown in the tooltip.</soma-note>
       <soma-note at="0.5 0.9 1" normal="0 0 1" title="Shoulder">Placed as a fraction (0 to 1) of the model's width, height and depth,
                                                                  so it stays put if you rescale the model.</soma-note>
     </soma-viewer>
   Optional attributes: poster (preview image), autoload (load when scrolled into view), camera-orbit, exposure,
   shadow-intensity, environment-image, ar="false" (hide the AR button), auto-rotate="false",
   vr="false", note-occlusion="off" (keeps note markers clickable from any angle: use it for transparent or glass models), animation-name="Walk", ios-src="model.usdz" (iPhone AR file), ar-modes, ar-scale, ar-placement,
   idle-timeout="180" (seconds of no interaction before the viewer returns to its preview; 0 turns it off).
   Nothing heavy loads (not the viewer library, not the model) until the visitor taps "View in 3D". */
(function () {
  "use strict";

  var script = document.currentScript;
  var BASE = script && script.src ? script.src.replace(/[^\/]*$/, "") : "assets/js/";
  var LIB_URL = BASE + "model-viewer.min.js";
  var DRACO_URL = BASE + "draco/";
  var VR_URL = BASE + "soma-vr.js";
  var MESHOPT_URL = BASE + "meshopt_decoder.js";
  var BASIS_URL = BASE + "basis/";   // KTX2 texture transcoder (basis_transcoder.js + .wasm)
  var IDLE_DEFAULT = 180;   // seconds
  var libPromise = null;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var conn = navigator.connection;
  var lowData = !!(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "")));

  // Teaches the viewer to read Draco and Meshopt compressed models and KTX2 textures (it picks the right one from the file itself).
  // The Meshopt decoder is only switched on if its file is really there, so a missing file can never break Draco models.
  // Runs the Meshopt decoder script once, before model-viewer is told about it. If the file is missing, broken or
  // too slow, Meshopt simply stays off and Draco / plain models keep working exactly as before.
  function checkDecoderScript(url) {
    return new Promise(function (resolve) {
      var done = false, tag = document.createElement("script");
      var finish = function (ok) { if (!done) { done = true; window.clearTimeout(timer); resolve(ok); } };
      var timer = window.setTimeout(function () { finish(false); }, 8000);
      tag.async = true;
      tag.src = url;
      tag.onerror = function () { finish(false); };
      tag.onload = function () {
        var d = window.MeshoptDecoder;
        if (!d || d.supported === false) { finish(false); return; }
        Promise.resolve(d.ready).then(function () { finish(true); }, function () { finish(false); });
      };
      document.head.appendChild(tag);
    });
  }

  function configure(m) {
    var el = m && m.ModelViewerElement;
    if (!el) return;
    el.dracoDecoderLocation = DRACO_URL;
    var probe = function (url, apply) {
      return fetch(url, { method: "HEAD" }).then(function (r) { if (r.ok) apply(); }, function () {});
    };
    return Promise.all([
      checkDecoderScript(MESHOPT_URL).then(function (ok) { if (ok) el.meshoptDecoderLocation = MESHOPT_URL; }),
      // KTX2 textures: use our own copy of the transcoder instead of the default one on Google's servers
      probe(BASIS_URL + "basis_transcoder.wasm", function () { el.ktx2TranscoderLocation = BASIS_URL; })
    ]);
  }

  function loadLib() {
    if (!libPromise) {
      libPromise = import(LIB_URL).then(configure).then(function () { return customElements.whenDefined("model-viewer"); });
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
    exit:  '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
    vr:    '<path d="M3 8h18a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-5l-2-3h-4l-2 3H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/>',
    help:  '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1.1 1-1.1 1.8"/><circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    anim:  '<path d="M2 12c2.2-6.5 4.2-6.5 6.4 0s4.2 6.5 6.4 0 4.2-6.5 7.2 0"/>'
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
    ".sv-tools{position:absolute;right:10px;bottom:10px;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;max-width:calc(100% - 20px);z-index:5}",
    ".sv-btn{width:36px;height:36px;padding:0;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;cursor:pointer;",
    "background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.24);backdrop-filter:blur(8px);transition:background .2s ease}",
    ".sv-btn:hover,.sv-btn:focus-visible{background:rgba(255,255,255,.28);outline:none}",
    ".sv-btn[aria-pressed='true']{background:#1caad9;border-color:transparent}",
    ".sv-btn[hidden]{display:none}",
    ".sv-close{position:absolute;top:10px;right:10px;z-index:6}",
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
    ".sv-help{position:absolute;right:10px;bottom:56px;width:min(340px,calc(100% - 20px));max-height:calc(100% - 70px);overflow:auto;padding:12px 14px;",
    "border-radius:14px;background:rgba(15,18,32,.95);border:1px solid rgba(255,255,255,.16);box-shadow:0 10px 30px rgba(0,0,0,.45);z-index:8;font-size:13px}",
    ".sv-help-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}",
    ".sv-help-head strong{font-size:14px;color:#1caad9}",
    ".sv-help .sv-btn{width:28px;height:28px}",
    ".sv-help-row{display:flex;gap:10px;align-items:flex-start;margin:8px 0;line-height:1.35}",
    ".sv-help-ico{flex:0 0 28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.14)}",
    ".sv-help-row b{display:block}.sv-help-row span span{opacity:.85}",
    ".sv-help-foot{margin:8px 0 0;padding-top:8px;border-top:1px solid rgba(255,255,255,.14);opacity:.85}",
    ".sv-toast{position:absolute;left:50%;bottom:56px;transform:translateX(-50%);max-width:90%;padding:8px 14px;border-radius:999px;background:rgba(15,18,32,.95);",
    "border:1px solid rgba(255,255,255,.16);font-size:13px;z-index:9;text-align:center}",
    "@media (max-width:575.98px){.sv-btn{width:34px;height:34px}.sv-tip{max-width:190px}.sv-hint{display:none}}",
    "@media (prefers-reduced-motion:reduce){.sv-hot,.sv-tip,.sv-progress,.sv-hint{transition:none}}"
  ].join("");

  // model-viewer wants units on positions ("0.4m"), so add metres where the number has none.
  function meters(text) {
    return String(text || "").trim().split(/\s+/).map(function (t) { return /[a-z]+$/i.test(t) ? t : t + "m"; }).join(" ");
  }
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
                 text: (n.textContent || "").trim(), orbit: n.getAttribute("orbit"), target: n.getAttribute("target"),
                 at: n.getAttribute("at") ? nums(n.getAttribute("at")) : null };
      });
      this._name = this.getAttribute("title") || "3D model";
      this._buildStart();
      var act = this._bump.bind(this);
      ["pointerdown", "pointermove", "wheel", "keydown", "touchstart"].forEach(function (name) {
        this.addEventListener(name, act, { passive: true });
      }, this);
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
      var self = this, tok = this._tok = (this._tok || 0) + 1;   // lets a close tap cancel a load that is still in flight
      SomaViewer.loadLib().then(function () { if (self._tok === tok && self._busy) self._mount(); })
                          .catch(function () { if (self._tok === tok) self._fail(); });
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
      if (this.getAttribute("ar") !== "false") {
        // Default skips Google's Scene Viewer, which re-downloads the file and may not read Meshopt or KTX2.
        // Android Chrome uses WebXR (the model already in the page); iPhone uses Quick Look with ios-src.
        mv.setAttribute("ar", "");
        mv.setAttribute("ar-modes", this.getAttribute("ar-modes") || "webxr quick-look");
        ["ios-src", "ar-scale", "ar-placement"].forEach(function (a) {
          if (self.getAttribute(a)) mv.setAttribute(a, self.getAttribute(a));
        });
      }
      this._spin = this.getAttribute("auto-rotate") !== "false" && !reduceMotion && !lowData;
      if (this._spin) { mv.setAttribute("auto-rotate", ""); mv.setAttribute("auto-rotate-delay", "1500"); mv.setAttribute("rotation-per-second", "18deg"); }

      this._notes.forEach(function (note, i) {
        if (!note.position && !note.at) return;
        var h = document.createElement("button");
        h.type = "button";
        h.className = "sv-hot";
        h.slot = "hotspot-" + (i + 1);
        h.setAttribute("data-position", meters(note.position || "0 0 0"));   // "at" notes are moved into place once the model has loaded
        h.setAttribute("data-normal", meters(note.normal));
        if (self.getAttribute("note-occlusion") === "off") h.setAttribute("data-visible", "");   // always visible and clickable, even behind glass
        else h.setAttribute("data-visibility-attribute", "visible");
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
        if (e.detail && e.detail.source === "user-interaction") { self._bump(); if (self._hint) self._hint.classList.add("sv-gone"); }
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

      // Close (X): back to the preview with the play button, which frees the 3D scene and its GPU memory.
      var x = document.createElement("button");
      x.type = "button";
      x.className = "sv-btn sv-close";
      x.setAttribute("data-k", "close");
      x.title = "Close 3D view";
      x.setAttribute("aria-label", "Close 3D view");
      x.innerHTML = icon("close");
      x.addEventListener("click", function () {
        self._release();
        if (self._start) self._start.focus();
      });
      this.appendChild(x);
    }

    _ready() {
      var self = this;
      this._busy = false;
      this._placeNotes();
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
      var mk = function (name, label, onclick, pressed, key) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "sv-btn";
        if (key) b.setAttribute("data-k", key);
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
      }, this._spin, "spin");
      this._syncSpin();
      var clips = this._mv.availableAnimations || [];
      if (clips.length) {                                   // models with built-in animation get a play/pause button
        var clip = this.getAttribute("animation-name");
        if (!clip || clips.indexOf(clip) < 0) clip = clips[0];
        this._mv.animationName = clip;
        var autoplay = !reduceMotion && !lowData;
        if (autoplay) this._mv.play({ repetitions: Infinity });
        this._animBtn = mk("anim", "Play or pause the animation", function () {
          if (self._mv.paused) self._mv.play({ repetitions: Infinity }); else self._mv.pause();
          self._animBtn.setAttribute("aria-pressed", String(!self._mv.paused));
        }, autoplay, "anim");
      }
      if (this._notes.length) {
        mk("pin", "Show or hide notes", function (e) {
          var off = self.classList.toggle("sv-notes-off");
          e.currentTarget.setAttribute("aria-pressed", String(!off));
          self._closeNote(false);
        }, true, "notes");
      }
      mk("reset", "Reset view", function () { self._reset(); }, undefined, "reset");
      var arBtn = mk("ar", "View in your space (AR)", function () { if (self._mv.activateAR) self._mv.activateAR(); }, undefined, "ar");
      arBtn.hidden = !self._mv.canActivateAR;
      this._vrBtn = mk("vr", "Enter VR (headset)", function () { self._vr(); }, undefined, "vr");
      this._vrBtn.hidden = true;
      if (this.getAttribute("vr") !== "false" && navigator.xr && navigator.xr.isSessionSupported) {
        navigator.xr.isSessionSupported("immersive-vr").then(function (ok) { if (ok && self._vrBtn) self._vrBtn.hidden = false; }).catch(function () {});
        var warmVR = function () { SomaViewer.loadVR().catch(function () {}); };
        this._vrBtn.addEventListener("pointerenter", warmVR, { once: true });
        this._vrBtn.addEventListener("focus", warmVR, { once: true });
        this._vrBtn.addEventListener("touchstart", warmVR, { once: true, passive: true });
      }
      this._fsBtn = mk("full", "Full screen", function () { self._fullscreen(); }, false, "full");
      this._helpBtn = mk("help", "Help: what do the buttons do?", function () { self._toggleHelp(); }, false, "help");
      this.appendChild(t);
      this.appendChild(this._hint);
      this.appendChild(tools);

      this._onKey = function (e) { if (e.key === "Escape") { if (self._help) self._toggleHelp(); else if (self._cur) self._closeNote(true); else if (self.classList.contains("sv-expanded")) self._fullscreen(); } };
      document.addEventListener("keydown", this._onKey);
      this._onFs = function () { self._syncFs(); };
      document.addEventListener("fullscreenchange", this._onFs);
      this._startIdle();
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

    // Idle: after a few minutes with no interaction the viewer returns to its preview and frees its memory.
    _startIdle() {
      var seconds = parseFloat(this.getAttribute("idle-timeout"));
      if (isNaN(seconds)) seconds = IDLE_DEFAULT;
      this._idleMs = seconds > 0 ? seconds * 1000 : 0;
      this._lastBump = 0;
      this._bump(true);
    }

    _stopIdle() {
      window.clearTimeout(this._idleT);
      window.clearTimeout(this._warnT);
      this._idleMs = 0;
      this._idleToast = null;
    }

    _bump(force) {
      if (!this._idleMs || !this._mv) return;
      var now = Date.now();
      if (force !== true && now - this._lastBump < 1000) return;   // movement events are frequent, so check once a second
      this._lastBump = now;
      window.clearTimeout(this._idleT);
      window.clearTimeout(this._warnT);
      if (this._idleToast && this._toastEl === this._idleToast) { this._toastEl.remove(); this._toastEl = null; }
      this._idleToast = null;
      var self = this, lead = Math.min(10000, this._idleMs / 4);
      this._warnT = window.setTimeout(function () {
        self._toast("Still there? This 3D view will close soon to save memory. Tap to keep it open.", lead);
        self._idleToast = self._toastEl;
      }, this._idleMs - lead);
      this._idleT = window.setTimeout(function () { self._idle(); }, this._idleMs);
    }

    _idle() {
      if (this._inVR || this._vrBusy) { this._bump(true); return; }   // never close during a headset session
      this._release();
      this.dispatchEvent(new CustomEvent("sv-idle", { bubbles: true }));
    }

    // Notes written with at="fx fy fz" are fractions of the model's bounding box, so they survive rescaling.
    _placeNotes() {
      var mv = this._mv;
      if (!mv || !mv.getDimensions || !mv.getBoundingBoxCenter) return;
      var d = mv.getDimensions(), c = mv.getBoundingBoxCenter();
      this._notes.forEach(function (note, i) {
        if (!note.at) return;
        note.position = (c.x - d.x / 2 + note.at[0] * d.x) + "m " + (c.y - d.y / 2 + note.at[1] * d.y) + "m " + (c.z - d.z / 2 + note.at[2] * d.z) + "m";
        if (mv.updateHotspot) mv.updateHotspot({ name: "hotspot-" + (i + 1), position: note.position, normal: meters(note.normal) });
      });
    }

    _toast(message, ms) {
      var self = this;
      if (this._toastEl) this._toastEl.remove();
      var t = document.createElement("div");
      t.className = "sv-toast";
      t.setAttribute("role", "status");
      t.textContent = message;
      this.appendChild(t);
      this._toastEl = t;
      window.setTimeout(function () { if (self._toastEl === t) { t.remove(); self._toastEl = null; } }, ms || 3500);
    }

    _toggleHelp() {
      if (this._help) {
        this._help.remove();
        this._help = null;
        this._helpBtn.setAttribute("aria-pressed", "false");
        return;
      }
      var rows = [
        ["spin", "play", "Auto-rotate", "Starts or stops the slow spin."],
        ["anim", "anim", "Animation", "Plays or pauses the model's built-in animation."],
        ["notes", "pin", "Notes", "Shows or hides the numbered markers."],
        ["reset", "reset", "Reset view", "Returns the camera to the starting view."],
        ["ar", "ar", "AR", "Places the model in your room using your phone camera."],
        ["vr", "vr", "VR", "Opens the model in your VR headset."],
        ["full", "full", "Full screen", "Makes the viewer fill the screen."],
        ["close", "close", "Close (X)", "Closes the 3D view and returns to the preview. Tap the play button to open it again."]
      ];
      var html = '<div class="sv-help-head"><strong>What the buttons do</strong><button type="button" class="sv-btn" aria-label="Close help">' + icon("close") + "</button></div>";
      for (var i = 0; i < rows.length; i++) {
        var b = this.querySelector('.sv-btn[data-k="' + rows[i][0] + '"]');
        if (!b || b.hidden) continue;
        html += '<div class="sv-help-row"><span class="sv-help-ico">' + icon(rows[i][1]) + "</span><span><b>" + rows[i][2] + "</b><span>" + rows[i][3] + "</span></span></div>";
      }
      html += '<p class="sv-help-foot">Drag to rotate · scroll or pinch to zoom' + (this._notes.length ? " · tap a number to read its note" : "") + "</p>";
      var h = document.createElement("div");
      h.className = "sv-help";
      h.setAttribute("role", "dialog");
      h.setAttribute("aria-label", "Viewer help");
      h.innerHTML = html;
      h.querySelector(".sv-help-head .sv-btn").addEventListener("click", this._toggleHelp.bind(this));
      this.appendChild(h);
      this._help = h;
      this._helpBtn.setAttribute("aria-pressed", "true");
    }

    // Positions handed to VR as fractions of the model's size, so they line up whichever coordinate system they were made in.
    _vrNotes() {
      var mv = this._mv, d = mv && mv.getDimensions && mv.getDimensions(), c = mv && mv.getBoundingBoxCenter && mv.getBoundingBoxCenter();
      return this._notes.map(function (n) {
        var at = n.at;
        if (!at && n.position && d && c) {
          var p = nums(n.position);
          at = [(p[0] - (c.x - d.x / 2)) / (d.x || 1), (p[1] - (c.y - d.y / 2)) / (d.y || 1), (p[2] - (c.z - d.z / 2)) / (d.z || 1)];
        }
        return { title: n.title, text: n.text, position: n.position, at: at };
      });
    }

    // True VR: loads the separate VR module only on headsets, then opens the model in an immersive scene.
    async _vr() {
      var self = this, btn = this._vrBtn;
      if (this._vrBusy) return;
      this._vrBusy = true;
      btn.setAttribute("aria-busy", "true");
      try {
        if (!this._vrPrepared) {
          this._toast("Preparing VR…");
          var mod = await SomaViewer.loadVR();
          this._vrPrepared = await mod.prepare({
            src: new URL(this.getAttribute("src"), location.href).href,
            dracoUrl: DRACO_URL,
            basisUrl: BASIS_URL,
            notes: this._vrNotes(),
            animation: (this._mv && this._mv.animationName) || ""
          });
        }
        await this._vrPrepared.enter(function () {
          self._vrPrepared = null;
          self._inVR = false;
          self._bump();
          if (self._mv) self._mv.style.display = "";
        });
        this._inVR = true;
        if (this._mv) this._mv.style.display = "none";   // pauses the page's own 3D scene while in VR
      } catch (err) {
        var blocked = err && (err.name === "SecurityError" || err.name === "NotAllowedError");
        this._toast(blocked && this._vrPrepared ? "Ready. Tap the VR button again to enter." : "VR could not start on this device.");
        if (this._vrPrepared && !blocked) { try { this._vrPrepared.dispose(); } catch (e) {} this._vrPrepared = null; }
      } finally {
        this._vrBusy = false;
        btn.removeAttribute("aria-busy");
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
      mv.cameraTarget = meters(note.target || note.position);
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
      this._tok = (this._tok || 0) + 1;
      this._stopIdle();
      this._inVR = false;
      if (document.fullscreenElement === this && document.exitFullscreen) { try { document.exitFullscreen().catch(function () {}); } catch (e) {} }
      if (this._mv) { this._mv.removeAttribute("src"); this._mv.remove(); }
      this._mv = null; this._cur = null; this._busy = false; this._hint = null; this._progress = null;
      if (this._vrPrepared) { try { this._vrPrepared.dispose(); } catch (e) {} this._vrPrepared = null; }
      this._help = null; this._toastEl = null;
      if (this._onKey) document.removeEventListener("keydown", this._onKey);
      if (this._onFs) document.removeEventListener("fullscreenchange", this._onFs);
      this.classList.remove("sv-expanded", "sv-notes-off");
      if (SomaViewer.active === this) SomaViewer.active = null;
      this._buildStart();
    }
  }

  SomaViewer.active = null;
  SomaViewer.loadLib = loadLib;
  SomaViewer.configure = configure;
  SomaViewer.loadVR = function () { return import(VR_URL); };
  window.SomaViewer = SomaViewer;
  if (!customElements.get("soma-viewer")) customElements.define("soma-viewer", SomaViewer);
}());
