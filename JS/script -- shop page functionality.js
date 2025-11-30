document.addEventListener("DOMContentLoaded", function () {
  console.log("Shop Page Functionality Script Connected");
  // Elements
  const categorySelect = document.getElementById("category");
  const sortSelect = document.getElementById("sort");
  const grids = document.querySelectorAll(".product-grid");

  // --- Helper: parse price string like "$ 1,234.56" -> 1234.56
  function parsePrice(str) {
    if (!str) return 0;
    return parseFloat(String(str).replace(/[^0-9.]/g, "")) || 0;
  }

  // --- Prepare: mark initial order for each product card so "default" can restore
  grids.forEach((grid) => {
    const cards = Array.from(grid.querySelectorAll(".product-card"));
    cards.forEach((card, i) => {
      // store initial index only once
      if (typeof card.dataset.initialIndex === "undefined") {
        card.dataset.initialIndex = i;
      }
    });
  });

  // --- Category select: scroll to the matching section (or top)
  if (categorySelect) {
    categorySelect.addEventListener("change", function () {
      const val = this.value;
      if (val === "all") {
        // scroll to first product category or top of product area
        const firstCategory = document.querySelector(".product-category");
        if (firstCategory) firstCategory.scrollIntoView({ behavior: "smooth" });
        else window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const target = document.getElementById(val);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  }

  // --- Sorting logic for one grid
  function sortGrid(grid, mode) {
    const cards = Array.from(grid.querySelectorAll(".product-card"));
    let sorted;

    if (mode === "default") {
      sorted = cards.sort((a, b) => {
        return (
          Number(a.dataset.initialIndex || 0) -
          Number(b.dataset.initialIndex || 0)
        );
      });
    } else if (mode === "price-low-high") {
      sorted = cards.sort((a, b) => {
        const pa = parsePrice(
          (a.querySelector(".product-prices") || {}).textContent || ""
        );
        const pb = parsePrice(
          (b.querySelector(".product-prices") || {}).textContent || ""
        );
        return pa - pb;
      });
    } else if (mode === "price-high-low") {
      sorted = cards.sort((a, b) => {
        const pa = parsePrice(
          (a.querySelector(".product-prices") || {}).textContent || ""
        );
        const pb = parsePrice(
          (b.querySelector(".product-prices") || {}).textContent || ""
        );
        return pb - pa;
      });
    } else if (mode === "new-arrivals") {
      sorted = cards.sort((a, b) => {
        const da = new Date(a.getAttribute("data-date") || 0).getTime();
        const db = new Date(b.getAttribute("data-date") || 0).getTime();
        return db - da; // newest first
      });
    } else {
      // fallback to default
      sorted = cards;
    }

    // re-append in sorted order (this moves nodes in DOM)
    sorted.forEach((c) => grid.appendChild(c));
  }

  // --- Sort select: apply sorting to all grids on change
  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      const mode = this.value;
      grids.forEach((grid) => sortGrid(grid, mode));
    });
  }
});
