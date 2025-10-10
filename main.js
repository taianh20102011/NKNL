// import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
// import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
// import { getFirestore, doc, setDoc, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// const firebaseConfig = {
//   apiKey: "AIzaSyCtp4izpF1GCH2qWpeLtZOdk33A_iNKzqg",
//   authDomain: "nknl-d7b54.firebaseapp.com",
//   projectId: "nknl-d7b54",
//   storageBucket: "nknl-d7b54.firebasestorage.app",
//   messagingSenderId: "792185587281",
//   appId: "1:792185587281:web:585e98f2f87d7d59031a70",
//   measurementId: "G-TC7XHSSCBX"
// };

// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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

// ===== BIẾN TOÀN CỤC =====
let progressChartInstance = null;

// (phần code đăng ký, đăng nhập, form, loadJournal... giữ nguyên)

// ===== ĐĂNG KÝ =====
const signupBtn = document.getElementById("signup-btn");
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      await setDoc(doc(db, "users", uid), { email });
      document.getElementById("auth-message").innerText = "Đăng ký thành công!";
    } catch (error) {
      document.getElementById("auth-message").innerText = error.message;
    }
  });
}

// ===== ĐĂNG NHẬP =====
const loginBtn = document.getElementById("login-btn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "journal.html";
    } catch (error) {
      document.getElementById("auth-message").innerText = error.message;
    }
  });
}

// ===== KIỂM TRA TRẠNG THÁI NGƯỜI DÙNG =====
onAuthStateChanged(auth, (user) => {
  if (document.getElementById("journal-form")) {
    if (!user) window.location.href = "login.html";
    else loadJournal(user.uid);
  }
});

// ===== ĐĂNG XUẤT =====
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => signOut(auth));
}

// ===== LƯU NHẬT KÝ =====
// ===== LƯU NHẬT KÝ =====
async function saveJournal(uid, data) {
  try {
    // Lưu đúng đường dẫn khớp với Firestore rules
    const journalRef = collection(db, "users", uid, "journalEntries");
    await addDoc(journalRef, {
      ...data,
      createdAt: new Date().toISOString()
    });
    console.log("✅ Nhật ký đã được lưu!");
  } catch (error) {
    console.error("❌ Lỗi khi lưu nhật ký:", error);
    alert("Không thể lưu nhật ký: " + error.message);
  }
}

// ===== XỬ LÝ FORM =====
const journalForm = document.getElementById("journal-form");
if (journalForm) {
  journalForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("Vui lòng đăng nhập!");
    const data = {
      date: document.getElementById("date").value,
      goal: document.getElementById("goal").value,
      activities: document.getElementById("activities").value,
      rating: parseInt(document.getElementById("rating").value),
    };
    await saveJournal(user.uid, data);
    alert("Lưu thành công!");
    journalForm.reset();
    loadJournal(user.uid);
  });
}

// ===== HIỂN THỊ NHẬT KÝ & VẼ BIỂU ĐỒ =====
async function loadJournal(uid) {
  const q = collection(db, "users", uid, "journalEntries");
  const querySnapshot = await getDocs(q);
  const logs = [];
  querySnapshot.forEach((doc) => logs.push(doc.data()));

  // Hiển thị danh sách nhật ký
  const list = document.getElementById("journal-list");
  list.innerHTML = "";
  logs.forEach((log) => {
    const li = document.createElement("li");
    li.textContent = `${log.date} - ${log.goal} (${log.rating}/10)`;
    list.appendChild(li);
  });

  // Vẽ biểu đồ tiến bộ
  const ctx = document.getElementById("progressChart");

  // Nếu đã có biểu đồ cũ thì hủy trước khi tạo mới
  if (progressChartInstance) {
    progressChartInstance.destroy();
  }

  progressChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: logs.map(l => l.date),
      datasets: [{
        label: "Điểm năng lực",
        data: logs.map(l => l.rating),
        borderColor: "#4f46e5",
        tension: 0.3,
        fill: false,
        pointRadius: 5,
        pointBackgroundColor: "#6366f1"
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 10
        }
      },
      plugins: {
        legend: { display: true },
        tooltip: { mode: 'index' }
      }
    }
  });
}

// =======================
// THEME SWITCHER
// =======================
const q = (sel) => document.querySelector(sel);

document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = q("#theme-toggle");
  const applyTheme = (theme) => {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
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
// 🌟 Navbar toggle for mobile
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("mobile-open");
      toggle.textContent = open ? "✕" : "☰";
    });

    // Đóng menu khi click ngoài khu vực menu
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && e.target !== toggle && menu.classList.contains("mobile-open")) {
        menu.classList.remove("mobile-open");
        toggle.textContent = "☰";
      }
    });
  }
});

