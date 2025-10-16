// missionsTracker.js
// Central tracker: mark mission done (local + Firestore)
// Usage: import { markMissionDone } from './missionsTracker.js';

import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const LS_COMPLETE = 'missions_complete_local';

export async function markMissionDone(missionId) {
  try {
    // local update
    const raw = JSON.parse(localStorage.getItem(LS_COMPLETE) || "{}");
    const map = raw || {};
    if (!map[missionId]) map[missionId] = { done: true, claimed: false };
    else map[missionId].done = true;
    localStorage.setItem(LS_COMPLETE, JSON.stringify(map));

    // remote update if signed-in
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return { ok: true, source: 'local' };

    const db = getFirestore();
    const uRef = doc(db, 'users', user.uid);
    const uSnap = await getDoc(uRef);
    const uData = uSnap.exists() ? uSnap.data() : {};
    const completed = uData.completed || {};
    // merge: keep claimed if exists
    completed[missionId] = { done: true, claimed: completed[missionId]?.claimed || false };
    await setDoc(uRef, { completed }, { merge: true });
    return { ok: true, source: 'firestore' };
  } catch (err) {
    console.error('markMissionDone err', err);
    return { ok: false, error: err };
  }
}
