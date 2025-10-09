// main.js — Firebase + user-based storage + UI logic (final stable version)

/* =======================
   FIREBASE CONFIGURATION
   ======================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
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

let db = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.info("✅ Firebase initialized successfully");
} catch (err) {
  console.warn("⚠️ Firebase init failed (offline mode)", err);
}

/* =======================
   HELPERS
   ======================= */
const escapeHtml = (text = '') => {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
};
const q = (s) => document.querySelector(s);

/* =======================
   THEME TOGGLE (stable)
   ======================= */
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.querySelector("#theme-toggle");
  const applyTheme = (theme) => {
    if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
  };

  let theme = localStorage.getItem("theme") || "dark";
  applyTheme(theme);
  if (themeToggle) {
    themeToggle.textContent = theme === "light" ? "🌞" : "🌙";
    themeToggle.addEventListener("click", () => {
      theme = theme === "light" ? "dark" : "light";
      applyTheme(theme);
      localStorage.setItem("theme", theme);
      themeToggle.textContent = theme === "light" ? "🌞" : "🌙";
    });
  }
});

/* =======================
   USER AUTH (local + uid)
   ======================= */
const USER_KEY = "nk-user";
function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "{}"); }
  catch { return {}; }
}
function saveUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }

(function showUserBrand() {
  const u = getUser();
  if (u?.name) {
    document.querySelectorAll(".brand").forEach(el => {
      el.innerHTML = `NK<span>NL</span> — ${escapeHtml(u.name)}`;
    });
  }
})();

/* =======================
   JOURNAL DATA (per-user Firestore)
   ======================= */
let entries = [];
let chart = null;
const journalList = q("#journal-list");
const journalForm = q("#journal-form");

/* ----- Firestore CRUD ----- */
async function fetchEntriesFromFirestore() {
  const user = getUser();
  if (!db || !user?.uid) return [];
  try {
    const colRef = collection(db, "users", user.uid, "journalEntries");
    const qref = query(colRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(qref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("❌ fetchEntriesFromFirestore failed:", err);
    return [];
  }
}

async function addEntryToFirestore(entry) {
  const user = getUser();
  if (!db || !user?.uid) return null;
  try {
    const colRef = collection(db, "users", user.uid, "journalEntries");
    const docRef = await addDoc(colRef, { ...entry, createdAt: serverTimestamp() });
    return docRef.id;
  } catch (err) {
    console.error("❌ addEntryToFirestore failed:", err);
    return null;
  }
}

/* ----- Initialization ----- */
document.addEventListener("DOMContentLoaded", async () => {
  try { entries = JSON.parse(localStorage.getItem("journalEntries") || "[]"); }
  catch { entries = []; }

  renderEntries();
  updateChart();

  const user = getUser();
  if (db && user?.uid) {
    const remote = await fetchEntriesFromFirestore();
    if (remote?.length) {
      entries = remote.map(r => ({
        date: r.date || (r.createdAt?.toDate ? r.createdAt.toDate().toISOString().slice(0, 10) : ""),
        goal: r.goal || "",
        activities: r.activities || "",
        rating: typeof r.rating === "number" ? r.rating : parseInt(r.rating || 0, 10)
      }));
      localStorage.setItem("journalEntries", JSON.stringify(entries));
      renderEntries();
      updateChart();
    }

    // Realtime update listener
    try {
      const colRef = collection(db, "users", user.uid, "journalEntries");
      const qref = query(colRef, orderBy("createdAt", "desc"));
      onSnapshot(qref, snap => {
        entries = snap.docs.map(d => d.data());
        localStorage.setItem("journalEntries", JSON.stringify(entries));
        renderEntries();
        updateChart();
      });
    } catch (err) {
      console.warn("⚠️ Realtime listener error:", err);
    }
  }
});

/* ----- Submit Form ----- */
if (journalForm) {
  journalForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const date = q("#date").value;
    const goal = q("#goal").value.trim();
    const activities = q("#activities").value.trim();
    const rating = Number(q("#rating").value || 0);

    if (!date || !goal || !rating) {
      alert("Vui lòng nhập ngày, mục tiêu và đánh giá (1-10).");
      return;
    }

    const entry = { date, goal, activities, rating };
    entries.unshift(entry);
    entries = entries.slice(0, 200);
    localStorage.setItem("journalEntries", JSON.stringify(entries));
    renderEntries();
    updateChart();
    journalForm.reset();

    const id = await addEntryToFirestore(entry);
    if (!id) console.warn("⚠️ Lưu Firestore thất bại, dữ liệu chỉ ở local.");
  });
}

/* ----- Render UI ----- */
function renderEntries() {
  if (!journalList) return;
  if (!entries?.length) {
    journalList.innerHTML = `<li class="muted">Chưa có nhật ký nào — hãy thêm ngay!</li>`;
    return;
  }
  journalList.innerHTML = entries.slice(0, 10).map(e => `
    <li>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <strong>${escapeHtml(e.date)}</strong>
        <span style="font-weight:700;color:var(--accent)">
          ${escapeHtml("⭐ " + (e.rating || 0) + "/10")}
        </span>
      </div>
      <div style="font-weight:700">${escapeHtml(e.goal)}</div>
      <div style="color:var(--muted);margin-top:6px">
        ${escapeHtml(e.activities || "Không ghi")}
      </div>
    </li>`).join("");
}

/* ----- Chart.js progress ----- */
function updateChart() {
  try {
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
          fill: true,
          borderWidth: 2,
          pointRadius: 3,
          backgroundColor: "rgba(79,70,229,0.12)",
          borderColor: "rgba(79,70,229,1)"
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true, max: 10 } }
      }
    });
  } catch (err) {
    console.warn("⚠️ updateChart error:", err);
  }
}

/* =======================
   CONTACT FORM
   ======================= */
const contactForm = q("#contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const name = q("#name").value.trim();
    const email = q("#email").value.trim();
    const message = q("#message").value.trim();
    if (!name || !email || !message) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    const successBox = q("#contact-success");
    if (successBox) successBox.classList.remove("hidden");
    contactForm.reset();

    const user = getUser();
    if (db && user?.uid) {
      try {
        await addDoc(collection(db, "users", user.uid, "contacts"), {
          name, email, message, createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("❌ save contact failed:", err);
      }
    }
    setTimeout(() => successBox && successBox.classList.add("hidden"), 3000);
  });
}

/* =======================
   LOGIN FLOW
   ======================= */
const loginForm = q("#login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const name = q("#login-username").value.trim();
    const pass = q("#login-password").value.trim();
    if (!name || !pass) return alert("Vui lòng nhập đầy đủ.");

    // Tạo UID ngắn gọn duy nhất từ tên (base64)
    const uid = btoa(name).replace(/=/g, "").slice(0, 10);
    saveUser({ uid, name });
    alert("Đăng nhập thành công!");
    window.location.href = "analytics.html";
  });
}

console.log("🔥 main.js loaded successfully (final build)");
