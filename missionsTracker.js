// missionsTracker.js
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

/**
 * Đánh dấu nhiệm vụ đã hoàn thành
 * @param {string} missionId - ID nhiệm vụ
 */
export async function markMissionDone(missionId) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    alert("⚠️ Bạn cần đăng nhập để lưu tiến độ nhiệm vụ.");
    return;
  }

  const db = getFirestore();
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  const missions = data.missions || {};

  // Nếu nhiệm vụ chưa hoàn thành thì đánh dấu
  if (!missions[missionId] || !missions[missionId].done) {
    missions[missionId] = { done: true, claimed: false, timestamp: Date.now() };
    await setDoc(ref, { missions }, { merge: true });
    console.log(`✅ Đã đánh dấu hoàn thành nhiệm vụ ${missionId}`);
  }
}
