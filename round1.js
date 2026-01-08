/* =========================
   FIREBASE INITIALIZATION
========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAoFcqKMYnU1pfF8pVBk6oxusVxgAzb1oQ",
  authDomain: "ciphertrace-26b33.firebaseapp.com",
  databaseURL: "https://ciphertrace-26b33-default-rtdb.firebaseio.com",
  projectId: "ciphertrace-26b33",
  storageBucket: "ciphertrace-26b33.firebasestorage.app",
  messagingSenderId: "965143042848",
  appId: "1:965143042848:web:959bd072875b52e20e1545"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* =========================
   GLOBAL STATE & SYNC
========================= */
let seconds = 0;
let timerInterval = null;

const userEmail = localStorage.getItem("userEmail");
const sanitizedEmail = userEmail ? userEmail.replace(/\./g, ",") : null;

/**
 * Automatically maps puzzle inputs to the final summary inputs
 * and sets the final inputs to Read Only.
 */
function setupInputSync() {
  const syncMap = [
    { src: "ans1", dest: "input1" },
    { src: "ans2", dest: "input2" },
    { src: "ans3", dest: "input3" },
    { src: "ans4", dest: "input4" }
  ];

  syncMap.forEach(mapping => {
    const srcEl = document.getElementById(mapping.src);
    const destEl = document.getElementById(mapping.dest);

    if (srcEl && destEl) {
      destEl.readOnly = true; // Prevent editing in the final box
      srcEl.addEventListener("input", () => {
        destEl.value = srcEl.value;
      });
    }
  });
}

/* =========================
   ENTRY + TIMER
========================= */
function enterRound() {
  const entry = document.getElementById("entryScreen");
  const timer = document.getElementById("timer");

  entry.style.display = "none";
  timer.style.display = "block";

  document.querySelectorAll(".section").forEach(sec =>
    sec.classList.remove("active")
  );
  document.getElementById("step-intro").classList.add("active");

  setupInputSync(); // Initialize input syncing when round starts

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    seconds++;
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    timer.textContent = `${min}:${sec}`;
  }, 1000);
}

/* =========================
   STEP CONTROL
========================= */
function nextStep(currentId, nextId) {
  document.getElementById(currentId).classList.remove("active");
  const next = document.getElementById(nextId);
  next.classList.add("active");

  if (nextId === "step-p1") {
    setTimeout(resizeCanvas, 100);
  }

  window.scrollTo(0, 0);
}

/* =========================
   PUZZLES
========================= */
function submitPuzzle1() {
  const ans = document.getElementById("ans1").value.trim().toLowerCase();
  if (ans === "system") {
    nextStep("step-p1", "story-bridge");
  } else {
    alert("DECODING FAILED; PATTERN NOT RECOGNIZED");
  }
}

function submitPuzzle2() {
  const ans = document.getElementById("ans2").value.trim().toLowerCase();
  // Accepting "stand" or "stands" based on previous logic
  if (ans === "stand" || ans === "stands") {
    nextStep("step-p2", "story-p3-bridge");
  } else {
    alert("DECODING FAILEDVALIDATION FAILED; TRY AGAIN");
  }
}

const revealPuzzle3Btn = document.getElementById("revealPuzzle3Btn");
const puzzle3Clue = document.getElementById("puzzle3Clue");

if (revealPuzzle3Btn && puzzle3Clue) {
  revealPuzzle3Btn.addEventListener("click", () => {
    puzzle3Clue.style.display = "block";
    revealPuzzle3Btn.style.display = "none";
  });
}

