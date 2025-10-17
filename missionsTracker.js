import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const LS_COMPLETE = 'missions_state';

// 🔒 Đánh dấu nhiệm vụ hoàn thành (chỉ khi người dùng thật sự làm)
export async function markMissionDone(missionId) {
  const map = JSON.parse(localStorage.getItem(LS_COMPLETE) || "{}");

  // Nếu nhiệm vụ chưa có -> thêm vào danh sách
  if (!map[missionId]) {
    map[missionId] = { done: true, claimed: false, timestamp: Date.now() };
  } else if (!map[missionId].done) {
    map[missionId].done = true;
    map[missionId].timestamp = Date.now();
  }

  localStorage.setItem(LS_COMPLETE, JSON.stringify(map));

  // Cập nhật Firebase nếu người dùng đã đăng nhập
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    const db = getFirestore();
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : {};
    const missions = data.missions || {};
    if (!missions[missionId] || !missions[missionId].done) {
      missions[missionId] = { done: true, claimed: missions[missionId]?.claimed || false, timestamp: Date.now() };
      await setDoc(ref, { missions }, { merge: true });
    }
  }
}
