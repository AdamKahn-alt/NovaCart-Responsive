// checkout-billing.js
// Left-column: billing / shipping helpers and validators
(function () {
  if (!window.NovaCart) window.NovaCart = {};
  if (window.NovaCart._checkoutBillingInit) return;
  window.NovaCart._checkoutBillingInit = true;

  const STORAGE_KEY = "novacart_checkout_storage"; // <--- storage key requested

  const fullNameEl = document.getElementById("fullName");
  const emailEl = document.getElementById("E-mail");
  const phoneEl = document.getElementById("phoneNum");
  const addressEl = document.getElementById("address");
  const cityEl = document.getElementById("city");
  const stateEl = document.getElementById("state");
  const countryEl = document.getElementById("country");

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

  function isEmailValid(v) {
    if (!v) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  // normalize Nigerian phone formatting: convert 08123456789 or 810... to +234 810 234 5678 style
  function normalizeAndFormatPhone(raw) {
    if (!raw) return "";
    let digits = String(raw).replace(/\D/g, "");
    // remove leading 0 if present and add 234
    if (digits.length === 11 && digits[0] === "0")
      digits = "234" + digits.slice(1);
    if (digits.length === 10) digits = "234" + digits; // assume missing leading 0 removed
    if (digits.length === 13 && digits.indexOf("234") === 0) {
      // format +234 810 285 6017 -> split after 3, then 3, then 4, then rest
      const p1 = digits.slice(3, 6);
      const p2 = digits.slice(6, 9);
      const p3 = digits.slice(9, 13);
      return `+234 ${p1} ${p2} ${p3}`;
    }
    // fallback: return raw trimmed
    return raw;
  }

  function validateBillingFields() {
    const problems = [];
    // full name: not empty and at least 2 words (updated)
    const full = fullNameEl ? String(fullNameEl.value || "").trim() : "";
    const words = full ? full.split(/\s+/).filter(Boolean) : [];
    if (!full || words.length < 2)
      problems.push({
        el: fullNameEl,
        msg: "Please enter full name (min 2 words).",
      });

    // email
    const em = emailEl ? String(emailEl.value || "").trim() : "";
    if (!em || !isEmailValid(em))
      problems.push({ el: emailEl, msg: "Enter a valid email address." });

    // phone: not empty; normalize
    const phRaw = phoneEl ? String(phoneEl.value || "").trim() : "";
    const normalized = normalizeAndFormatPhone(phRaw);
    if (!phRaw) problems.push({ el: phoneEl, msg: "Enter phone number." });
    // write back normalized format for UX
    if (phoneEl && normalized) phoneEl.value = normalized;

    // address, city, state, country simple not-empty
    if (!addressEl || !String(addressEl.value || "").trim())
      problems.push({ el: addressEl, msg: "Enter shipping address." });
    if (!cityEl || !String(cityEl.value || "").trim())
      problems.push({ el: cityEl, msg: "Enter city." });
    if (!stateEl || !String(stateEl.value || "").trim())
      problems.push({ el: stateEl, msg: "Enter state." });
    if (!countryEl || !String(countryEl.value || "").trim())
      problems.push({ el: countryEl, msg: "Enter country." });

    return problems;
  }

  // small live handlers to clear errors as user types
  [fullNameEl, emailEl, phoneEl, addressEl, cityEl, stateEl, countryEl].forEach(
    (el) => {
      if (!el) return;
      el.addEventListener("input", () => {
        clearError(el);
        // save left column live as user types
        saveLeftColumnToStorage();
      });
      el.addEventListener("blur", () => {
        // perform lightweight validation on blur for helpful messages
        const problems = validateBillingFields();
        const p = problems.find((x) => x.el === el);
        if (p) setError(el, p.msg);
        else clearError(el);
      });
    }
  );

  function getDeliveryMethod() {
    const std = document.getElementById("type");
    const exp = document.getElementById("type2");
    if (exp && exp.checked) return "express";
    if (std && std.checked) return "standard";
    return "standard";
  }

  // listen for changes to delivery radios to save them
  const dm1 = document.getElementById("type");
  const dm2 = document.getElementById("type2");
  if (dm1) dm1.addEventListener("change", saveLeftColumnToStorage);
  if (dm2) dm2.addEventListener("change", saveLeftColumnToStorage);

  // -------------------------
  // STORAGE: save & load left column only
  // -------------------------
  function saveLeftColumnToStorage() {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      existing.left = {
        billingInfo: {
          fullName: fullNameEl ? fullNameEl.value : "",
          email: emailEl ? emailEl.value : "",
          phone: phoneEl ? phoneEl.value : "",
        },
        shippingInfo: {
          address: addressEl ? addressEl.value : "",
          city: cityEl ? cityEl.value : "",
          state: stateEl ? stateEl.value : "",
          country: countryEl ? countryEl.value : "",
        },
        deliveryMethod: getDeliveryMethod(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      // fail silently; don't break UX
      // console.warn("saveLeftColumnToStorage error", e);
    }
  }

  function loadLeftColumnFromStorage() {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      const left = existing.left;
      if (!left) return;
      if (left.billingInfo) {
        if (fullNameEl) fullNameEl.value = left.billingInfo.fullName || "";
        if (emailEl) emailEl.value = left.billingInfo.email || "";
        if (phoneEl) phoneEl.value = left.billingInfo.phone || "";
      }
      if (left.shippingInfo) {
        if (addressEl) addressEl.value = left.shippingInfo.address || "";
        if (cityEl) cityEl.value = left.shippingInfo.city || "";
        if (stateEl) stateEl.value = left.shippingInfo.state || "";
        if (countryEl) countryEl.value = left.shippingInfo.country || "";
      }
      if (left.deliveryMethod) {
        if (left.deliveryMethod === "express" && dm2) dm2.checked = true;
        else if (dm1) dm1.checked = true;
      }
    } catch (e) {
      // console.warn("loadLeftColumnFromStorage error", e);
    }
  }

  // expose api
  window.NovaCart.billing = {
    validateBilling: validateBillingFields,
    getDeliveryMethod,
    setError, // optional, for coordinator use
    clearError,
    saveLeftColumnToStorage, // exposed so other scripts can call if needed
    loadLeftColumnFromStorage,
  };

  // load saved left column on init
  document.addEventListener("DOMContentLoaded", function () {
    loadLeftColumnFromStorage();
  });

  console.log("checkout-billing.js loaded");
})();
