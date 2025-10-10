// =========================
// NĂNG LỰC TRACKER (main.js)
// Firebase + Auth + Firestore + Chart + AI Loading + Theme
// =========================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// --------------------
// 🔹 CONFIG FIREBASE
// --------------------
const firebaseConfig = {
  apiKey: "AIzaSyCtp4izpF1GCH2qWpeLtZOdk33A_iNKzqg",
  authDomain: "nknl-d7b54.firebaseapp.com",
  projectId: "nknl-d7b54",
  storageBucket: "nknl-d7b54.appspot.com",
  messagingSenderId: "792185587281",
  appId: "1:792185587281:web:585e98f2f87d7d59031a70",
  measurementId: "G-TC7XHSSCBX"
};

// --------------------
// 🔹 INIT
// --------------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --------------------
// 🔹 HELPERS
// --------------------
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
// AUTH: REGISTER / LOGIN / LOGOUT
// =======================
const signupBtn = q("#signup-btn");
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const email = q("#email").value.trim();
    const password = q("#password").value.trim();
    if (!email || !password) return alert("Nhập email và mật khẩu!");
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCred.user.uid), { email, createdAt: serverTimestamp() });
      localStorage.setItem("nk-user-email", email);
      localStorage.setItem("nk-user-pass", password);
      alert("✅ Đăng ký thành công!");
      window.location.href = "journal.html";
    } catch (err) { alert("❌ " + err.message); }
  });
}

const loginBtn = q("#login-btn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = q("#email").value.trim();
    const password = q("#password").value.trim();
    if (!email || !password) return alert("Nhập email và mật khẩu!");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("nk-user-email", email);
      localStorage.setItem("nk-user-pass", password);
      window.location.href = "journal.html";
    } catch (err) { alert("❌ " + err.message); }
  });
}

const logoutBtn = q("#logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    localStorage.removeItem("nk-user-pass");
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
    try { await signInWithEmailAndPassword(auth, email, pass); }
    catch { localStorage.removeItem("nk-user-pass"); }
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
    ? entries.map(e => `<li><strong>${escapeHtml(e.date)}</strong> — ⭐ ${e.rating}/10<br><em>${escapeHtml(e.goal)}</em><br>Hoạt động: ${escapeHtml(e.activities||"Không ghi")}</li>`).join("")
    : "<li>Chưa có dữ liệu</li>";
}

function updateChart() {
  const ctx = q("#progressChart");
  if (!ctx || typeof Chart === "undefined") return;
  const labels = entries.map(e => e.date).reverse();
  const data = entries.map(e => e.rating).reverse();
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets:[{label:"Điểm năng lực", data, borderColor:"#4f46e5", fill:false, tension:0.3}] },
    options: { scales:{y:{beginAtZero:true, max:10}}}
  });
}

// =======================
// AI ANALYSIS
// =======================
function createAILoading(container) {
  container.innerHTML = `<div class="ai-loading"><div class="spinner"></div><p>Đang phân tích dữ liệu bằng AI...</p></div>`;
}

async function analyzeAI() {
  const resultBox = q("#ai-result");
  if (!resultBox) return;
  createAILoading(resultBox);
  return new Promise(resolve => {
    setTimeout(() => {
      const avg = entries.reduce((a,b)=>a+b.rating,0)/entries.length;
      const trend = avg>6?"📈 Tiến bộ nhanh":avg>4?"📊 Ổn định":"⚠️ Cần cố gắng hơn";
      let advice = avg<4?"Tập trung vào 1 kỹ năng, luyện tập đều mỗi ngày.":avg>7?"Hiệu suất tốt! Mở rộng lĩnh vực khác để phát triển toàn diện.":"Hãy tiếp tục kiên trì và thử thách bản thân!";
      resultBox.innerHTML = `<strong>📊 Phân tích tổng quát:</strong><br>Điểm TB: <b>${avg.toFixed(2)}/10</b><br>Xu hướng: ${trend}<br><br><strong>💡 Gợi ý học tập:</strong><br>${advice}`;
      resolve();
    },2000);
  });
}

// =======================
// ON AUTH STATE
// =======================
onAuthStateChanged(auth, async user => {
  if (!user) {
    if (window.location.pathname.includes("journal.html")) window.location.href="login.html";
    return;
  }

  // Load journal realtime
  const colRef = collection(db, "users", user.uid, "journals");
  onSnapshot(query(colRef, orderBy("createdAt","desc")), snap => {
    entries = snap.docs.map(d=>d.data());
    renderEntries();
    updateChart();
  });

  // Submit form
  const form = q("#journal-form");
  if (form) form.addEventListener("submit", async e=>{
    e.preventDefault();
    const date = q("#date").value;
    const goal = q("#goal").value;
    const activities = q("#activities").value;
    const rating = Number(q("#rating").value||0);
    if (!date||!goal) return alert("Nhập đủ thông tin!");
    await addDoc(colRef,{date,goal,activities,rating,createdAt:serverTimestamp()});
    form.reset();
  });

  // AI analyze
  const analyzeBtn = q("#analyze-btn");
  if (analyzeBtn) analyzeBtn.addEventListener("click", async ()=>{
    if(!entries.length) return alert("Chưa có dữ liệu để phân tích!");
    await analyzeAI();
  });
});

console.log("🔥 main.js loaded");
