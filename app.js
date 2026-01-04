// app.js

// Import Firebase core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

// Import Auth functions
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Import Realtime Database functions
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Initialize Auth with session persistence
const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence);

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

/* Submit Form (Now triggers login) */
function submitForm() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const status = document.getElementById("loginStatus");

  if (name === "" || email === "") {
    status.textContent = "Please fill all fields";
    status.className = "status error";
    return;
  }

  if (!email.endsWith("@ds.study.iitm.ac.in")) {
    status.textContent = "Only IITM emails allowed";
    status.className = "status error";
    return;
  }

  // Store temporarily
  localStorage.setItem("ciphertraceName", name);
  localStorage.setItem("ciphertraceEmail", email);

  status.textContent = "Sending login link…";
  status.className = "status";

  sendSignInLinkToEmail(auth, email, {
    url: window.location.href,
    handleCodeInApp: true
  })
  .then(() => {
    status.textContent = "Login link sent to your IITM email. Check your inbox and click the link to proceed.";
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
    // Create/update profile
    set(ref(db, 'users/' + user.uid), {
      email: user.email,
      name: user.displayName || 'Unknown',
      lastLogin: Date.now(),
      round1Done: false
    });
    loggedIn = true;
    window.location.href = 'profile.html';
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

/* Handle Email Link Sign In */
if (isSignInWithEmailLink(auth, window.location.href)) {
  const email = localStorage.getItem("ciphertraceEmail");
  const name = localStorage.getItem("ciphertraceName");

  if (email) {
    signInWithEmailLink(auth, email, window.location.href)
      .then((result) => {
        const user = result.user;
        // Create/update profile
        set(ref(db, 'users/' + user.uid), {
          email: user.email,
          name: name,
          lastLogin: Date.now(),
          round1Done: false
        });
        localStorage.removeItem("ciphertraceName");
        localStorage.removeItem("ciphertraceEmail");
        loggedIn = true;
        window.location.href = 'profile.html';
      })
      .catch(err => alert(err.message));
  }
}

// Make functions global
window.submitForm = submitForm;
window.signInWithGoogle = signInWithGoogle;
window.scrollToLogin = scrollToLogin;