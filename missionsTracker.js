// 📁 missionsTracker.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// 🔥 Khởi tạo Firebase chỉ 1 lần
const firebaseConfig = {
  apiKey: "AIzaSyCtp4izpF1GCH2qWpeLtZOdk33A_iNKzqg",
  authDomain: "nknl-d7b54.firebaseapp.com",
  projectId: "nknl-d7b54"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * ✅ Đánh dấu nhiệm vụ đã hoàn thành
 * @param {string} missionId - ID nhiệm vụ (ví dụ: "m1", "m2", "growth_2")
 */
export async function markMissionDone(missionId) {
  const user = auth.currentUser;
  if (!user) {
    alert("⚠️ Bạn cần đăng nhập để lưu tiến trình nhiệm vụ!");
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};

  const missions = data.missions || {};
  missions[missionId] = { done: true, claimed: false };

  await setDoc(ref, { missions }, { merge: true });
  console.log(`✅ Nhiệm vụ ${missionId} đã được đánh dấu hoàn thành.`);
}
