// main.js — Firebase Auth + Firestore user data (final secure version)

/* =======================
   FIREBASE CONFIGURATION
   ======================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, orderBy, serverTimestamp,
  getDocs, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtp4izpF1GCH2qWpeLtZOdk33A_iNKzqg",
  authDomain: "nknl-d7b54.firebaseapp.com",
  projectId: "nknl-d7b54",
  storageBucket: "nknl-d7b54.firebasestorage.app",
  messagingSenderId: "792185587281",
  appId: "1:792185587281:web:585e98f2f87d7d59031a70",
  measurementId: "G-TC7XHSSCBX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.info("✅ Firebase initialized with Auth & Firestore");

/* =======================
   HELPERS
   ======================= */
const q = (s) => document.querySelector(s);
const escapeHtml = (text = '') => {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
};

/* =======================
   THEME TOGGLE
   ======================= */
document.addEventListener("DOMContentLoaded", () => {
  const toggle = q("#theme-toggle");
  const applyTheme = (t) => {
    if (t === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
  };
  let theme = localStorage.getItem("theme") || "dark";
  applyTheme(theme);
  if (toggle) {
    toggle.textContent = theme === "light" ? "🌞" : "🌙";
    toggle.addEventListener("click", () => {
      theme = theme === "light" ? "dark" : "light";
      localStorage.setItem("theme", theme);
      applyTheme(theme);
      toggle.textContent = theme === "light" ? "🌞" : "🌙";
    });
  }
});

/* =======================
   AUTH SYSTEM (Sign up / Sign in / Logout)
   ======================= */
const signupForm = q("#signup-form");
const loginForm = q("#login-form");
const logoutBtn = q("#logout-btn");

if (signupForm) {
  signupForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const email = q("#signup-email").value.trim();
    const password = q("#signup-password").value.trim();
    const name = q("#signup-name").value.trim();

    if (!email || !password || !name) return alert("Vui lòng nhập đầy đủ thông tin.");

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      alert("Đăng ký thành công!");
      localStorage.setItem("nk-user-name", name);
      window.location.href = "analytics.html";
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi đăng ký: " + err.message);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const email = q("#login-email").value.trim();
    const password = q("#login-password").value.trim();

    if (!email || !password) return alert("Nhập email và mật khẩu!");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Đăng nhập thành công!");
      window.location.href = "analytics.html";
    } catch (err) {
      alert("❌ Lỗi đăng nhập: " + err.message);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    alert("Đã đăng xuất!");
    window.location.href = "login.html";
  });
}

/* =======================
   FIRESTORE JOURNAL (Per user)
   ======================= */
let entries = [];
let chart = null;
const journalList = q("#journal-list");
const journalForm = q("#journal-form");

async function fetchEntries(uid) {
  try {
    const colRef = collection(db, "users", uid, "journalEntries");
    const qref = query(colRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(qref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return [];
  }
}

async function addEntry(uid, entry) {
  try {
    const colRef = collection(db, "users", uid, "journalEntries");
    await addDoc(colRef, { ...entry, createdAt: serverTimestamp() });
  } catch (err) {
    console.error("❌ Add entry failed:", err);
  }
}

/* =======================
   JOURNAL LOGIC (Render + Chart)
   ======================= */
function renderEntries() {
  if (!journalList) return;
  if (!entries.length) {
    journalList.innerHTML = `<li class="muted">Chưa có nhật ký nào — hãy thêm ngay!</li>`;
    return;
  }
  journalList.innerHTML = entries.slice(0, 10).map(e => `
    <li>
      <div style="display:flex;justify-content:space-between;">
        <strong>${escapeHtml(e.date)}</strong>
        <span style="font-weight:700;color:var(--accent)">
          ⭐ ${(e.rating || 0)}/10
        </span>
      </div>
      <div><b>${escapeHtml(e.goal)}</b></div>
      <div style="color:var(--muted)">${escapeHtml(e.activities || 'Không ghi')}</div>
    </li>
  `).join("");
}

function updateChart() {
  const ctx = document.getElementById("progressChart");
  if (!ctx || typeof Chart === "undefined") return;
  const labels = entries.map(e => e.date).reverse();
  const data = entries.map(e => e.rating).reverse();
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Mức tiến bộ",
        data,
        borderColor: "rgba(79,70,229,1)",
        backgroundColor: "rgba(79,70,229,0.15)",
        tension: 0.3,
        fill: true,
      }]
    },
    options: { scales: { y: { beginAtZero: true, max: 10 } } }
  });
}

/* =======================
   LISTEN AUTH STATE
   ======================= */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("🔑 Logged in as:", user.email);
    const name = localStorage.getItem("nk-user-name") || user.email.split("@")[0];
    document.querySelectorAll(".brand").forEach(el =>
      el.innerHTML = `NK<span>NL</span> — ${name}`
    );

    entries = await fetchEntries(user.uid);
    renderEntries();
    updateChart();

    if (journalForm) {
      journalForm.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const date = q("#date").value;
        const goal = q("#goal").value.trim();
        const activities = q("#activities").value.trim();
        const rating = Number(q("#rating").value || 0);

        if (!date || !goal || !rating) return alert("Vui lòng nhập đủ thông tin.");
        const entry = { date, goal, activities, rating };
        entries.unshift(entry);
        renderEntries();
        updateChart();
        journalForm.reset();
        await addEntry(user.uid, entry);
      });
    }

  } else {
    console.log("🚪 Chưa đăng nhập.");
    if (window.location.pathname.endsWith("analytics.html")) {
      window.location.href = "login.html";
    }
  }
});

console.log("🔥 NK-NL App with Firebase Auth loaded successfully!");
