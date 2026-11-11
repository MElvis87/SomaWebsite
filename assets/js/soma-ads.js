/* Soma overlay ads
   - Guests only: ads stop while signed in and resume after sign out.
   - Every INTERVAL ms an ad fades in over a faint overlay.
       Images stay DURATION ms. Videos (.mp4/.webm) autoplay, muted, with no controls, and stay until they end.
   - Each ad keeps its own aspect ratio and is scaled to fit the screen.
   - Ads cannot be dismissed by clicking around them; they close on their own (or when the visitor signs in). */
(function () {
  "use strict";

  /* ===== EDIT HERE ===== */
  var ADS = [
    { src: "assets/ads/ad-1.jpg", alt: "Advertisement", href: "" },   // href: optional link opened in a new tab
    { src: "assets/ads/ad-2.jpg", alt: "Advertisement", href: "" },
    { src: "assets/ads/ad-3.mp4", alt: "Advertisement", href: "" }     // video: plays to the end
  ];
  var INTERVAL = 20000;   // wait between ads (ms), counted from when the last one closed
  var DURATION = 5000;    // how long an IMAGE ad stays on screen (ms)
  var FADE = 700;         // fade in / fade out time (ms)
  /* ===================== */

  var css = [
    ".soma-ad-overlay{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px;",
    "background:rgba(10,14,30,.38);opacity:0;transition:opacity " + FADE + "ms ease-in-out}",
    ".soma-ad-overlay.is-open{opacity:1}",
    ".soma-ad-card{--soma-ad-radius:22px;position:relative;max-width:100%;max-height:100%;border-radius:var(--soma-ad-radius);overflow:hidden;",
    "background:#000;box-shadow:0 18px 50px rgba(0,0,0,.45);opacity:0;transform:scale(.95);",
    "transition:opacity " + FADE + "ms ease-in-out,transform " + FADE + "ms ease-in-out}",
    ".soma-ad-overlay.is-open .soma-ad-card{opacity:1;transform:scale(1)}",
    ".soma-ad-card a{display:block;line-height:0}",
    ".soma-ad-card img,.soma-ad-card video{display:block;width:auto;height:auto;max-width:min(92vw,720px);max-height:min(78vh,720px);pointer-events:none}",
    ".soma-ad-card a img{pointer-events:auto}",
    ".soma-ad-count{position:absolute;top:10px;right:10px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.92);",
    "color:#1b1f2a;font:700 15px/34px system-ui,sans-serif;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.3);pointer-events:none}",
    ".soma-ad-count svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}",
    ".soma-ad-count circle{fill:none;stroke-width:3}",
    ".soma-ad-count .track{stroke:rgba(0,0,0,.12)}",
    ".soma-ad-count .bar{stroke:#f97316;stroke-linecap:round;stroke-dasharray:94.25;stroke-dashoffset:0}",
    ".soma-ad-count .bar.is-timed{animation:soma-ad-ring linear forwards}",
    ".soma-ad-count span{position:relative}",
    "@keyframes soma-ad-ring{to{stroke-dashoffset:94.25}}",
    ".soma-ad-tag{position:absolute;top:10px;left:10px;padding:2px 8px;border-radius:999px;background:rgba(0,0,0,.55);color:#fff;",
    "font:600 11px/18px system-ui,sans-serif;letter-spacing:.04em;pointer-events:none}",
    ".soma-ad-sound{position:absolute;right:10px;bottom:10px;width:34px;height:34px;padding:0;border:0;border-radius:50%;display:flex;",
    "align-items:center;justify-content:center;background:rgba(255,255,255,.92);color:#1b1f2a;cursor:pointer;pointer-events:auto;",
    "box-shadow:0 2px 8px rgba(0,0,0,.3)}",
    ".soma-ad-sound:hover,.soma-ad-sound:focus-visible{background:#fff;outline:2px solid #f97316}",
    "@media (prefers-reduced-motion:reduce){.soma-ad-overlay,.soma-ad-card{transition:none}.soma-ad-count .bar.is-timed{animation:none}}"
  ].join("");

  var ICON_ON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';

  var timer = 0, hideTimer = 0, countTimer = 0, overlay = null, bag = [], last = -1, pending = null;

  function isVideo(ad) { return /\.(mp4|webm|ogv)(\?.*)?$/i.test(ad.src); }

  // Skip heavy video ads when the visitor has Data Saver on or a very slow connection.
  function lowData() {
    var c = navigator.connection;
    return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || "")));
  }

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

  function discard(item) {
    if (item && item.video) {
      item.media.removeAttribute("src");
      item.media.load();
    }
  }

  function preload() {
    discard(pending);
    pending = null;
    if (signedIn() || !ADS.length) return;
    var idx = 0;
    for (var tries = 0; tries < ADS.length; tries++) {
      idx = nextIndex();
      if (!(isVideo(ADS[idx]) && lowData())) break;
    }
    var ad = ADS[idx], media;
    if (isVideo(ad)) {
      if (lowData()) return;
      media = document.createElement("video");
      media.muted = true;
      media.defaultMuted = true;
      media.playsInline = true;
      media.setAttribute("playsinline", "");
      media.controls = false;
      media.disablePictureInPicture = true;
      media.setAttribute("disableremoteplayback", "");
      media.preload = "auto";
      media.src = ad.src;
      media.load();
    } else {
      media = new Image();
      media.src = ad.src;
    }
    pending = { index: idx, media: media, video: isVideo(ad) };
  }

  function schedule() {
    window.clearTimeout(timer);
    preload();
    timer = window.setTimeout(attempt, INTERVAL);
  }

  function ready(p) {
    return p.video ? p.media.readyState >= 3 : (p.media.complete && p.media.naturalWidth > 0);
  }

  function attempt() {
    var p = pending;
    if (blocked() || !p || !ready(p)) { schedule(); return; }
    pending = null;
    last = p.index;
    show(ADS[p.index], p);
  }

  function show(ad, item) {
    var video = item.video;
    var media = item.media;

    overlay = document.createElement("div");
    overlay.className = "soma-ad-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Advertisement");

    var card = document.createElement("div");
    card.className = "soma-ad-card";

    if (!video) {
      media = document.createElement("img");
      media.src = item.media.src;
      media.alt = ad.alt || "Advertisement";
      media.decoding = "async";
    } else {
      media.setAttribute("aria-label", ad.alt || "Advertisement");
    }

    if (ad.href) {
      var link = document.createElement("a");
      link.href = ad.href;
      link.target = "_blank";
      link.rel = "sponsored noopener";
      link.appendChild(media);
      card.appendChild(link);
    } else {
      card.appendChild(media);
    }

    var tag = document.createElement("span");
    tag.className = "soma-ad-tag";
    tag.textContent = "Ad";

    var count = document.createElement("div");
    count.className = "soma-ad-count";
    count.setAttribute("role", "timer");
    count.setAttribute("aria-label", "Ad closing soon");
    count.innerHTML = '<svg viewBox="0 0 34 34" aria-hidden="true"><circle class="track" cx="17" cy="17" r="15"/>' +
      '<circle class="bar" cx="17" cy="17" r="15"/></svg><span></span>';
    var num = count.querySelector("span");
    var bar = count.querySelector(".bar");

    card.appendChild(tag);
    card.appendChild(count);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    var node = overlay;
    function fadeIn() {
      // Two frames so the browser registers the hidden state first, which makes the fade-in smooth.
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          if (overlay === node) node.classList.add("is-open");
        });
      });
    }

    if (video) {
      // The countdown shows the video's remaining seconds, and the ring follows its progress.
      var tick = function () {
        var d = media.duration || 0;
        if (!d || !isFinite(d)) return;
        num.textContent = Math.max(1, Math.ceil(d - media.currentTime));
        bar.style.strokeDashoffset = String(94.25 * Math.min(1, media.currentTime / d));
      };
      tick();
      countTimer = window.setInterval(tick, 200);
      // Single mute / unmute control (video starts muted because browsers block autoplay with sound).
      var sound = document.createElement("button");
      sound.type = "button";
      sound.className = "soma-ad-sound";
      var paint = function () {
        sound.innerHTML = media.muted ? ICON_OFF : ICON_ON;
        sound.setAttribute("aria-label", media.muted ? "Unmute ad" : "Mute ad");
        sound.setAttribute("aria-pressed", String(!media.muted));
      };
      sound.addEventListener("click", function () { media.muted = !media.muted; paint(); });
      paint();
      card.appendChild(sound);

      media.addEventListener("ended", hide);
      media.addEventListener("error", hide);
      // Safety net in case the video never reports that it ended.
      hideTimer = window.setTimeout(hide, ((media.duration && isFinite(media.duration)) ? media.duration * 1000 : 60000) + 3000);

      var started = media.play();
      if (started && started.then) {
        started.then(function () { if (overlay === node) fadeIn(); })
               .catch(function () { if (overlay === node) hide(); });   // autoplay refused: quietly skip
      } else {
        fadeIn();
      }
    } else {
      // Images: the countdown runs for DURATION.
      var endAt = Date.now() + DURATION;
      var tickImg = function () { num.textContent = Math.max(1, Math.ceil((endAt - Date.now()) / 1000)); };
      tickImg();
      countTimer = window.setInterval(tickImg, 200);
      bar.classList.add("is-timed");
      bar.style.animationDuration = DURATION + "ms";
      hideTimer = window.setTimeout(hide, DURATION);
      fadeIn();
    }
  }

  function hide() {
    window.clearTimeout(hideTimer);
    window.clearInterval(countTimer);
    if (!overlay) return;
    var node = overlay;
    overlay = null;
    node.classList.remove("is-open");
    window.setTimeout(function () {
      var v = node.querySelector("video");
      if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
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

    // The only early exit: close an ad that is showing the moment the visitor signs in.
    new MutationObserver(function () { if (overlay && signedIn()) hide(); })
      .observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());