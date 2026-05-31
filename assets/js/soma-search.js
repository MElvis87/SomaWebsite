/* Soma topic finder: VS Code-style search for lesson/topic content. */
(function () {
  "use strict";

  var state = {
    query: "",
    matches: [],
    index: -1,
    scope: null,
    bar: null,
    input: null,
    navInput: null,
    info: null,
    prev: null,
    next: null,
    clear: null,
    legacyForm: null,
    pendingTimer: 0
  };

  var SKIP_SELECTOR = "script, style, noscript, iframe, object, embed, svg, canvas, input, textarea, select, option, .soma-find-bar, .search-navigation, .modal-overlay, .footer";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function escapeHtml(value) {
    var div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  function searchRoot() {
    return document.getElementById("learning-modules") || document.getElementById("topicsAccordion") || document.querySelector("main") || document.body;
  }

  function buildBar() {
    var existing = document.getElementById("searchNavigation");
    var bar = existing || document.createElement("div");
    bar.id = "searchNavigation";
    bar.classList.add("search-navigation", "soma-find-bar");
    bar.setAttribute("role", "search");
    bar.setAttribute("aria-label", "Find in topics");
    bar.style.display = "none";
    bar.innerHTML = [
      '<form class="soma-find-form" id="somaFindForm" autocomplete="off">',
      '  <label class="soma-find-input-wrap" for="somaFindInput">',
      '    <i class="fas fa-search" aria-hidden="true"></i>',
      '    <input class="form-control soma-find-input" id="somaFindInput" type="search" placeholder="Find in topics..." autocomplete="off">',
      '  </label>',
      '  <span class="soma-find-count" id="searchInfo" aria-live="polite">No search</span>',
      '  <div class="soma-find-actions" aria-label="Search result navigation">',
      '    <button class="btn btn-sm btn-outline-primary" type="button" id="prevResult" title="Previous result (Shift+Enter)"><i class="fas fa-chevron-up" aria-hidden="true"></i><span class="visually-hidden">Previous result</span></button>',
      '    <button class="btn btn-sm btn-outline-primary" type="button" id="nextResult" title="Next result (Enter)"><i class="fas fa-chevron-down" aria-hidden="true"></i><span class="visually-hidden">Next result</span></button>',
      '    <button class="btn btn-sm btn-outline-secondary soma-find-close" type="button" id="clearSearch" title="Close finder"><i class="fas fa-times" aria-hidden="true"></i><span class="visually-hidden">Close finder</span></button>',
      '  </div>',
      '</form>'
    ].join("");

    document.body.appendChild(bar);

    state.bar = bar;
    state.input = document.getElementById("somaFindInput");
    state.info = document.getElementById("searchInfo");
    state.prev = document.getElementById("prevResult");
    state.next = document.getElementById("nextResult");
    state.clear = document.getElementById("clearSearch");
    state.legacyForm = document.getElementById("searchForm");
    state.navInput = document.getElementById("searchInput");

    if (state.navInput) {
      state.navInput.setAttribute("placeholder", "Find in topics...");
      state.navInput.setAttribute("autocomplete", "off");
    }
    positionBar();
  }

  function positionBar() {
    if (!state.bar) return;
    var navbar = document.querySelector(".navbar");
    var top = 16;
    if (navbar) {
      var rect = navbar.getBoundingClientRect();
      top = Math.max(8, Math.round(rect.bottom + 8));
    }
    state.bar.style.setProperty("--soma-find-top", top + "px");
  }

  function showBar(focusInput) {
    if (!state.bar) return;
    positionBar();
    state.bar.classList.add("is-active");
    state.bar.style.display = "flex";
    state.bar.style.zIndex = "2147483647";
    if (focusInput && state.input) {
      state.input.focus();
      state.input.select();
    }
  }

  function hideBar() {
    if (!state.bar) return;
    state.bar.classList.remove("is-active");
    state.bar.style.display = "none";
  }

  function syncInputs(value, source) {
    if (source !== state.input && state.input) state.input.value = value;
    if (source !== state.navInput && state.navInput) state.navInput.value = value;
  }

  function clearHighlights() {
    state.matches.forEach(function (match) {
      var span = match.node;
      if (!span || !span.parentNode) return;
      span.parentNode.replaceChild(document.createTextNode(span.textContent), span);
    });
    if (state.scope) state.scope.normalize();
    state.matches = [];
    state.index = -1;
  }

  function shouldSkipTextNode(node) {
    if (!node || !node.nodeValue || !node.nodeValue.trim()) return true;
    var parent = node.parentElement;
    if (!parent) return true;
    return !!parent.closest(SKIP_SELECTOR);
  }

  function textNodesIn(scope) {
    var nodes = [];
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        return shouldSkipTextNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var current;
    while ((current = walker.nextNode())) nodes.push(current);
    return nodes;
  }

  function markNode(node, queryLower) {
    var source = node.nodeValue;
    var sourceLower = source.toLocaleLowerCase();
    var queryLength = queryLower.length;
    var start = 0;
    var found = sourceLower.indexOf(queryLower, start);
    if (found === -1) return;

    var fragment = document.createDocumentFragment();
    while (found !== -1) {
      if (found > start) fragment.appendChild(document.createTextNode(source.slice(start, found)));
      var span = document.createElement("mark");
      span.className = "search-match soma-search-match";
      span.textContent = source.slice(found, found + queryLength);
      fragment.appendChild(span);
      state.matches.push({ node: span });
      start = found + queryLength;
      found = sourceLower.indexOf(queryLower, start);
    }
    if (start < source.length) fragment.appendChild(document.createTextNode(source.slice(start)));
    node.parentNode.replaceChild(fragment, node);
  }

  function performSearch(value, options) {
    var query = (value || "").trim();
    var opts = options || {};
    window.clearTimeout(state.pendingTimer);
    state.scope = searchRoot();
    clearHighlights();
    state.query = query;
    syncInputs(query, opts.source || null);

    if (!query) {
      updateInfo();
      if (!opts.keepOpen) hideBar();
      return;
    }

    showBar(false);
    var queryLower = query.toLocaleLowerCase();
    textNodesIn(state.scope).forEach(function (node) {
      markNode(node, queryLower);
    });

    state.index = state.matches.length ? 0 : -1;
    updateCurrent(true);
    updateInfo();
  }

  function scheduleSearch(value, source) {
    window.clearTimeout(state.pendingTimer);
    state.pendingTimer = window.setTimeout(function () {
      performSearch(value, { source: source, keepOpen: true });
    }, 80);
  }

  function updateInfo() {
    if (!state.info) return;
    if (!state.query) {
      state.info.textContent = "Type to find in topics";
    } else if (!state.matches.length) {
      state.info.innerHTML = 'No results for <strong>"' + escapeHtml(state.query) + '"</strong>';
    } else {
      state.info.innerHTML = '<strong>' + (state.index + 1) + '</strong> of <strong>' + state.matches.length + '</strong> results';
    }
    var disabled = !state.matches.length;
    if (state.prev) state.prev.disabled = disabled;
    if (state.next) state.next.disabled = disabled;
  }

  function ancestorCollapses(element) {
    var collapses = [];
    var cursor = element.parentElement;
    while (cursor) {
      var collapse = cursor.closest(".accordion-collapse");
      if (!collapse) break;
      collapses.unshift(collapse);
      cursor = collapse.parentElement;
    }
    return collapses;
  }

  function showCollapse(collapse) {
    if (!collapse || collapse.classList.contains("show")) return;
    if (window.bootstrap && window.bootstrap.Collapse) {
      window.bootstrap.Collapse.getOrCreateInstance(collapse, { toggle: false }).show();
      return;
    }
    collapse.classList.add("show");
  }

  function updateCurrent(scrollToMatch) {
    state.matches.forEach(function (match, idx) {
      match.node.classList.toggle("current-search-match", idx === state.index);
      if (idx === state.index) {
        match.node.setAttribute("aria-current", "true");
      } else {
        match.node.removeAttribute("aria-current");
      }
    });

    if (!scrollToMatch || state.index < 0) return;
    var current = state.matches[state.index].node;
    ancestorCollapses(current).forEach(showCollapse);
    window.setTimeout(function () {
      current.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }, 180);
  }

  function go(direction) {
    if (!state.matches.length) return;
    state.index = (state.index + direction + state.matches.length) % state.matches.length;
    updateCurrent(true);
    updateInfo();
  }

  function clearSearch(keepOpen) {
    window.clearTimeout(state.pendingTimer);
    clearHighlights();
    state.query = "";
    syncInputs("", null);
    updateInfo();
    if (keepOpen) {
      showBar(true);
    } else {
      hideBar();
    }
  }

  function stop(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
  }

  function bindEvents() {
    if (state.legacyForm) {
      state.legacyForm.addEventListener("submit", function (event) {
        stop(event);
        showBar(false);
        performSearch(state.navInput ? state.navInput.value : "", { source: state.navInput, keepOpen: true });
      }, true);
    }

    if (state.navInput) {
      state.navInput.addEventListener("input", function () {
        showBar(false);
        scheduleSearch(state.navInput.value, state.navInput);
      });
    }

    if (state.input) {
      state.input.addEventListener("input", function () {
        scheduleSearch(state.input.value, state.input);
      });
      state.input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          stop(event);
          if (!state.matches.length) performSearch(state.input.value, { source: state.input, keepOpen: true });
          else go(event.shiftKey ? -1 : 1);
        }
        if (event.key === "Escape") {
          stop(event);
          clearSearch(false);
        }
      }, true);
    }

    if (state.prev) state.prev.addEventListener("click", function (event) { stop(event); go(-1); }, true);
    if (state.next) state.next.addEventListener("click", function (event) { stop(event); go(1); }, true);
    if (state.clear) state.clear.addEventListener("click", function (event) { stop(event); clearSearch(false); }, true);

    window.addEventListener("resize", positionBar);
    document.addEventListener("shown.bs.collapse", positionBar);
    document.addEventListener("hidden.bs.collapse", positionBar);

    document.addEventListener("keydown", function (event) {
      var key = event.key;
      var activeIsFinder = document.activeElement === state.input || document.activeElement === state.navInput;

      if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === "f") {
        stop(event);
        showBar(true);
        return;
      }

      if (activeIsFinder && key === "Enter") {
        stop(event);
        var activeValue = document.activeElement && document.activeElement.value ? document.activeElement.value : "";
        if (activeValue.trim() !== state.query) {
          performSearch(activeValue, { source: document.activeElement, keepOpen: true });
        } else {
          go(event.shiftKey ? -1 : 1);
        }
        return;
      }

      if (key === "F3") {
        stop(event);
        if (!state.query && state.input) performSearch(state.input.value, { source: state.input, keepOpen: true });
        go(event.shiftKey ? -1 : 1);
        return;
      }

      if (activeIsFinder && key === "Escape") {
        stop(event);
        clearSearch(false);
      }
    }, true);
  }

  ready(function () {
    state.scope = searchRoot();
    buildBar();
    bindEvents();
    updateInfo();
    window.SomaSearch = {
      search: function (query) { performSearch(query, { keepOpen: true }); },
      next: function () { go(1); },
      previous: function () { go(-1); },
      clear: function () { clearSearch(false); }
    };
  });
}());
