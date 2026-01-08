// round2.js — JavaScript for CipherTrace Round 2
// All sections appear on one page after entering Round 2
// Unified Firebase config to match the main app (index.html) for consistent data storage

/* =========================
   FIREBASE INITIALIZATION
========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* =========================
   FIREBASE CONFIG (UNIFIED WITH MAIN APP)
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyAoFcqKMYnU1pfF8pVBk6oxusVxgAzb1oQ",
  authDomain: "ciphertrace-26b33.firebaseapp.com",
  databaseURL: "https://ciphertrace-26b33-default-rtdb.firebaseio.com",
  projectId: "ciphertrace-26b33",
  storageBucket: "ciphertrace-26b33.firebasestorage.app",
  messagingSenderId: "965143042848",
  appId: "1:965143042848:web:959bd072875b52e20e1545"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* =========================
   GLOBAL STATE
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
  if (round2Started) return;
  round2Started = true;

  const entryScreen = document.getElementById("entryScreen");
  const timerBox = document.getElementById("timer");

  entryScreen.style.display = "none";
  timerBox.style.display = "block";

  // Activate all sections
  document.querySelectorAll(".section").forEach(section => {
    section.classList.add("active");
  });

  // Start timer
  timerInterval = setInterval(() => {
    seconds++;
    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    timerBox.textContent = `${minutes}:${secs}`;
  }, 1000);
}

/* =========================
   ROUND 2 SUBMISSION
========================= */
function submitRound2() {
  if (!sanitizedEmail) {
    alert("User not logged in.");
    return;
  }

  const input = document.getElementById("round2FinalAnswer");
  const statusBox = document.getElementById("round2Status");

  const answer = input.value.trim().toLowerCase();
  const isCorrect = answer === "placeholder"; // replace with real answer

  const now = new Date();

  const payload = {
    answer: answer,
    timeTaken: seconds,
    completionDate: now.toISOString().split("T")[0],
    completionTime: now.toTimeString().split(" ")[0],
    timestamp: now.toISOString(),
    correct: isCorrect,
    submitted: true
  };

  set(ref(db, `registrations/${sanitizedEmail}/round2`), payload)
    .then(() => {
      statusBox.style.display = "block";

      if (isCorrect) {
        statusBox.style.color = "#00ffff";
        statusBox.textContent = "SUCCESS FOR SYSTEM. ROUND 2 COMPLETE.";
        clearInterval(timerInterval);
      } else {
        statusBox.style.color = "#ff6b6b";
        statusBox.textContent = "Incorrect answer. Try again.";
      }
    })
    .catch(error => {
      alert(error.message);
    });
}

/* =========================
   EVENT LISTENERS
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const enterBtn = document.querySelector("#entryScreen button");
  const submitBtn = document.getElementById("submitRound2");

  if (enterBtn) {
    enterBtn.addEventListener("click", enterRound);
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", submitRound2);
  }
});