// Updated submitRound1 function in round1.js
// Updated submitRound1 function in round1.js
function submitRound1() {
  if (!sanitizedEmail) {
    alert("User not logged in.");
    return;
  }

  const a1 = document.getElementById("ans1").value.trim().toLowerCase();
  const a2 = document.getElementById("ans2").value.trim().toLowerCase();
  const a3 = document.getElementById("ans3").value.trim().toLowerCase();
  const a4 = document.getElementById("ans4").value.trim().toLowerCase();
  const a5 = document.getElementById("input5").value.trim().toLowerCase();

  // Check if all five answers are correct
  const isCorrect = (a1 === "system" && a2 === "stands" && a3 === "worth" && a4 === "awaits" && a5 === "order restored");

  // Get current date and time
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0]; // HH:MM:SS

  const payload = {
    answers: {
      ans1: a1,
      ans2: a2,
      ans3: a3,
      ans4: a4,
      ans5: a5
    },
    timeTaken: seconds, // in seconds
    completionDate: date,
    completionTime: time,
    timestamp: now.toISOString(), // full ISO string for precise logging
    correct: isCorrect, // flag to indicate if submission was correct
    submitted: true // flag to prevent further submissions
  };

  set(ref(db, `registrations/${sanitizedEmail}/round1`), payload)
    .then(() => {
      const status = document.getElementById("submissionStatus");
      if (isCorrect) {
        status.textContent = "Congratulations. you saved the spekter. You will go to round 2";
        status.style.display = "block";
      } else {
        status.textContent = "Specter missing, connection not integrated.";
        status.style.display = "block";
        status.style.color = "#ff6b6b"; // Error color
      }
      // Always proceed to end after submission, no more chances
      setTimeout(() => nextStep("step-p5", "step-end"), 1500);
    })
    .catch(err => alert(err.message));
}

/* =========================
   SCRATCH CARD
========================= */
const canvas = document.getElementById("scratchCanvas");
const img = document.getElementById("hiddenImage");
const ctx = canvas.getContext("2d");

let scratching = false;
let lastX = 0, lastY = 0;
let completed = false;

function resizeCanvas() {
  canvas.width = img.clientWidth;
  canvas.height = img.clientHeight;
  ctx.fillStyle = "#0a0e12";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

img.onload = resizeCanvas;
window.addEventListener("resize", resizeCanvas);

canvas.addEventListener("mousedown", e => {
  scratching = true;
  const r = canvas.getBoundingClientRect();
  lastX = e.clientX - r.left;
  lastY = e.clientY - r.top;
});

canvas.addEventListener("mouseup", () => {
  scratching = false;
  checkScratch();
});

canvas.addEventListener("mousemove", e => {
  if (!scratching) return;
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;

  ctx.globalCompositeOperation = "destination-out";
  ctx.lineWidth = 80;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();

  lastX = x;
  lastY = y;
});

function checkScratch() {
  if (completed) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  let transparentPixels = 0;

  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] === 0) {
      transparentPixels++;
    }
  }

  const totalPixels = pixels.length / 4;
  const percentScratched = (transparentPixels / totalPixels) * 100;

  if (percentScratched >= 45) {
    completed = true;

    // Reveal clue
    const clue = document.getElementById("clue");
    if (clue) {
      clue.style.display = "block";
    }

    // Optional: disable further scratching
    canvas.style.pointerEvents = "none";
  }
}

