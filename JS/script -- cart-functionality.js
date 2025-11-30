console.log("Cart Functionality Script Connected");
document.addEventListener("DOMContentLoaded", function () {
  const STORAGE_KEY = "novacart_cart_localstorage";

  // Utility: parse price string like "$ 1,234.56" -> 1234.56
  function parsePrice(str) {
    if (!str) return 0;
    return parseFloat(String(str).replace(/[^0-9.]/g, "")) || 0;
  }

  // Utility: format number -> "$ 1,234.56"
  function formatPrice(num) {
    return (
      "$ " +
      Number(num).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  // Get order summary elements (may be absent on some pages)
  const subtotalEl = document.getElementById("cart-subtotal");
  const shippingEl = document.getElementById("cart-est-shipping");
  const grandEl = document.getElementById("cart-grand-total");

  // Cart container on cart page
  const cartContainer = document.querySelector(".cart-items");

  // Load cart from localStorage or from existing DOM (if no storage)
  function loadCartData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }

    // If no saved data, try to read hard-coded cart items on the page
    const initial = [];
    if (cartContainer) {
      const nodes = cartContainer.querySelectorAll(".cart-item");
      nodes.forEach((node) => {
        const imgEl = node.querySelector(".cart-item-img");
        const nameEl = node.querySelector(".cart-item-name");
        const priceEl = node.querySelector(".cart-item-price");
        const qtyEl = node.querySelector(".cart-quantity");

        const img = imgEl ? imgEl.src || "" : "";
        // Get the visible product name (first text node of h3)
        let name = "";
        if (nameEl) {
          const firstText =
            nameEl.childNodes && nameEl.childNodes[0]
              ? String(nameEl.childNodes[0].nodeValue).trim()
              : nameEl.textContent.trim();
          name = firstText;
        }
        const price = priceEl ? parsePrice(priceEl.textContent) : 0;
        const qty = qtyEl ? Math.max(1, parseInt(qtyEl.value || 1, 10)) : 1;

        initial.push({
          id: "init-" + Math.random().toString(36).slice(2, 9),
          image: img,
          name,
          price,
          qty,
        });
      });
    }
    // Save initial snapshot
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  let cart = loadCartData();

  // Save cart to storage
  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  // Calculate totals and update summary
  function updateSummary() {
    if (!subtotalEl && !shippingEl && !grandEl) return;

    const subtotal = cart.reduce(
      (sum, it) => sum + it.price * (it.qty || 1),
      0
    );

    let shipping = 0;
    // shipping rule: if subtotal < 1000 => shipping = subtotal / 3 ; else shipping = 0
    if (subtotal > 1000) shipping = (5 / 100) * subtotal;
    else shipping = 0;

    const grand = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) shippingEl.textContent = formatPrice(shipping);
    if (grandEl) grandEl.textContent = formatPrice(grand);
  }

  // Create cart item DOM (consistent structure)
  function createCartItemElement(item) {
    const article = document.createElement("article");
    article.className = "cart-item";
    article.setAttribute("data-cart-id", item.id);

    article.innerHTML = `
      <figure class="cart-item-img-cont">
        <img src="${item.image}" alt="${escapeHtml(
      item.name
    )}" class="cart-item-img">
      </figure>
      <div class="cart-item-info">
        <h3 class="cart-item-name">${escapeHtml(
          item.name
        )}<br><span></span></h3>
        <p class="cart-item-price">$ ${Number(item.price).toFixed(2)}</p>
        <div class="cart-controls">
          <label>Qty:</label>
          <input type="number" min="1" max="10" value="${
            item.qty
          }" class="cart-quantity">
          <button class="cart-remove">X</button>
        </div>
      </div>
    `;

    // Attach event listeners for qty and remove
    const qtyInput = article.querySelector(".cart-quantity");
    const removeBtn = article.querySelector(".cart-remove");

    qtyInput.addEventListener("change", function () {
      let v = parseInt(qtyInput.value || 1, 10);
      if (isNaN(v) || v < 1) v = 1;
      qtyInput.value = v;
      // update cart model
      const id = article.getAttribute("data-cart-id");
      const it = cart.find((x) => x.id === id);
      if (it) {
        it.qty = v;
        saveCart();
        updateSummary();
      }
    });

    removeBtn.addEventListener("click", function () {
      const id = article.getAttribute("data-cart-id");
      cart = cart.filter((x) => x.id !== id);
      saveCart();
      // remove DOM
      if (article.parentNode) article.parentNode.removeChild(article);
      updateSummary();
    });

    return article;
  }

  // Escape text for safety when injecting into innerHTML
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Render cart into the container (clears & repopulates)
  function renderCart() {
    if (!cartContainer) return;
    cartContainer.innerHTML = "";
    cart.forEach((item) => {
      const el = createCartItemElement(item);
      cartContainer.appendChild(el);
    });
    updateSummary();
  }

  // If on cart page, render cart
  if (cartContainer) renderCart();

  // Listen for Add to Cart buttons across pages
  const productCards = document.querySelectorAll("#product-card-cont");
  if (productCards && productCards.length) {
    productCards.forEach((card) => {
      const btn = card.querySelector("#add-to-cart-btn");
      if (!btn) return;
      btn.addEventListener("click", function (e) {
        // read product details from the card
        const imgEl = card.querySelector("#product-image");
        const nameEl = card.querySelector("#product-name");
        const priceEl = card.querySelector("#product-price");

        const image = imgEl ? imgEl.src || "" : "";
        const name = nameEl ? nameEl.textContent.trim() : "Product";
        const price = priceEl ? parsePrice(priceEl.textContent) : 0;

        const newItem = {
          id: "p-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
          image,
          name,
          price,
          qty: 1,
        };

        // add as separate row (duplicates allowed)
        cart.push(newItem);
        saveCart();

        // If currently on the cart page, re-render so new item shows
        if (cartContainer) renderCart();
      });
    });
  }

  // Done: ensure summary is correct on load (if summary elements exist)
  updateSummary();
});
