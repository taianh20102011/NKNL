// missionsTracker.js
// ✅ Hệ thống theo dõi nhiệm vụ trung tâm (đồng bộ local + Firestore)

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
const LS_MISSIONS = 'missions_state';

/**
 * Ghi nhận rằng người dùng đã hoàn thành nhiệm vụ
 * @param {string} missionId - ID nhiệm vụ
 */
export async function markMissionDone(missionId) {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_MISSIONS) || "{}");
    const state = raw || {};
    if (!state[missionId]) state[missionId] = { done: true, claimed: false };
    else state[missionId].done = true;
    localStorage.setItem(LS_MISSIONS, JSON.stringify(state));

    // nếu đã đăng nhập thì ghi lên Firestore
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return { ok: true, local: true };

    const db = getFirestore();
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : {};
    const missions = data.missions || {};
    missions[missionId] = { done: true, claimed: missions[missionId]?.claimed || false };
    await setDoc(ref, { missions }, { merge: true });
    return { ok: true, remote: true };
  } catch (err) {
    console.error('markMissionDone error', err);
    return { ok: false, error: err };
  }
}
