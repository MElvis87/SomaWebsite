(function () {
  "use strict";

  var STORAGE_KEY = "somaAccountSettings";
  var DEFAULT_AVATAR = "https://i.pravatar.cc/150?img=12";
  var DEFAULT_COLOR = "#2563eb";
  var SWATCHES = ["#2563eb", "#0f766e", "#7c3aed", "#e11d48", "#f59e0b", "#0891b2"];
  var modal;
  var lastFocus;
  var avatarData = "";

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

  function loadSettings() {
    return safeParse(window.localStorage && window.localStorage.getItem(STORAGE_KEY));
  }

  function saveSettings(settings) {
    if (!window.localStorage) return false;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      return false;
    }
  }

  function profileImages() {
    return Array.prototype.slice.call(document.querySelectorAll(".profile-dropdown img"));
  }

  function applyThemeColor(color) {
    color = color || DEFAULT_COLOR;
    document.documentElement.style.setProperty("--primary", color);
    document.documentElement.style.setProperty("--soma-blue", color);
    document.documentElement.style.setProperty("--soma-account-accent", color);
  }

  function applySettings(settings) {
    applyThemeColor(settings.themeColor || DEFAULT_COLOR);

    profileImages().forEach(function (image) {
      image.src = settings.avatar || DEFAULT_AVATAR;
      image.alt = settings.displayName ? settings.displayName + " profile" : "Profile";
    });

    Array.prototype.slice.call(document.querySelectorAll("#profileDropdown")).forEach(function (trigger) {
      trigger.setAttribute("aria-label", settings.displayName ? settings.displayName + " account menu" : "Account menu");
    });
  }

  function icon(className) {
    var i = document.createElement("i");
    i.className = className;
    i.setAttribute("aria-hidden", "true");
    return i;
  }

  function createSwatch(color, selectedColor) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "soma-account-swatch" + (color.toLowerCase() === selectedColor.toLowerCase() ? " is-selected" : "");
    button.style.setProperty("--swatch", color);
    button.setAttribute("data-soma-account-color", color);
    button.setAttribute("aria-label", "Use " + color + " as theme colour");
    return button;
  }

  function createModal() {
    if (modal) return modal;

    var settings = loadSettings();
    var selectedColor = settings.themeColor || DEFAULT_COLOR;
    avatarData = settings.avatar || "";

    modal = document.createElement("div");
    modal.className = "soma-account-modal";
    modal.id = "somaAccountModal";
    modal.hidden = true;

    var backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "soma-account-backdrop";
    backdrop.setAttribute("data-soma-account-close", "true");
    backdrop.setAttribute("aria-label", "Close account settings");

    var panel = document.createElement("form");
    panel.className = "soma-account-panel";
    panel.id = "somaAccountForm";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "somaAccountTitle");

    var header = document.createElement("div");
    header.className = "soma-account-header";

    var headingWrap = document.createElement("div");
    var title = document.createElement("h3");
    title.className = "soma-account-title";
    title.id = "somaAccountTitle";
    title.textContent = "Account settings";
    var subtitle = document.createElement("p");
    subtitle.className = "soma-account-subtitle";
    subtitle.textContent = "Adjust your learning profile and site preferences.";
    headingWrap.appendChild(title);
    headingWrap.appendChild(subtitle);

    var close = document.createElement("button");
    close.type = "button";
    close.className = "soma-account-close";
    close.setAttribute("data-soma-account-close", "true");
    close.setAttribute("aria-label", "Close account settings");
    close.textContent = "X";

    header.appendChild(headingWrap);
    header.appendChild(close);

    var body = document.createElement("div");
    body.className = "soma-account-body";

    var avatarRow = document.createElement("div");
    avatarRow.className = "soma-account-avatar-row";

    var avatarPreview = document.createElement("div");
    avatarPreview.className = "soma-account-avatar-preview";
    var avatarImage = document.createElement("img");
    avatarImage.id = "somaAccountAvatarPreview";
    avatarImage.src = settings.avatar || DEFAULT_AVATAR;
    avatarImage.alt = "Profile preview";
    avatarPreview.appendChild(avatarImage);

    var avatarText = document.createElement("div");
    var upload = document.createElement("label");
    upload.className = "soma-account-upload";
    upload.htmlFor = "somaAccountAvatar";
    upload.appendChild(icon("fas fa-camera"));
    upload.appendChild(document.createTextNode("Change profile picture"));
    var file = document.createElement("input");
    file.type = "file";
    file.id = "somaAccountAvatar";
    file.accept = "image/*";
    file.hidden = true;
    var hint = document.createElement("p");
    hint.className = "soma-account-hint";
    hint.textContent = "Use a small square image for the cleanest result.";
    avatarText.appendChild(upload);
    avatarText.appendChild(file);
    avatarText.appendChild(hint);

    avatarRow.appendChild(avatarPreview);
    avatarRow.appendChild(avatarText);
    body.appendChild(avatarRow);

    var nameField = document.createElement("label");
    nameField.className = "soma-account-field";
    var nameLabel = document.createElement("span");
    nameLabel.className = "soma-account-label";
    nameLabel.textContent = "Display name";
    var nameInput = document.createElement("input");
    nameInput.className = "soma-account-input";
    nameInput.id = "somaAccountName";
    nameInput.type = "text";
    nameInput.maxLength = 48;
    nameInput.placeholder = "Soma learner";
    nameInput.value = settings.displayName || "";
    nameField.appendChild(nameLabel);
    nameField.appendChild(nameInput);
    body.appendChild(nameField);

    var colorField = document.createElement("div");
    colorField.className = "soma-account-field";
    var colorLabel = document.createElement("span");
    colorLabel.className = "soma-account-label";
    colorLabel.textContent = "Theme colour";
    var colors = document.createElement("div");
    colors.className = "soma-account-colors";
    SWATCHES.forEach(function (color) {
      colors.appendChild(createSwatch(color, selectedColor));
    });
    var colorInput = document.createElement("input");
    colorInput.className = "soma-account-color-input";
    colorInput.id = "somaAccountColor";
    colorInput.type = "color";
    colorInput.value = selectedColor;
    colorInput.setAttribute("aria-label", "Custom theme colour");
    colors.appendChild(colorInput);
    colorField.appendChild(colorLabel);
    colorField.appendChild(colors);
    body.appendChild(colorField);

    var actions = document.createElement("div");
    actions.className = "soma-account-actions";
    var deactivate = document.createElement("button");
    deactivate.type = "button";
    deactivate.className = "soma-account-deactivate";
    deactivate.id = "somaAccountDeactivate";
    deactivate.appendChild(icon("fas fa-user-slash"));
    deactivate.appendChild(document.createTextNode("Deactivate account"));
    var save = document.createElement("button");
    save.type = "submit";
    save.className = "soma-account-save";
    save.appendChild(icon("fas fa-check"));
    save.appendChild(document.createTextNode("Save settings"));
    actions.appendChild(deactivate);
    actions.appendChild(save);

    var status = document.createElement("p");
    status.className = "soma-account-status";
    status.id = "somaAccountStatus";
    status.setAttribute("aria-live", "polite");

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(actions);
    panel.appendChild(status);
    modal.appendChild(backdrop);
    modal.appendChild(panel);
    document.body.appendChild(modal);

    bindModalEvents(modal);
    return modal;
  }

  function selectColor(color) {
    var selected = color || DEFAULT_COLOR;
    var colorInput = document.getElementById("somaAccountColor");
    if (colorInput) colorInput.value = selected;

    Array.prototype.slice.call(document.querySelectorAll(".soma-account-swatch")).forEach(function (swatch) {
      swatch.classList.toggle("is-selected", swatch.getAttribute("data-soma-account-color").toLowerCase() === selected.toLowerCase());
    });

    applyThemeColor(selected);
  }

  function setStatus(message) {
    var status = document.getElementById("somaAccountStatus");
    if (status) status.textContent = message || "";
  }

  function openModal(event) {
    if (event) event.preventDefault();
    var dialog = createModal();
    lastFocus = document.activeElement;
    dialog.hidden = false;
    window.requestAnimationFrame(function () {
      dialog.classList.add("is-open");
      document.body.classList.add("soma-account-open");
      var nameInput = document.getElementById("somaAccountName");
      if (nameInput) nameInput.focus();
    });

    if (window.bootstrap && window.bootstrap.Dropdown) {
      var profileToggle = document.getElementById("profileDropdown");
      if (profileToggle) {
        window.bootstrap.Dropdown.getOrCreateInstance(profileToggle).hide();
      }
    }
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove("is-open");
    document.body.classList.remove("soma-account-open");
    window.setTimeout(function () {
      if (!modal.classList.contains("is-open")) modal.hidden = true;
    }, 220);
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function bindModalEvents(dialog) {
    dialog.addEventListener("click", function (event) {
      if (event.target.closest("[data-soma-account-close]")) {
        closeModal();
      }

      var swatch = event.target.closest("[data-soma-account-color]");
      if (swatch) {
        selectColor(swatch.getAttribute("data-soma-account-color"));
      }
    });

    dialog.addEventListener("change", function (event) {
      if (event.target.id === "somaAccountColor") {
        selectColor(event.target.value);
      }

      if (event.target.id === "somaAccountAvatar" && event.target.files && event.target.files[0]) {
        var reader = new FileReader();
        reader.onload = function () {
          avatarData = String(reader.result || "");
          var preview = document.getElementById("somaAccountAvatarPreview");
          if (preview) preview.src = avatarData;
        };
        reader.readAsDataURL(event.target.files[0]);
      }
    });

    dialog.addEventListener("submit", function (event) {
      event.preventDefault();
      var settings = {
        displayName:(document.getElementById("somaAccountName").value || "").trim(),
        themeColor:document.getElementById("somaAccountColor").value || DEFAULT_COLOR,
        avatar:avatarData || loadSettings().avatar || DEFAULT_AVATAR
      };
      var saved = saveSettings(settings);
      applySettings(settings);
      setStatus(saved ? "Settings saved on this device." : "Settings applied, but this browser could not store them.");
    });

    var deactivate = dialog.querySelector("#somaAccountDeactivate");
    if (deactivate) {
      deactivate.addEventListener("click", function () {
        setStatus("Deactivate account is ready to connect to your account backend.");
      });
    }
  }

  function bindAccountTriggers() {
    Array.prototype.slice.call(document.querySelectorAll(".profile-dropdown .dropdown-item")).forEach(function (item) {
      if (!/\bAccount\b/i.test(item.textContent || "")) return;
      if (item.getAttribute("data-soma-account-trigger") === "true") return;
      item.setAttribute("data-soma-account-trigger", "true");
      item.addEventListener("click", openModal);
    });
  }

  ready(function () {
    applySettings(loadSettings());
    bindAccountTriggers();

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeModal();
    });
  });
}());
