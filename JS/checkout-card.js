// checkout-card.js
// Card formatting, brand detection, Luhn, icons, CVV/expiry helpers
(function () {
  if (!window.NovaCart) window.NovaCart = {};
  if (window.NovaCart._checkoutCardInit) return;
  window.NovaCart._checkoutCardInit = true;

  const STORAGE_KEY = "novacart_checkout_storage"; // <--- same storage key
  const ICON_PATH = "Images/Icons/";
  const ICONS = {
    visa: ICON_PATH + "visa.png",
    mastercard: ICON_PATH + "mastercard.png",
    verve: ICON_PATH + "verve.png",
    amex: ICON_PATH + "amex.jpeg",
    invalid: ICON_PATH + "invalid-card.png",
  };

  const cardEl = document.getElementById("cardNum");
  const expiryEl = document.getElementById("expiry");
  const cvvEl = document.getElementById("CVV");
  const saveCardCheckbox = document.getElementById("check"); // your checkbox

  function onlyDigits(s) {
    return String(s || "").replace(/\D/g, "");
  }
  function createMsg(el) {
    if (!el) return null;
    let msg = el.parentNode.querySelector(".field-message");
    if (!msg) {
      msg = document.createElement("div");
      msg.className = "field-message";
      msg.style.color = "#d93025";
      msg.style.fontSize = "12px";
      msg.style.marginTop = "6px";
      el.parentNode.appendChild(msg);
    }
    return msg;
  }
  function setError(el, text) {
    if (!el) return;
    el.classList.add("invalid");
    const m = createMsg(el);
    if (m) m.textContent = text || "";
  }
  function clearError(el) {
    if (!el) return;
    el.classList.remove("invalid");
    const m = createMsg(el);
    if (m) m.textContent = "";
  }

  (function injectStyles() {
    const id = "card-icons-validate-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      .invalid { border-color: #d93025 !important; box-shadow: 0 0 0 3px rgba(217,48,37,0.06) !important; }
      .field-message { color: #d93025; font-size: 12px; margin-top: 6px; }
      .card-icons-multi { display:flex; justify-content:center; margin-top:10px; gap:16px; }
      .card-icons-multi .card-icon { width:3.8rem; height:auto; object-fit:contain; transition: opacity .22s ease; opacity:1; border-radius: 1.05rem;}
      .card-icons-multi .faint { opacity:0.4 !important; }
      .card-icons-multi .active { opacity:1 !important; transform:translateY(-2px); }
      .saved-card-note { font-size:13px; color:#222; margin-top:8px; text-align:center; }
      .saved-card-note small { color:#666; display:block; font-size:12px; }
    `;
    document.head.appendChild(s);
  })();

  function detectBrand(num) {
    const d = onlyDigits(num);
    if (/^3[47]/.test(d)) return "amex";
    if (/^4/.test(d)) return "visa";
    if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return "mastercard";
    if (/^(6011|65|64[4-9])/.test(d)) return "discover";
    if (/^(5061|5078|6500|6504|6505|6506|6507|6508|6509)/.test(d))
      return "verve";
    return "invalid";
  }

  function luhn(num) {
    const s = onlyDigits(num);
    if (!s) return false;
    let sum = 0;
    let toggle = false;
    for (let i = s.length - 1; i >= 0; i--) {
      let n = parseInt(s[i], 10);
      if (toggle) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      toggle = !toggle;
    }
    return sum % 10 === 0;
  }

  function formatCardDisplay(digits, brand) {
    const d = onlyDigits(digits);
    if (!d) return "";
    if (brand === "amex") {
      const p1 = d.slice(0, 4),
        p2 = d.slice(4, 10),
        p3 = d.slice(10, 15);
      return [p1, p2, p3].filter(Boolean).join("-");
    } else {
      const parts = [];
      for (let i = 0; i < d.length; i += 4) parts.push(d.slice(i, i + 4));
      return parts.join("-");
    }
  }
  function maxDigitsForBrand(brand) {
    return brand === "amex" ? 15 : 16;
  }

  function formatExpiry(v) {
    const d = onlyDigits(v).slice(0, 4);
    if (d.length <= 2) return d;
    return d.slice(0, 2) + "/" + d.slice(2);
  }
  function expiryValid(v) {
    if (!v || v.indexOf("/") === -1) return false;
    const [mmS, yyS] = v.split("/");
    if (!mmS || !yyS) return false;
    const mm = parseInt(mmS, 10),
      yy = parseInt(yyS, 10);
    if (isNaN(mm) || isNaN(yy)) return false;
    if (mm < 1 || mm > 12) return false;
    const fullYear = yy < 100 ? 2000 + yy : yy;
    const last = new Date(fullYear, mm, 0, 23, 59, 59, 999);
    return last >= new Date();
  }
  function requiredCvvLen(brand) {
    return brand === "amex" ? 4 : 3;
  }

  // icons row
  let logoWrapper = document.querySelector(".card-logo-wrapper");
  if (!logoWrapper) {
    logoWrapper = document.createElement("div");
    logoWrapper.className = "card-logo-wrapper card-icons-multi";
    const brands = ["visa", "mastercard", "verve", "amex", "invalid"];
    brands.forEach((br) => {
      const img = document.createElement("img");
      img.className = "card-icon";
      img.dataset.brand = br;
      img.alt = br + " logo";
      img.src = ICONS[br] || ICONS.invalid;
      logoWrapper.appendChild(img);
    });

    if (cvvEl && cvvEl.parentNode && cvvEl.parentNode.parentNode) {
      const parent = cvvEl.parentNode;
      if (parent.nextSibling)
        parent.parentNode.insertBefore(logoWrapper, parent.nextSibling);
      else parent.parentNode.appendChild(logoWrapper);
    } else if (cvvEl && cvvEl.parentNode) {
      cvvEl.parentNode.appendChild(logoWrapper);
    } else if (cardEl && cardEl.parentNode) {
      cardEl.parentNode.insertBefore(logoWrapper, cardEl.nextSibling);
    } else {
      document.body.appendChild(logoWrapper);
    }
  }
  const iconImages = document.querySelectorAll(".card-icons-multi .card-icon");
  function normalizeBrandForIcons(b) {
    if (!b) return "invalid";
    if (Object.prototype.hasOwnProperty.call(ICONS, b) && b !== "discover")
      return b;
    return "invalid";
  }
  function updateIcons(detectedBrand) {
    if (detectedBrand === "all") {
      iconImages.forEach((icon) => {
        icon.classList.remove("faint");
        icon.classList.add("active");
      });
      return;
    }
    const normalized = normalizeBrandForIcons(detectedBrand);
    iconImages.forEach((icon) => {
      const br = icon.dataset.brand;
      icon.classList.remove("active", "faint");
      if (normalized === "invalid") {
        if (br === "invalid") icon.classList.add("active");
        else icon.classList.add("faint");
      } else {
        if (br === normalized) icon.classList.add("active");
        else icon.classList.add("faint");
      }
    });
  }
  updateIcons("all");

  // saved-card note (small UI below card inputs)
  let savedCardNoteEl = document.querySelector(".saved-card-note");
  if (!savedCardNoteEl) {
    savedCardNoteEl = document.createElement("div");
    savedCardNoteEl.className = "saved-card-note";
    // Insert after logoWrapper (so it's below logos)
    if (logoWrapper && logoWrapper.parentNode) {
      logoWrapper.parentNode.insertBefore(
        savedCardNoteEl,
        logoWrapper.nextSibling
      );
    } else if (cvvEl && cvvEl.parentNode) {
      cvvEl.parentNode.appendChild(savedCardNoteEl);
    } else {
      document.body.appendChild(savedCardNoteEl);
    }
  }

  function showSavedCardNote(text) {
    if (!savedCardNoteEl) return;
    if (!text) {
      savedCardNoteEl.innerHTML = "";
      return;
    }
    savedCardNoteEl.innerHTML = `<strong>Saved card:</strong> ${text} <small>(saved)</small>`;
  }

  // input handlers for formatting and clearing errors
  if (cardEl) {
    cardEl.addEventListener("input", () => {
      const digits = onlyDigits(cardEl.value);
      const brand = detectBrand(digits);
      const normalized = normalizeBrandForIcons(brand);
      const max = maxDigitsForBrand(
        normalized === "invalid" ? brand : normalized
      );
      const trimmed = digits.slice(0, max);
      cardEl.value = formatCardDisplay(
        trimmed,
        normalized === "invalid" ? brand : normalized
      );

      if (digits.length === 0) updateIcons("all");
      else if (normalized === "invalid") updateIcons("invalid");
      else updateIcons(normalized);

      if (cvvEl)
        cvvEl.maxLength = requiredCvvLen(
          normalized === "invalid" ? brand : normalized
        );
      clearError(cardEl);
    });
    cardEl.addEventListener("blur", () => {
      const digits = onlyDigits(cardEl.value);
      if (digits.length < 13) setError(cardEl, "Card number is too short.");
      else {
        if (!luhn(digits)) setError(cardEl, "Card number failed validation.");
        else clearError(cardEl);
      }
    });
  }

  if (expiryEl) {
    expiryEl.addEventListener("input", () => {
      expiryEl.value = formatExpiry(expiryEl.value);
      clearError(expiryEl);
    });
    expiryEl.addEventListener("blur", () => {
      if (!expiryValid(expiryEl.value))
        setError(expiryEl, "Invalid expiry (MM/YY).");
      else clearError(expiryEl);
    });
  }

  if (cvvEl) {
    cvvEl.addEventListener("input", () => {
      cvvEl.value = onlyDigits(cvvEl.value).slice(0, 4);
      clearError(cvvEl);
    });
    cvvEl.addEventListener("blur", () => {
      const brand = detectBrand(onlyDigits(cardEl ? cardEl.value : ""));
      const normalized = normalizeBrandForIcons(brand);
      const req = requiredCvvLen(normalized === "invalid" ? brand : normalized);
      if (onlyDigits(cvvEl.value).length !== req)
        setError(cvvEl, `CVV must be ${req} digits.`);
      else clearError(cvvEl);
    });
  }

  function validatePaymentFields() {
    const problems = [];
    const d = onlyDigits(cardEl ? cardEl.value : "");
    const brand = detectBrand(d);
    const normalized = normalizeBrandForIcons(brand);
    const max = maxDigitsForBrand(
      normalized === "invalid" ? brand : normalized
    );
    if (!d || d.length < 13)
      problems.push({ el: cardEl, msg: "Card number is too short." });
    else if (d.length > max)
      problems.push({ el: cardEl, msg: "Card number is too long." });
    else if (!luhn(d))
      problems.push({ el: cardEl, msg: "Card number failed validation." });

    if (!expiryEl || !expiryValid(expiryEl.value))
      problems.push({ el: expiryEl, msg: "Invalid expiry (MM/YY)." });

    if (cvvEl) {
      const req = requiredCvvLen(normalized === "invalid" ? brand : normalized);
      const cv = onlyDigits(cvvEl.value);
      if (cv.length !== req)
        problems.push({ el: cvvEl, msg: `CVV must be ${req} digits.` });
    }

    return problems;
  }

  // ----------------------------
  // Save card functionality (no CVV saved)
  // ----------------------------
  function maskCardNumber(numStr) {
    const d = onlyDigits(numStr);
    if (!d) return "";
    // format as 4-4-4-4 (or other if amex)
    if (d.length === 15) {
      // amex 4-6-5
      return `${"****"}-${"****"}-${d.slice(-5)}`; // simple mask for amex
    }
    // for 16-digit: mask first 12
    const last4 = d.slice(-4);
    return `****-****-****-${last4}`;
  }

  function saveCardToStorage() {
    try {
      const store = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      // only save if checkbox checked and card looks valid
      if (saveCardCheckbox && saveCardCheckbox.checked) {
        // do a light validation before saving
        const d = onlyDigits(cardEl ? cardEl.value : "");
        if (!d) return;
        const brand = detectBrand(d);
        // save masked number + expiry + brand (no CVV)
        store.savedCard = {
          maskedNumber: maskCardNumber(d),
          expiry: expiryEl ? expiryEl.value : "",
          brand: brand,
        };
      } else {
        // remove savedCard if any
        if (store.savedCard) delete store.savedCard;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      syncSavedCardNote();
    } catch (e) {
      // silent fail
    }
  }

  function syncSavedCardNote() {
    try {
      const store = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      if (store.savedCard && store.savedCard.maskedNumber) {
        showSavedCardNote(store.savedCard.maskedNumber);
        // also check the checkbox in UI to reflect saved state
        if (saveCardCheckbox) saveCardCheckbox.checked = true;
      } else {
        showSavedCardNote("");
        if (saveCardCheckbox) saveCardCheckbox.checked = false;
      }
    } catch (e) {
      // ignore
    }
  }

  // call save on checkbox change
  if (saveCardCheckbox) {
    saveCardCheckbox.addEventListener("change", () => {
      // if user checks it, try saving; if unchecks, remove saved card
      saveCardToStorage();
    });
  }

  // load saved card on init
  function loadSavedCardFromStorage() {
    try {
      const store = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      if (store.savedCard && store.savedCard.maskedNumber) {
        showSavedCardNote(store.savedCard.maskedNumber);
        if (saveCardCheckbox) saveCardCheckbox.checked = true;
      }
    } catch (e) {
      // ignore
    }
  }

  // expose API
  window.NovaCart.payment = {
    validatePayment: validatePaymentFields,
    isCardValid: function () {
      const d = onlyDigits(cardEl ? cardEl.value : "");
      const brand = detectBrand(d);
      const normalized = normalizeBrandForIcons(brand);
      const max = maxDigitsForBrand(
        normalized === "invalid" ? brand : normalized
      );
      return d.length >= 13 && d.length <= max && luhn(d);
    },
    saveCardToStorage, // exposed so other scripts can call on final submit
    loadSavedCardFromStorage,
    clearSavedCardFromStorage: function () {
      try {
        const store = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        if (store.savedCard) delete store.savedCard;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        syncSavedCardNote();
      } catch (e) {}
    },
  };

  // init saved card note
  document.addEventListener("DOMContentLoaded", function () {
    loadSavedCardFromStorage();
  });

  console.log("checkout-card.js loaded");
})();
