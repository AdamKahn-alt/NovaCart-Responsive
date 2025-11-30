//JAVASCRIPT CODE FOR COPYRIGHT YEAR AND SCROLL TO TOP BUTTON

console.log("Footer and scroll scripts connected!");

// ===== 1️ Auto Update Year =====
const yearSpan = document.getElementById("copy-year");
const currentYear = new Date().getFullYear();
yearSpan.textContent = currentYear;

// ===== 2️⃣ Scroll to Top Button =====
const scrollBtn = document.getElementById("scrollTopBtn");

// Show button when user scrolls down 100px from top
window.addEventListener("scroll", () => {
  if (
    document.body.scrollTop > 200 ||
    document.documentElement.scrollTop > 200
  ) {
    scrollBtn.style.display = "block";
  } else {
    scrollBtn.style.display = "none";
  }
});

// Smooth scroll to top when button clicked
scrollBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});
