import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const LS_COMPLETE = 'missions_state';

export async function markMissionDone(missionId) {
  const map = JSON.parse(localStorage.getItem(LS_COMPLETE) || "{}");
  if (!map[missionId]) map[missionId] = { done: true, claimed: false };
  else map[missionId].done = true;
  localStorage.setItem(LS_COMPLETE, JSON.stringify(map));

  // cập nhật Firebase nếu có đăng nhập
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    const db = getFirestore();
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : {};
    const missions = data.missions || {};
    missions[missionId] = { done: true, claimed: missions[missionId]?.claimed || false };
    await setDoc(ref, { missions }, { merge: true });
  }
}
