/* Soma overlay ads
   - Guests only: ads stop while signed in and resume after sign out.
   - Every INTERVAL ms an ad fades in over a faint overlay, stays DURATION ms, then closes itself.
   - Each ad keeps its own aspect ratio and is scaled to fit the screen. */
(function () {
  "use strict";

  /* ===== EDIT HERE ===== */
  var ADS = [
    { src: "assets/ads/ad-1.jpg", alt: "Advertisement", href: "" },   // href: optional link opened in a new tab
    { src: "assets/ads/ad-2.jpg", alt: "Advertisement", href: "" }
  ];
  var INTERVAL = 20000;   // wait between ads (ms), counted from when the last one closed
  var DURATION = 5000;    // how long an ad stays on screen (ms), shown by the countdown
  var FADE = 700;         // fade in / fade out time (ms)
  /* ===================== */

  var css = [
    ".soma-ad-overlay{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px;",
    "background:rgba(10,14,30,.38);opacity:0;transition:opacity " + FADE + "ms ease-in-out}",
    ".soma-ad-overlay.is-open{opacity:1}",
    ".soma-ad-card{--soma-ad-radius:22px;position:relative;max-width:100%;max-height:100%;border-radius:var(--soma-ad-radius);overflow:hidden;",
    "background:#fff;box-shadow:0 18px 50px rgba(0,0,0,.45);opacity:0;transform:scale(.95);",
    "transition:opacity " + FADE + "ms ease-in-out,transform " + FADE + "ms ease-in-out}",
    ".soma-ad-overlay.is-open .soma-ad-card{opacity:1;transform:scale(1)}",
    ".soma-ad-card a{display:block;line-height:0}",
    ".soma-ad-card img{display:block;width:auto;height:auto;max-width:min(92vw,720px);max-height:min(78vh,720px)}",
    ".soma-ad-count{position:absolute;top:10px;right:10px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.92);",
    "color:#1b1f2a;font:700 15px/34px system-ui,sans-serif;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.3);pointer-events:none}",
    ".soma-ad-count svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}",
    ".soma-ad-count circle{fill:none;stroke-width:3}",
    ".soma-ad-count .track{stroke:rgba(0,0,0,.12)}",
    ".soma-ad-count .bar{stroke:#f97316;stroke-linecap:round;stroke-dasharray:94.25;stroke-dashoffset:0;animation:soma-ad-ring linear forwards}",
    ".soma-ad-count span{position:relative}",
    "@keyframes soma-ad-ring{to{stroke-dashoffset:94.25}}",
    ".soma-ad-tag{position:absolute;top:10px;left:10px;padding:2px 8px;border-radius:999px;background:rgba(0,0,0,.55);color:#fff;",
    "font:600 11px/18px system-ui,sans-serif;letter-spacing:.04em;pointer-events:none}",
    "@media (prefers-reduced-motion:reduce){.soma-ad-overlay,.soma-ad-card{transition:none}.soma-ad-count .bar{animation:none}}"
  ].join("");

  var timer = 0, hideTimer = 0, countTimer = 0, overlay = null, bag = [], last = -1, pending = null;

  function signedIn() {
    return document.body.classList.contains("soma-authenticated") ||
           document.documentElement.classList.contains("soma-auth-pending");
  }

  function blocked() {
    return document.hidden || signedIn() ||
           document.body.classList.contains("modal-open") ||
           document.body.classList.contains("soma-account-open");
  }

  function nextIndex() {
    if (!bag.length) {
      bag = ADS.map(function (_, i) { return i; });
      for (var i = bag.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = bag[i]; bag[i] = bag[j]; bag[j] = t;
      }
      if (bag.length > 1 && bag[bag.length - 1] === last) bag.unshift(bag.pop());
    }
    return bag.pop();
  }

  function preload() {
    if (signedIn() || !ADS.length) { pending = null; return; }
    var idx = nextIndex(), img = new Image();
    img.src = ADS[idx].src;
    pending = { index: idx, img: img };
  }

  function schedule() {
    window.clearTimeout(timer);
    preload();
    timer = window.setTimeout(attempt, INTERVAL);
  }

  function attempt() {
    var p = pending;
    if (blocked() || !p || !p.img.complete || !p.img.naturalWidth) { schedule(); return; }
    last = p.index;
    show(ADS[p.index], p.img);
  }

  function show(ad, img) {
    overlay = document.createElement("div");
    overlay.className = "soma-ad-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Advertisement");

    var card = document.createElement("div");
    card.className = "soma-ad-card";

    var pic = document.createElement("img");
    pic.src = img.src;
    pic.alt = ad.alt || "Advertisement";
    pic.decoding = "async";

    if (ad.href) {
      var link = document.createElement("a");
      link.href = ad.href;
      link.target = "_blank";
      link.rel = "sponsored noopener";
      link.appendChild(pic);
      card.appendChild(link);
    } else {
      card.appendChild(pic);
    }

    var tag = document.createElement("span");
    tag.className = "soma-ad-tag";
    tag.textContent = "Ad";

    var count = document.createElement("div");
    count.className = "soma-ad-count";
    count.setAttribute("role", "timer");
    count.setAttribute("aria-label", "Ad closing soon");
    count.innerHTML = '<svg viewBox="0 0 34 34" aria-hidden="true"><circle class="track" cx="17" cy="17" r="15"/>' +
      '<circle class="bar" cx="17" cy="17" r="15" style="animation-duration:' + DURATION + 'ms"/></svg><span></span>';
    var num = count.querySelector("span");
    var endAt = Date.now() + DURATION;
    function tick() { num.textContent = Math.max(1, Math.ceil((endAt - Date.now()) / 1000)); }
    tick();
    countTimer = window.setInterval(tick, 200);

    card.appendChild(tag);
    card.appendChild(count);
    overlay.appendChild(card);
    overlay.addEventListener("click", function (event) { if (event.target === overlay) hide(); });
    document.body.appendChild(overlay);

    // Two frames so the browser registers the hidden state first, which makes the fade-in smooth.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        if (overlay) overlay.classList.add("is-open");
      });
    });
    hideTimer = window.setTimeout(hide, DURATION);
  }

  function hide() {
    window.clearTimeout(hideTimer);
    window.clearInterval(countTimer);
    if (!overlay) return;
    var node = overlay;
    overlay = null;
    node.classList.remove("is-open");
    window.setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
      schedule();
    }, FADE + 50);
  }

  function init() {
    if (!ADS.length) return;
    var style = document.createElement("style");
    style.id = "somaAdsStyle";
    style.textContent = css;
    document.head.appendChild(style);

    schedule();

    // Close an ad that is showing the moment the visitor signs in.
    new MutationObserver(function () { if (overlay && signedIn()) hide(); })
      .observe(document.body, { attributes: true, attributeFilter: ["class"] });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && overlay) hide();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());