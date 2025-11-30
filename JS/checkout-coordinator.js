// checkout-coordinator.js
// Centralized submit handler: validates billing + payment + updates totals + clears storage + redirect
(function () {
  if (!window.NovaCart) window.NovaCart = {};
  if (window.NovaCart._checkoutCoordinatorInit) return;
  window.NovaCart._checkoutCoordinatorInit = true;

  const form = document.getElementById("checkout-process-form");
  const placeBtn = document.querySelector(".place-order");
  const returnCartBtn = document.getElementById("return-cart");
  const STORAGE_CART = "novacart_cart_localstorage";
  const STORAGE_CHECKOUT = "novacart_checkout_localstorage";

  function returnToCartPage() {
    window.location.href = "cart.html";
  }

  returnCartBtn.addEventListener("click", returnToCartPage);

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

  function showProblems(problems) {
    problems.forEach((p) => {
      setError(p.el, p.msg);
    });
    if (
      problems.length &&
      problems[0].el &&
      typeof problems[0].el.focus === "function"
    ) {
      problems[0].el.focus();
    }
  }

  function recalcAndRenderTotals() {
    const method =
      window.NovaCart &&
      window.NovaCart.billing &&
      window.NovaCart.billing.getDeliveryMethod
        ? window.NovaCart.billing.getDeliveryMethod()
        : "standard";
    if (
      window.NovaCart &&
      window.NovaCart.checkoutSummary &&
      window.NovaCart.checkoutSummary.renderTotals
    ) {
      window.NovaCart.checkoutSummary.renderTotals(method);
    }
  }

  if (form) {
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();

      // clear old messages
      document.querySelectorAll(".field-message").forEach((m) => {
        m.textContent = "";
      });
      document
        .querySelectorAll(".invalid")
        .forEach((i) => i.classList.remove("invalid"));

      const billingProblems =
        window.NovaCart &&
        window.NovaCart.billing &&
        window.NovaCart.billing.validateBilling
          ? window.NovaCart.billing.validateBilling()
          : [];
      const paymentProblems =
        window.NovaCart &&
        window.NovaCart.payment &&
        window.NovaCart.payment.validatePayment
          ? window.NovaCart.payment.validatePayment()
          : [];

      const problems = []
        .concat(billingProblems || [])
        .concat(paymentProblems || []);
      if (problems.length) {
        showProblems(problems);
        recalcAndRenderTotals();
        return;
      }

      // all good -> update UI and totals
      if (placeBtn) {
        placeBtn.disabled = true;
        placeBtn.textContent = "Processing...";
      }

      // ensure totals reflect delivery method selection
      recalcAndRenderTotals();

      // clear storages and finalize
      try {
        localStorage.removeItem(STORAGE_CART);
        localStorage.removeItem(STORAGE_CHECKOUT);
      } catch (e) {
        // ignore
      }

      // show Order Placed then redirect after 700ms
      setTimeout(() => {
        if (placeBtn) placeBtn.textContent = "Order Placed";
        setTimeout(() => {
          window.location.href = "index.html";
        }, 400);
      }, 700);
    });
  }

  // keep totals correct when delivery method toggles
  document.addEventListener("change", (e) => {
    if (e.target && (e.target.id === "type" || e.target.id === "type2")) {
      recalcAndRenderTotals();
    }
  });

  // keep UI totals up to date on load
  document.addEventListener("DOMContentLoaded", () => {
    recalcAndRenderTotals();
  });

  console.log("checkout-coordinator.js loaded");
})();