/* =========================
   AUDIO SECTION (CORRECTED)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const stepP4 = document.getElementById("step-p4");
  if (!stepP4) return;

  const revealBtn = stepP4.querySelector("#revealAudioBtn");
  const audio = stepP4.querySelector("#awaitAudio");
  const controls = stepP4.querySelector("#audioControls");

  const pauseBtn = stepP4.querySelector("#pauseBtn");
  const resumeBtn = stepP4.querySelector("#resumeBtn");
  const downloadBtn = stepP4.querySelector("#downloadBtn");

  if (!revealBtn || !audio || !controls || !pauseBtn || !resumeBtn || !downloadBtn) {
    console.warn("Audio elements not found in step-p4. Skipping audio setup.");
    return;
  }

  revealBtn.addEventListener("click", () => {
    audio.play().catch(err => {
      console.warn("Autoplay blocked or audio error:", err);
    });
    controls.style.display = "flex";
    revealBtn.style.display = "none";

    pauseBtn.style.display = "inline-block";
    resumeBtn.style.display = "none";
  });

  pauseBtn.addEventListener("click", () => {
    audio.pause();
    pauseBtn.style.display = "none";
    resumeBtn.style.display = "inline-block";
  });

  resumeBtn.addEventListener("click", () => {
    audio.play().catch(err => {
      console.warn("Resume failed:", err);
    });
    resumeBtn.style.display = "none";
    pauseBtn.style.display = "inline-block";
  });

  downloadBtn.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = audio.src;
    a.download = "ciphertrace_audio.mp3";
    a.click();
  });
});


document.addEventListener("DOMContentLoaded", () => {

  const backBtn = document.createElement("button");
  backBtn.textContent = "← BACK";
  backBtn.style.cssText = `
    position: fixed;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    padding: 10px 15px;
    font-family: 'Orbitron', sans-serif;
    font-size: 12px;
    letter-spacing: 2px;
    border-radius: 8px;
    border: 1px solid rgba(0,255,255,0.5);
    background: rgba(0,255,255,0.1);
    color: #00ffff;
    cursor: pointer;
    z-index: 1000;
    display: none;
  `;

  const forwardBtn = document.createElement("button");
  forwardBtn.textContent = "FORWARD →";
  forwardBtn.style.cssText = `
    position: fixed;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    padding: 10px 15px;
    font-family: 'Orbitron', sans-serif;
    font-size: 12px;
    letter-spacing: 2px;
    border-radius: 8px;
    border: 1px solid rgba(0,255,255,0.5);
    background: rgba(0,255,255,0.1);
    color: #00ffff;
    cursor: pointer;
    z-index: 1000;
    display: none;
  `;

  document.body.appendChild(backBtn);
  document.body.appendChild(forwardBtn);

  const NAV_SEQUENCE = [
    "story-p3-bridge",   // Story 3 (forward only)
    "step-p3",           // Puzzle 3 (back + forward)
    "story-p4-bridge",
    "step-p4",
    "story-p5-bridge",
    "step-p5"
  ];

  const STORY3_INDEX = NAV_SEQUENCE.indexOf("story-p3-bridge");
  const PUZZLE3_INDEX = NAV_SEQUENCE.indexOf("step-p3");

  function updateNavButtons() {
    const active = document.querySelector(".section.active");
    if (!active) return;

    const idx = NAV_SEQUENCE.indexOf(active.id);

    // Outside navigation flow
    if (idx === -1) {
      backBtn.style.display = "none";
      forwardBtn.style.display = "none";
      return;
    }

    // Story 3 → FORWARD ONLY
    if (idx === STORY3_INDEX) {
      backBtn.style.display = "none";
      forwardBtn.style.display = "block";
      forwardBtn.onclick = () =>
        nextStep(active.id, NAV_SEQUENCE[idx + 1]);
      return;
    }

    // Puzzle 3 and beyond → BACK + FORWARD
    if (idx >= PUZZLE3_INDEX) {

      // BACK
      if (idx > STORY3_INDEX) {
        backBtn.style.display = "block";
        backBtn.onclick = () =>
          nextStep(active.id, NAV_SEQUENCE[idx - 1]);
      } else {
        backBtn.style.display = "none";
      }

      // FORWARD
      if (idx < NAV_SEQUENCE.length - 1) {
        forwardBtn.style.display = "block";
        forwardBtn.onclick = () =>
          nextStep(active.id, NAV_SEQUENCE[idx + 1]);
      } else {
        forwardBtn.style.display = "none";
      }

      return;
    }
  }

  const observer = new MutationObserver(updateNavButtons);
  document.querySelectorAll(".section").forEach(sec => {
    observer.observe(sec, {
      attributes: true,
      attributeFilter: ["class"]
    });
  });

  updateNavButtons();
});


/* =========================
   GLOBAL EXPORTS
========================= */
window.enterRound = enterRound;
window.nextStep = nextStep;
window.submitPuzzle1 = submitPuzzle1;
window.submitPuzzle2 = submitPuzzle2;
window.submitRound1 = submitRound1;