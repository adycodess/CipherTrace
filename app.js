// app.js

// Import Firebase core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

// Import Auth functions
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Import Realtime Database functions
import { getDatabase, ref, set, push, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Your web app's Firebase configuration
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

// Initialize Auth
const auth = getAuth(app);

// Initialize Realtime Database
const db = getDatabase(app);

// Google Provider
const provider = new GoogleAuthProvider();

let loggedIn = false;
let round1Done = false;

/* Reveal */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      observer.unobserve(e.target);
    }
  });
}, { threshold: .2 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

/* Typewriter Effect */
function typeWriter(element, text, speed = 50) {
  let i = 0;
  element.innerHTML = '';
  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else {
      element.style.borderRight = 'none'; // Remove cursor after typing
    }
  }
  type();
}

/* Submit Form */
function submitForm() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();

  if (name === "" || email === "") {
    alert("Please fill all fields");
    return;
  }

  if (!email.endsWith("iitm.ac.in")) {
    alert("Only IITM emails allowed.");
    document.getElementById("round1Section").classList.add("round-restricted");
    document.getElementById("round2Section").classList.add("round-restricted");
    return;
  }

  // 🔐 API call instead of Firebase access
  fetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      alert(data.error || "Registration failed");
      return;
    }

    // Store email locally
    localStorage.setItem("userEmail", email);
    loggedIn = true;

    // Update UI
    document.getElementById("navLogin").textContent = email;

    document.getElementById("loginSection").innerHTML = `
      <div class="card">
        <div class="section-title">Hello, ${name}!</div>
        <p id="welcomeText" class="typewriter"></p>
      </div>
    `;

    const welcomeText = document.getElementById("welcomeText");
    const fullText =
      "Welcome to CipherTrace. We are excited to have you as part of this challenge. You may now begin by completing Round 1 and take your first step into the CipherTrace journey. Best of luck as you decode, analyze, and advance through the event.";
    typeWriter(welcomeText, fullText);

    document.getElementById("round1Section").classList.remove("round-restricted");
    document.getElementById("round2Section").classList.remove("round-restricted");
  })
  .catch(() => {
    alert("Server error. Please try again.");
  });
}

/* Login */
function login() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const status = document.getElementById("loginStatus");

  if (!email.endsWith("@ds.study.iitm.ac.in")) {
    status.textContent = "Only IITM emails allowed";
    status.className = "status error";
    // Hide round sections
    document.getElementById("round1Section").classList.add("round-restricted");
    document.getElementById("round2Section").classList.add("round-restricted");
    return;
  }

  status.textContent = "Sending login link…";
  status.className = "status";

  sendSignInLinkToEmail(auth, email, {
    url: window.location.href,
    handleCodeInApp: true
  })
  .then(() => {
    localStorage.setItem("ciphertraceEmail", email);
    status.textContent = "Login link sent to your IITM email";
    status.className = "status success";
  })
  .catch(err => {
    status.textContent = err.message;
    status.className = "status error";
  });
}

/* Google Sign In */
function signInWithGoogle() {
  signInWithPopup(auth, provider)
  .then((result) => {
    const user = result.user;
    const email = user.email;
    // Store in database
    set(ref(db, 'users/' + user.uid), {
      email: email
    });
    // Update navbar
    document.getElementById("navLogin").textContent = email;
    loggedIn = true;
    document.getElementById("loginStatus").textContent = "Logged in with Google";
    document.getElementById("loginStatus").className = "status success";
  })
  .catch(err => {
    document.getElementById("loginStatus").textContent = err.message;
    document.getElementById("loginStatus").className = "status error";
  });
}

/* Scroll */
function scrollToLogin() {
  document.getElementById("loginSection").scrollIntoView({ behavior: "smooth" });
}

/* ⏰ REAL CLOCK BASED TIMER */
function nextDate(month, day, hour, min) {
  const now = new Date();
  let d = new Date(now.getFullYear(), month - 1, day, hour, min, 0);

  if (d.getTime() <= now.getTime()) {
    d = new Date(now.getFullYear() + 1, month - 1, day, hour, min, 0);
  }
  return d.getTime();
}

