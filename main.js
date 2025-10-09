// main.js — NKNL 2025: Firebase Auth + Firestore + Chart + Theme
// --------------------------------------------------------------

/* =======================
   IMPORT FIREBASE MODULES
   ======================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, orderBy,
  serverTimestamp, getDocs, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

/* =======================
   FIREBASE CONFIG
   ======================= */
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

console.info("✅ Firebase initialized");

/* =======================
   HELPERS
   ======================= */
const q = (s) => document.querySelector(s);
const escapeHtml = (text = '') => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/* =======================
   THEME SWITCHER
   ======================= */
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.querySelector("#theme-toggle");
  const applyTheme = (theme) => {
    if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
  };
  let currentTheme = localStorage.getItem("theme") || "dark";
  applyTheme(currentTheme);
  if (themeToggle) {
    themeToggle.textContent = currentTheme === "light" ? "🌞" : "🌙";
    themeToggle.addEventListener("click", () => {
      currentTheme = currentTheme === "light" ? "dark" : "light";
      applyTheme(currentTheme);
      localStorage.setItem("theme", currentTheme);
      themeToggle.textContent = currentTheme === "light" ? "🌞" : "🌙";
    });
  }
});

/* =======================
   AUTH: REGISTER / LOGIN / LOGOUT
   ======================= */
const registerForm = q("#register-form");
const loginForm = q("#login-form");
const logoutBtn = q("#logout-btn");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = q("#register-email").value.trim();
    const password = q("#register-password").value.trim();
    const name = q("#register-name").value.trim();
    if (!email || !password || !name) return alert("Nhập đầy đủ thông tin!");
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      localStorage.setItem("nk-user-name", name);
      alert("Đăng ký thành công!");
      window.location.href = "analytics.html";
    } catch (err) {
      alert("Lỗi đăng ký: " + err.message);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = q("#login-email").value.trim();
    const password = q("#login-password").value.trim();
    if (!email || !password) return alert("Nhập email và mật khẩu!");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Đăng nhập thành công!");
      window.location.href = "analytics.html";
    } catch (err) {
      alert("Lỗi đăng nhập: " + err.message);
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
   JOURNAL SYSTEM (per user)
   ======================= */
let entries = [];
let chart = null;

async function fetchEntries(user) {
  if (!user) return [];
  try {
    const colRef = collection(db, "users", user.uid, "journalEntries");
    const qref = query(colRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(qref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("❌ fetchEntries failed:", err);
    return [];
  }
}

async function addEntry(user, entry) {
  if (!user) return;
  try {
    const colRef = collection(db, "users", user.uid, "journalEntries");
    await addDoc(colRef, { ...entry, createdAt: serverTimestamp() });
  } catch (err) {
    console.error("❌ addEntry failed:", err);
  }
}

function renderEntries() {
  const list = q("#journal-list");
  if (!list) return;
  if (!entries.length) {
    list.innerHTML = `<li class="muted">Chưa có nhật ký nào — hãy thêm ngay!</li>`;
    return;
  }
  list.innerHTML = entries.slice(0, 10).map(e => `
    <li>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <strong>${escapeHtml(e.date)}</strong>
        <span style="font-weight:700;color:var(--accent)">⭐ ${e.rating || 0}/10</span>
      </div>
      <div style="font-weight:700">${escapeHtml(e.goal)}</div>
      <div style="color:var(--muted);margin-top:4px">${escapeHtml(e.activities || "Không ghi")}</div>
    </li>`).join("");
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
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 3,
        fill: true,
        backgroundColor: "rgba(79,70,229,0.12)",
        borderColor: "rgba(79,70,229,1)"
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, max: 10 } }
    }
  });
}

/* =======================
   ON AUTH STATE CHANGE
   ======================= */
onAuthStateChanged(auth, async (user) => {
  const name = localStorage.getItem("nk-user-name") || (user?.email || "");
  document.querySelectorAll(".brand").forEach(el => el.innerHTML = `NK<span>NL</span> — ${escapeHtml(name)}`);

  if (!user) {
    if (window.location.pathname.endsWith("analytics.html")) {
      window.location.href = "login.html";
    }
    return;
  }

  // Load entries
  entries = await fetchEntries(user);
  renderEntries();
  updateChart();

  // Realtime updates
  try {
    const colRef = collection(db, "users", user.uid, "journalEntries");
    const qref = query(colRef, orderBy("createdAt", "desc"));
    onSnapshot(qref, snap => {
      entries = snap.docs.map(d => d.data());
      renderEntries();
      updateChart();
    });
  } catch (err) {
    console.warn("Realtime error:", err);
  }

  // Add entry handler
  const form = q("#journal-form");
  if (form) {
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const date = q("#date").value;
      const goal = q("#goal").value.trim();
      const activities = q("#activities").value.trim();
      const rating = Number(q("#rating").value || 0);
      if (!date || !goal) return alert("Nhập đầy đủ ngày và mục tiêu!");
      const entry = { date, goal, activities, rating };
      entries.unshift(entry);
      renderEntries();
      updateChart();
      form.reset();
      await addEntry(user, entry);
    });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("mobile-open");
    });
  }
});

console.log("🔥 NK-NL main.js loaded successfully");

