// =========================
// NĂNG LỰC TRACKER (main.js)
// Firebase + Auth + Firestore + Chart + AI Loading
// =========================

// ---- FIREBASE INIT ----
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, orderBy, query,
  serverTimestamp, doc, setDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// ---- CONFIG ----
const firebaseConfig = {
  apiKey: "AIzaSyCtp4izpF1GCH2qWpeLtZOdk33A_iNKzqg",
  authDomain: "nknl-d7b54.firebaseapp.com",
  projectId: "nknl-d7b54",
  storageBucket: "nknl-d7b54.firebasestorage.app",
  messagingSenderId: "792185587281",
  appId: "1:792185587281:web:585e98f2f87d7d59031a70",
  measurementId: "G-TC7XHSSCBX",
};

// ---- INIT ONCE ----
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
console.log("✅ Firebase ready!");

// ---- HELPERS ----
const q = (s) => document.querySelector(s);
const escapeHtml = (txt = "") => {
  const div = document.createElement("div");
  div.textContent = txt;
  return div.innerHTML;
};

// =======================
// THEME TOGGLE
// =======================
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = q("#theme-toggle");
  const applyTheme = (t) => document.documentElement.setAttribute("data-theme", t);
  let theme = localStorage.getItem("theme") || "dark";
  applyTheme(theme);
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "🌙" : "🌞";
    themeToggle.addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", theme);
      applyTheme(theme);
      themeToggle.textContent = theme === "dark" ? "🌙" : "🌞";
    });
  }
});

// =======================
// AUTH
// =======================
const registerForm = q("#register-form");
const loginForm = q("#login-form");
const logoutBtn = q("#logout-btn");

// ---- REGISTER ----
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = q("#register-name").value.trim();
    const email = q("#register-email").value.trim();
    const pass = q("#register-password").value.trim();
    if (!name || !email || !pass) return alert("Điền đủ thông tin!");

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      await setDoc(doc(db, "users", userCred.user.uid), {
        name, email, createdAt: serverTimestamp(),
      });
      localStorage.setItem("nk-user-name", name);
      localStorage.setItem("nk-user-email", email);
      localStorage.setItem("nk-user-pass", pass);
      alert("✅ Đăng ký thành công!");
      window.location.href = "analytics.html";
    } catch (err) {
      console.error(err);
      alert("Lỗi đăng ký: " + err.message);
    }
  });
}

// ---- LOGIN ----
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = q("#login-email").value.trim();
    const pass = q("#login-password").value.trim();
    if (!email || !pass) return alert("Điền đủ thông tin!");

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      localStorage.setItem("nk-user-email", email);
      localStorage.setItem("nk-user-pass", pass);
      alert("✅ Đăng nhập thành công!");
      window.location.href = "analytics.html";
    } catch (err) {
      console.error(err);
      alert("❌ " + (err?.message || "Lỗi đăng nhập."));
    }
  });
}

// ---- LOGOUT ----
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    localStorage.removeItem("nk-user-pass");
    alert("Đã đăng xuất!");
    window.location.href = "login.html";
  });
}

// =======================
// AUTO LOGIN
// =======================
window.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("nk-user-email");
  const pass = localStorage.getItem("nk-user-pass");
  if (email && pass && !auth.currentUser) {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      console.log("🔁 Auto signed in:", email);
    } catch {
      localStorage.removeItem("nk-user-pass");
    }
  }
});

// =======================
// JOURNAL + CHART
// =======================
let entries = [];
let chart = null;

function renderEntries() {
  const list = q("#journal-list");
  if (!list) return;
  list.innerHTML = entries.length
    ? entries.slice(0, 10).map(e => `
      <li>
        <strong>${escapeHtml(e.date)}</strong> — ⭐ ${e.rating}/10<br>
        <em>${escapeHtml(e.goal)}</em><br>
        Hoạt động: ${escapeHtml(e.activities || "Không ghi")}
      </li>`).join("")
    : "<li>Chưa có dữ liệu</li>";
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
        borderColor: "#4f46e5",
        backgroundColor: "rgba(99,102,241,0.2)",
        fill: true,
        tension: 0.3,
      }],
    },
    options: { scales: { y: { beginAtZero: true, max: 10 } } },
  });
}

// =======================
// AI ANALYSIS (v2) — có hiệu ứng loading
// =======================
function createAILoadingAnimation(container) {
  container.innerHTML = `
    <div class="ai-loading">
      <div class="spinner"></div>
      <p>Đang phân tích dữ liệu bằng AI...</p>
    </div>`;
}

async function analyzeAI(entries) {
  const resultBox = q("#ai-result");
  if (!resultBox) return;
  createAILoadingAnimation(resultBox);
  return new Promise((resolve) => {
    setTimeout(() => {
      const avg = entries.reduce((a, b) => a + b.rating, 0) / entries.length;
      const trend = avg > 6 ? "📈 Tiến bộ nhanh" : avg > 4 ? "📊 Ổn định" : "⚠️ Cần cố gắng hơn";
      let advice = "Hãy tiếp tục kiên trì và thử thách bản thân với mục tiêu cao hơn!";
      if (avg < 4) advice = "Tập trung vào một kỹ năng, luyện tập đều mỗi ngày.";
      if (avg > 7) advice = "Hiệu suất tốt! Hãy thử mở rộng lĩnh vực khác để phát triển toàn diện.";

      resultBox.innerHTML = `
        <strong>📊 Phân tích tổng quát:</strong><br>
        Điểm TB: <b>${avg.toFixed(2)}/10</b><br>
        Xu hướng: ${trend}<br><br>
        <strong>💡 Gợi ý học tập:</strong><br>${advice}`;
      resolve();
    }, 2000);
  });
}

// =======================
// ON AUTH CHANGE
// =======================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (window.location.pathname.includes("analytics.html")) {
      window.location.href = "login.html";
    }
    return;
  }

  // Gắn tên người dùng
  const name = localStorage.getItem("nk-user-name") || user.email;
  document.querySelectorAll(".brand").forEach(
    (el) => (el.innerHTML = `NK<span>NL</span> — ${escapeHtml(name)}`)
  );

  // Load dữ liệu nhật ký
  const colRef = collection(db, "users", user.uid, "journalEntries");
  onSnapshot(query(colRef, orderBy("createdAt", "desc")), (snap) => {
    entries = snap.docs.map((d) => d.data());
    renderEntries();
    updateChart();
  });

  // Submit form nhật ký
  const form = q("#journal-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const date = q("#date").value;
      const goal = q("#goal").value;
      const activities = q("#activities").value;
      const rating = Number(q("#rating").value || 0);
      if (!date || !goal) return alert("Nhập đủ thông tin!");
      await addDoc(colRef, { date, goal, activities, rating, createdAt: serverTimestamp() });
      form.reset();
    });
  }

  // Nút phân tích AI
  const analyzeBtn = q("#analyze-btn");
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", async () => {
      if (!entries.length) return alert("Chưa có dữ liệu để phân tích!");
      await analyzeAI(entries);
    });
  }
});

console.log("🔥 main.js loaded successfully");