const r1Time = nextDate(1, 9, 18, 0);   // Jan 9, 6:00 PM
const r2Time = nextDate(1, 10, 13, 0);  // Jan 10, 1:00 PM

function format(ms) {
  if (ms <= 0) return "00h 00m 00s";

  const totalSeconds = Math.ceil(ms / 1000); // 🔥 this makes seconds tick cleanly
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");

  return `${h}h ${m}m ${s}s`;
}

function tick() {
  const now = Date.now();

  /* ROUND 1 */
  const r1 = document.getElementById("timer1");
  const r1btn = document.getElementById("r1btn");
  const tbtn1 = document.getElementById("timerBtn1");

  const r1Remaining = r1Time - now;

  if (loggedIn) {
    // If logged in, enable Round 1 regardless of timer
    tbtn1.textContent = "ROUND 1 AVAILABLE";
    r1.textContent = "READY";
    r1btn.disabled = false;
    r1btn.classList.remove("btn-disabled");
    r1btn.textContent = "ENTER ROUND 1";
    r1btn.onclick = () => {
      // Check if user is registered/logged in (using localStorage from submitForm)
      const userEmail = localStorage.getItem("userEmail");
      if (!userEmail) {
        alert("Please register/login first.");
        scrollToLogin(); // Scroll to login section
        return;
      }
      round1Done = true;
      window.location.href = "round1.html"; // Redirect to Round 1
    };
  } else if (r1Remaining > 0) {
    const t = format(r1Remaining);
    tbtn1.textContent = "UNLOCKS IN " + t;   // 🔥 ONLY HERE
    r1.textContent = "";                    // no duplicate timer
  } else {
    tbtn1.textContent = "ROUND 1 LIVE";
    r1.textContent = "LIVE NOW";
    r1btn.disabled = false;
    r1btn.classList.remove("btn-disabled");
    r1btn.textContent = "ENTER ROUND 1";
    r1btn.onclick = () => {
      // Check if user is registered/logged in (using localStorage from submitForm)
      const userEmail = localStorage.getItem("userEmail");
      if (!userEmail) {
        alert("Please register/login first.");
        scrollToLogin(); // Scroll to login section
        return;
      }
      round1Done = true;
      window.location.href = "round1.html"; // Redirect to Round 1
    };
  }

  /* ROUND 2 */
  const r2 = document.getElementById("timer2");
  const r2btn = document.getElementById("r2btn");
  const tbtn2 = document.getElementById("timerBtn2");

  const r2Remaining = r2Time - now;

  if (r2Remaining > 0) {
    const t = format(r2Remaining);
    tbtn2.textContent = "UNLOCKS IN " + t;   // 🔥 ONLY HERE
    r2.textContent = "";
  } else {
    if (round1Done) {
      tbtn2.textContent = "ROUND 2 LIVE";
      r2.textContent = "LIVE NOW";
      r2btn.disabled = false;
      r2btn.classList.remove("btn-disabled");
      r2btn.textContent = "ENTER ROUND 2";
    } else {
      tbtn2.textContent = "WAITING FOR ROUND 1";
      r2.textContent = "LOCKED";
    }
  }

  setTimeout(tick, 1000 - (Date.now() % 1000));
}

tick();

if (isSignInWithEmailLink(auth, window.location.href)) {
  const email = localStorage.getItem("ciphertraceEmail");

  if (email) {
    signInWithEmailLink(auth, email, window.location.href)
      .then((result) => {
        const user = result.user;
        // Store in database
        set(ref(db, 'users/' + user.uid), {
          email: user.email
        });
        localStorage.removeItem("ciphertraceEmail");
        loggedIn = true;
        document.getElementById("navLogin").textContent = user.email;
        document.getElementById("loginStatus").textContent = "Logged in";
        document.getElementById("loginStatus").className = "status success";
      })
      .catch(err => alert(err.message));
  }
}

// Make functions global
window.submitForm = submitForm;
window.login = login;
window.signInWithGoogle = signInWithGoogle;
window.scrollToLogin = scrollToLogin;