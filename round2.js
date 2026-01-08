// round2.js - JavaScript for CipherTrace Round 2
// Navigation buttons appear ONLY after entering Round 2

/* =========================
   FIREBASE INITIALIZATION
========================= */
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-GMblBiR9uwlzVSAvlB2k4DqvcJSuBfM",
  authDomain: "ciphertraceround2.firebaseapp.com",
  databaseURL: "https://ciphertraceround2-default-rtdb.firebaseio.com",
  projectId: "ciphertraceround2",
  storageBucket: "ciphertraceround2.firebasestorage.app",
  messagingSenderId: "765614109082",
  appId: "1:765614109082:web:aad2b70e461339fb940a23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* =========================
   GLOBAL STATE & SYNC
========================= */
let seconds = 0;
let timerInterval = null;
let round2Started = false;

const userEmail = localStorage.getItem("userEmail");
const sanitizedEmail = userEmail ? userEmail.replace(/\./g, ",") : null;

/* =========================
   ENTRY + TIMER
========================= */
function enterRound() {
  round2Started = true;

  const entry = document.getElementById("entryScreen");
  const timer = document.getElementById("timer");

  entry.style.display = "none";
  timer.style.display = "block";

  document.querySelectorAll(".section").forEach(sec =>
    sec.classList.remove("active")
  );
  document.getElementById("step-intro").classList.add("active");

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
  document.getElementById(nextId).classList.add("active");
  window.scrollTo(0, 0);
}

/* =========================
   ROUND 2 SUBMISSION
========================= */
function submitRound2() {
  if (!sanitizedEmail) {
    alert("User not logged in.");
    return;
  }

  const answer = document
    .getElementById("round2FinalAnswer")
    .value.trim()
    .toLowerCase();

  const isCorrect = answer === "placeholder"; // replace with actual answer

  const now = new Date();
  const payload = {
    answer,
    timeTaken: seconds,
    completionDate: now.toISOString().split("T")[0],
    completionTime: now.toTimeString().split(" ")[0],
    timestamp: now.toISOString(),
    correct: isCorrect,
    submitted: true
  };

  set(ref(db, `registrations/${sanitizedEmail}/round2`), payload)
    .then(() => {
      const status = document.getElementById("round2Status");
      status.style.display = "block";

      if (isCorrect) {
        status.textContent = "SUCCESS FOR SYSTEM. ROUND 2 COMPLETE.";
      } else {
        status.textContent = "Incorrect answer. Try again.";
        status.style.color = "#ff6b6b";
      }

      setTimeout(() => nextStep("step-p5", "step-end"), 1500);
    })
    .catch(err => alert(err.message));
}

/* =========================
   NAVIGATION BUTTONS
========================= */
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
    "step-intro",
    "step-p1",
    "step-p2",
    "step-p3",
    "step-p4",
    "step-p5"
  ];

  function updateNavButtons() {
    if (!round2Started) {
      backBtn.style.display = "none";
      forwardBtn.style.display = "none";
      return;
    }

    const active = document.querySelector(".section.active");
    if (!active) return;

    const idx = NAV_SEQUENCE.indexOf(active.id);
    if (idx === -1) return;

    if (idx === 0) {
      backBtn.style.display = "none";
      forwardBtn.style.display = "block";
      forwardBtn.onclick = () =>
        nextStep(active.id, NAV_SEQUENCE[idx + 1]);
      return;
    }

    backBtn.style.display = "block";
    backBtn.onclick = () =>
      nextStep(active.id, NAV_SEQUENCE[idx - 1]);

    if (idx < NAV_SEQUENCE.length - 1) {
      forwardBtn.style.display = "block";
      forwardBtn.onclick = () =>
        nextStep(active.id, NAV_SEQUENCE[idx + 1]);
    } else {
      forwardBtn.style.display = "none";
    }
  }

  const observer = new MutationObserver(updateNavButtons);
  document.querySelectorAll(".section").forEach(sec => {
    observer.observe(sec, { attributes: true, attributeFilter: ["class"] });
  });

  updateNavButtons();
});

/* =========================
   GLOBAL EXPORTS
========================= */
window.enterRound = enterRound;
window.nextStep = nextStep;
window.submitRound2 = submitRound2;
