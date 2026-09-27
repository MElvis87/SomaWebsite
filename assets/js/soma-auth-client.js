(function () {
  "use strict";

  var TOKEN_KEY = "somaAuthToken";
  var SETTINGS_KEY = "somaAccountSettings";
  var DEFAULT_THEME_COLOR = "#0a2463";
  var DEFAULT_AVATAR = "https://i.pravatar.cc/150?img=12";
  var API_BASE = window.location.protocol === "file:" ? "http://localhost:3000" : "";
  var state = {
    user: null,
    token: window.localStorage ? window.localStorage.getItem(TOKEN_KEY) || "" : ""
  };

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function safeParse(value) {
    try {
      return value ? JSON.parse(value) : {};
    } catch (error) {
      return {};
    }
  }

  function storeToken(token) {
    state.token = token || "";
    if (!window.localStorage) return;
    if (state.token) {
      window.localStorage.setItem(TOKEN_KEY, state.token);
      return;
    }
    window.localStorage.removeItem(TOKEN_KEY);
  }

  function storeSettings(settings) {
    if (!window.localStorage) return;
    if (settings) {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return;
    }
    window.localStorage.removeItem(SETTINGS_KEY);
  }

  function setThemeColor(color) {
    var selected = color || DEFAULT_THEME_COLOR;
    document.documentElement.style.setProperty("--primary", selected);
    document.documentElement.style.setProperty("--soma-blue", selected);
    document.documentElement.style.setProperty("--soma-account-accent", selected);
    if (document.body) {
      document.body.style.setProperty("--primary", selected);
      document.body.style.setProperty("--soma-blue", selected);
      document.body.style.setProperty("--soma-account-accent", selected);
    }
  }

  function profileImages() {
    return Array.prototype.slice.call(document.querySelectorAll(".profile-dropdown img"));
  }

  function applySettings(settings) {
    var safe = settings || {};
    setThemeColor(safe.themeColor || DEFAULT_THEME_COLOR);

    profileImages().forEach(function (image) {
      image.src = safe.avatar || DEFAULT_AVATAR;
      image.alt = safe.displayName ? safe.displayName + " profile" : "Profile";
    });

    Array.prototype.slice.call(document.querySelectorAll("#profileDropdown")).forEach(function (trigger) {
      trigger.setAttribute("aria-label", safe.displayName ? safe.displayName + " account menu" : "Account menu");
    });

    if (state.user) {
      storeSettings(safe);
    }
  }

  function signInUrl() {
    if (/signinup\.html$/i.test(window.location.pathname)) return "signinup.html";
    var next = window.location.pathname.split("/").pop() || "index.html";
    if (window.location.search) next += window.location.search;
    return "signinup.html?next=" + encodeURIComponent(next);
  }

  function ensureSignInLink() {
    if (/signinup\.html$/i.test(window.location.pathname)) return;
    if (document.querySelector(".soma-login-link")) return;
    var controls = document.querySelector(".navbar .d-flex.align-items-center.flex-wrap");
    if (!controls) return;

    var link = document.createElement("a");
    link.className = "soma-login-link";
    link.href = signInUrl();
    link.innerHTML = '<i class="fas fa-sign-in-alt" aria-hidden="true"></i><span>Sign in</span>';
    controls.appendChild(link);
  }

  function setProfileVisibility(isVisible) {
    document.querySelectorAll(".profile-dropdown").forEach(function (profile) {
      profile.style.setProperty("display", isVisible ? "block" : "none", "important");
      profile.setAttribute("aria-hidden", isVisible ? "false" : "true");
    });
  }

  function removeSignInLink() {
    Array.prototype.slice.call(document.querySelectorAll(".soma-login-link")).forEach(function (link) {
      link.remove();
    });
  }

  function applyGuestState() {
    state.user = null;
    document.body.classList.remove("soma-authenticated");
    document.body.classList.add("soma-auth-guest");
    setThemeColor(DEFAULT_THEME_COLOR);
    setProfileVisibility(false);
    ensureSignInLink();
  }

  function applyUserState(user) {
    state.user = user || null;
    document.body.classList.toggle("soma-authenticated", Boolean(user));
    document.body.classList.toggle("soma-auth-guest", !user);

    if (!user) {
      applyGuestState();
      return;
    }

    removeSignInLink();
    setProfileVisibility(true);
    applySettings(user.settings || {});
  }

  async function apiRequest(path, options) {
    var requestOptions = options || {};
    var headers = Object.assign({ "Content-Type": "application/json" }, requestOptions.headers || {});
    if (state.token) headers.Authorization = "Bearer " + state.token;

    var response = await fetch(API_BASE + path, Object.assign({}, requestOptions, { headers: headers }));
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }
    return data;
  }

  function showAuthFeedback(form, message, type) {
    if (!form) return;
    var feedback = form.querySelector(".soma-auth-feedback");
    if (!feedback) {
      feedback = document.createElement("div");
      feedback.className = "soma-auth-feedback";
      form.insertBefore(feedback, form.firstChild);
    }
    feedback.className = "soma-auth-feedback is-" + (type || "info");
    feedback.textContent = message || "";
  }

  function redirectAfterAuth() {
    var params = new URLSearchParams(window.location.search);
    var next = params.get("next") || "index.html";
    window.location.href = next;
  }

  async function handleSignIn(form) {
    showAuthFeedback(form, "Signing you in...", "info");
    var data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("signInEmail").value,
        password: document.getElementById("signInPassword").value,
        remember: Boolean(document.getElementById("rememberMe") && document.getElementById("rememberMe").checked)
      })
    });
    storeToken(data.token);
    applyUserState(data.user);
    showAuthFeedback(form, "Signed in. Loading your settings...", "success");
    redirectAfterAuth();
  }

  async function handleSignUp(form) {
    var password = document.getElementById("signUpPassword").value;
    var confirm = document.getElementById("confirmPassword").value;
    if (password !== confirm) {
      showAuthFeedback(form, "Passwords do not match.", "error");
      return;
    }

    showAuthFeedback(form, "Creating your premium account...", "info");
    var data = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        email: document.getElementById("signUpEmail").value,
        password: password
      })
    });
    storeToken(data.token);
    applyUserState(data.user);
    showAuthFeedback(form, "Account created. Loading your settings...", "success");
    redirectAfterAuth();
  }

  function accountStatus(message) {
    var status = document.getElementById("somaAccountStatus");
    if (status) status.textContent = message || "";
  }

  function modalSettings() {
    var preview = document.getElementById("somaAccountAvatarPreview");
    return {
      displayName: (document.getElementById("somaAccountName").value || "").trim(),
      themeColor: document.getElementById("somaAccountColor").value || DEFAULT_THEME_COLOR,
      avatar: preview ? preview.src : ""
    };
  }

  async function handleSettingsSave() {
    if (!state.user) {
      accountStatus("Please sign in before saving account settings.");
      return;
    }

    accountStatus("Saving settings...");
    var settings = modalSettings();
    var data = await apiRequest("/api/account/settings", {
      method: "PATCH",
      body: JSON.stringify({ settings: settings })
    });
    applyUserState(data.user);
    accountStatus("Settings saved to your account.");
  }

  function closeAccountModal() {
    var modal = document.getElementById("somaAccountModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.classList.remove("soma-account-open");
    window.setTimeout(function () {
      if (!modal.classList.contains("is-open")) modal.hidden = true;
    }, 220);
  }

  async function handleDeactivate() {
    if (!state.user) {
      accountStatus("Please sign in before deactivating an account.");
      return;
    }
    if (!window.confirm("Deactivate this account? You will be signed out immediately.")) return;

    accountStatus("Deactivating account...");
    await apiRequest("/api/account/deactivate", { method: "POST", body: "{}" });
    storeToken("");
    storeSettings(null);
    closeAccountModal();
    applyGuestState();
  }

  async function handleLogout(event) {
    if (event) event.preventDefault();
    try {
      await apiRequest("/api/auth/logout", { method: "POST", body: "{}" });
    } catch (error) {
      // Clearing local auth is still correct if the server is unreachable.
    }
    storeToken("");
    storeSettings(null);
    applyGuestState();
  }

  function openSettingsFromDropdown(event) {
    var item = event.target.closest(".profile-dropdown .dropdown-item");
    if (!item || !/\bSettings\b/i.test(item.textContent || "")) return false;
    event.preventDefault();
    event.stopImmediatePropagation();

    var account = Array.prototype.slice.call(document.querySelectorAll(".profile-dropdown .dropdown-item")).find(function (candidate) {
      return /\bAccount\b/i.test(candidate.textContent || "");
    });
    if (account) account.click();
    return true;
  }

  function handleDropdownAction(event) {
    if (openSettingsFromDropdown(event)) return;

    var item = event.target.closest(".profile-dropdown .dropdown-item");
    if (!item) return;
    if (/\bLogout\b/i.test(item.textContent || "")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      handleLogout(event);
    }
  }

  function handleSocialAuth(event) {
    var button = event.target.closest(".btn-social");
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var form = button.closest(".auth-form") || document.querySelector(".auth-container");
    showAuthFeedback(form, "Social sign-in is not connected yet. Use email and password for now.", "info");
  }

  function bindEvents() {
    document.addEventListener("submit", function (event) {
      var form = event.target;
      if (!form || !form.id) return;

      if (form.id === "signInFormElement" || form.id === "signUpFormElement" || form.id === "somaAccountForm") {
        event.preventDefault();
        event.stopImmediatePropagation();
      }

      if (form.id === "signInFormElement") {
        handleSignIn(form).catch(function (error) { showAuthFeedback(form, error.message, "error"); });
      }
      if (form.id === "signUpFormElement") {
        handleSignUp(form).catch(function (error) { showAuthFeedback(form, error.message, "error"); });
      }
      if (form.id === "somaAccountForm") {
        handleSettingsSave().catch(function (error) { accountStatus(error.message); });
      }
    }, true);

    document.addEventListener("click", function (event) {
      if (event.target.closest("#somaAccountDeactivate")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        handleDeactivate().catch(function (error) { accountStatus(error.message); });
        return;
      }
      handleDropdownAction(event);
      handleSocialAuth(event);
    }, true);
  }

  async function syncAuthState() {
    if (!state.token) {
      applyGuestState();
      return null;
    }

    try {
      var data = await apiRequest("/api/auth/me");
      if (!data.user) {
        storeToken("");
        applyGuestState();
        return null;
      }
      applyUserState(data.user);
      return data.user;
    } catch (error) {
      applyGuestState();
      return null;
    }
  }

  window.SomaAuth = {
    sync: syncAuthState,
    logout: handleLogout,
    request: apiRequest,
    applySettings: applySettings,
    applyThemeColor: setThemeColor,
    currentUser: function () { return state.user; }
  };

  setThemeColor(DEFAULT_THEME_COLOR);

  ready(function () {
    bindEvents();
    syncAuthState();
  });
}());
