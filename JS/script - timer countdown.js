console.log("Timer script connected!");

// Select the timer container and spans inside it
const timer = document.getElementById("timer");
const spans = timer.querySelectorAll(".time"); // expects 3 spans: hour, minute, second

// Initial countdown duration: 12 hours 45 mins 29 secs in seconds
const initialDuration = 12 * 3600 + 45 * 60 + 29;

// Load saved end time from localStorage
let endTime = localStorage.getItem("endTime");

// If no saved endTime, set a new one
if (!endTime) {
  endTime = Date.now() + initialDuration * 1000;
  localStorage.setItem("endTime", endTime);
}

function updateTimer() {
  const now = Date.now();
  let remaining = Math.floor((endTime - now) / 1000); // seconds left

  if (remaining <= 0) {
    // Reset to 24 hours when done
    endTime = Date.now() + 24 * 3600 * 1000;
    localStorage.setItem("endTime", endTime);
    remaining = 24 * 3600;
  }

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  spans[0].textContent = String(hours).padStart(2, "0");
  spans[1].textContent = String(minutes).padStart(2, "0");
  spans[2].textContent = String(seconds).padStart(2, "0");
}

updateTimer();
setInterval(updateTimer, 1000);
