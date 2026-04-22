/**
 * JS Quest — Firebase Module
 * Handles: Auth (email/password), Firestore sync, Leaderboard
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ============================================================
   🔧 YOUR FIREBASE CONFIG — UPDATED WITH YOUR PROJECT DATA
============================================================ */
const firebaseConfig = {
  apiKey:            "AIzaSyB-8mxzFyT9auS5vuvjMHtLc80hzep6qzA",
  authDomain:        "js-quest-99f7d.firebaseapp.com",
  projectId:         "js-quest-99f7d",
  storageBucket:     "js-quest-99f7d.firebasestorage.app",
  messagingSenderId: "981981478083",
  appId:             "1:981981478083:web:5b410d833f7647a898f676",
  measurementId:     "G-0QKJD9VDJ1"
};

/* ============================================================
   INIT
============================================================ */
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* ============================================================
   CURRENT USER — reactive reference shared with script.js
============================================================ */
window.currentUser = null; 
window.fbReady = false;    

onAuthStateChanged(auth, async (user) => {
  window.fbReady = true;

  if (user) {
    window.currentUser = user;
    await loadUserFromFirestore(user.uid);
    showApp();
    updateAuthUI(user);
  } else {
    window.currentUser = null;
    showAuthScreen();
  }
});

export async function signUp(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid:                cred.user.uid,
    name,
    email,
    xp:                 0,
    level:              1,
    completedTopics:    [],
    completedChallenges:[],
    quizBestScore:      0,
    quizTotalPlayed:    0,
    achievements:       [],
    createdAt:          serverTimestamp(),
    updatedAt:          serverTimestamp(),
  });
  return cred.user;
}

export async function logIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logOut() {
  await signOut(auth);
}

export async function loadUserFromFirestore(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return;

  const data = snap.data();
  if (typeof window.state !== 'undefined') {
    window.state.xp                  = data.xp                  ?? window.state.xp;
    window.state.level               = data.level               ?? window.state.level;
    window.state.completedTopics     = data.completedTopics     ?? window.state.completedTopics;
    window.state.completedChallenges = data.completedChallenges ?? window.state.completedChallenges;
    window.state.quizBestScore       = data.quizBestScore       ?? window.state.quizBestScore;
    window.state.quizTotalPlayed     = data.quizTotalPlayed     ?? window.state.quizTotalPlayed;
    window.state.achievements        = data.achievements        ?? window.state.achievements;

    if (typeof window.saveState === 'function') window.saveState();
    if (typeof window.updateDashboard === 'function') window.updateDashboard();
  }
}

export async function saveUserToFirestore() {
  if (!window.currentUser) return;
  const uid = window.currentUser.uid;
  const s   = window.state;

  try {
    await updateDoc(doc(db, 'users', uid), {
      xp:                  s.xp,
      level:               s.level,
      completedTopics:     s.completedTopics,
      completedChallenges: s.completedChallenges,
      quizBestScore:       s.quizBestScore,
      quizTotalPlayed:     s.quizTotalPlayed,
      achievements:        s.achievements,
      updatedAt:           serverTimestamp(),
    });
  } catch (err) {
    if (err.code === 'not-found') {
      await setDoc(doc(db, 'users', uid), {
        uid,
        name:  window.currentUser.displayName || 'Anonymous',
        email: window.currentUser.email,
        xp:    s.xp, level: s.level,
        completedTopics: s.completedTopics,
        completedChallenges: s.completedChallenges,
        quizBestScore: s.quizBestScore,
        quizTotalPlayed: s.quizTotalPlayed,
        achievements: s.achievements,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
}

export async function fetchLeaderboard() {
  const q   = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({ rank: i + 1, ...d.data() }));
}

function showApp() {
  const authScreen = document.getElementById('auth-screen');
  const appEl      = document.getElementById('app');
  const navbar     = document.getElementById('navbar');

  if (authScreen) authScreen.style.display = 'none';
  if (appEl)      appEl.style.display      = '';
  if (navbar)     navbar.style.display     = '';

  if (typeof window.init === 'function' && !window._appInited) {
    window._appInited = true;
    window.init();
  } else if (typeof window.updateDashboard === 'function') {
    window.updateDashboard();
  }
}

function showAuthScreen() {
  const authScreen = document.getElementById('auth-screen');
  const appEl      = document.getElementById('app');
  const navbar     = document.getElementById('navbar');

  if (authScreen) authScreen.style.display = '';
  if (appEl)      appEl.style.display      = 'none';
  if (navbar)     navbar.style.display     = 'none';
}

function updateAuthUI(user) {
    const userEmailEl = document.getElementById('user-email');
    if (userEmailEl) userEmailEl.textContent = user.email;
}
