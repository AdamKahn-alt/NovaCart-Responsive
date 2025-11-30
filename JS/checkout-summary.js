// checkout-summary.js
// Right-column: render order rows, manage totals and localStorage API
(function () {
  if (!window.NovaCart) window.NovaCart = {};
  if (window.NovaCart._checkoutSummaryInit) return;
  window.NovaCart._checkoutSummaryInit = true;

  const STORAGE_KEY = "novacart_cart_localstorage";
  const rowsContainer = document.querySelector(".order-flex-container");
  const subtotalEl = document.querySelector(".checkout-subtotal");
  const shippingEl = document.querySelector(".checkout-est-shipping");
  const grandEl = document.querySelector(".checkout-grand-total");

  function formatPrice(n) {
    return (
      "$ " +
      Number(n).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  function loadCartItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveCartItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function createOrderRow(item) {
    const el = document.createElement("div");
    el.className = "order-flex";
    el.dataset.cartId = item.id || "";

    const qty = Math.max(1, Number(item.qty || 1));
    const lineTotal = Number(item.price || 0) * qty;

    el.innerHTML = `
      <figure class="checkout-order-figure">
        <img src="${escapeHtml(item.image || "")}" alt="${escapeHtml(
      item.name || ""
    )}" class="order-img">
      </figure>
      <p class="checkout-order-name">
        ${escapeHtml(item.name || "")}
        <br>
        <input type="number" min="1" max="10" value="${qty}" class="checkout-order-qty">
      </p>
      <p class="checkout-order-price">${formatPrice(lineTotal)}</p>
    `;

    const qtyInput = el.querySelector(".checkout-order-qty");
    qtyInput.addEventListener("change", () => {
      let v = parseInt(qtyInput.value, 10);
      if (isNaN(v) || v < 1) v = 1;
      if (v > 10) v = 10;
      qtyInput.value = v;

      const newLineTotal = Number(item.price || 0) * v;
      const priceP = el.querySelector(".checkout-order-price");
      if (priceP) priceP.textContent = formatPrice(newLineTotal);

      const items = loadCartItems();
      const idx = items.findIndex((x) => x.id === item.id);
      if (idx > -1) {
        items[idx].qty = v;
        saveCartItems(items);
      } else {
        const idx2 = items.findIndex((x) => x.name === item.name);
        if (idx2 > -1) {
          items[idx2].qty = v;
          saveCartItems(items);
        }
      }

      renderTotals();
    });

    return el;
  }

  function renderRows() {
    if (!rowsContainer) return;
    const items = loadCartItems();
    rowsContainer.innerHTML = "";
    items.forEach((item) => {
      const row = createOrderRow(item);
      rowsContainer.appendChild(row);
    });
    renderTotals();
  }

  function calcShipping(subtotal, method) {
    // method: 'standard' => 5% if subtotal > 1000
    // method: 'express'  => 10% if subtotal > 1000
    if (!subtotal || subtotal <= 1000) return 0;
    if (method === "express") return subtotal * 0.1;
    return subtotal * 0.05;
  }

  function renderTotals(method) {
    const items = loadCartItems();
    const subtotal = items.reduce(
      (s, it) => s + Number(it.price || 0) * Number(it.qty || 1),
      0
    );
    const shipping = calcShipping(subtotal, method);
    const grand = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) shippingEl.textContent = formatPrice(shipping);
    if (grandEl) grandEl.textContent = formatPrice(grand);
  }

  // expose API
  window.NovaCart.checkoutSummary = {
    renderRows,
    renderTotals,
    loadCartItems,
    saveCartItems,
    getSubtotal: function () {
      const items = loadCartItems();
      return items.reduce(
        (s, it) => s + Number(it.price || 0) * Number(it.qty || 1),
        0
      );
    },
    calcShipping,
  };

  // initial render
  document.addEventListener("DOMContentLoaded", renderRows);
  console.log("checkout-summary.js loaded");
})();
