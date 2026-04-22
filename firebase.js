/**
<<<<<<< HEAD
 * JS Quest — Firebase Module (Final)
 * Features: Auth, Firestore sync, Leaderboard, Password Reset
=======
 * JS Quest — Firebase Module
 * Handles: Auth (email/password), Firestore sync, Leaderboard
>>>>>>> 50885d639fc7beb3e55c1a60f11acd0f2a1260b9
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
<<<<<<< HEAD
  sendPasswordResetEmail,
=======
>>>>>>> 50885d639fc7beb3e55c1a60f11acd0f2a1260b9
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

<<<<<<< HEAD
/* ── CONFIG ── */
const firebaseConfig = {
  apiKey:            "AIzaSyBbSJCqHvmN4Qhu9ZEbed05Fj2b2SlSbsI",
  authDomain:        "js-quest-eebd4.firebaseapp.com",
  projectId:         "js-quest-eebd4",
  storageBucket:     "js-quest-eebd4.firebasestorage.app",
  messagingSenderId: "6377856929",
  appId:             "1:6377856929:web:b2f8494474b111a1ed75e0",
  measurementId:     "G-74BCLLSC2R",
};

=======
/* ============================================================
   🔧 YOUR FIREBASE CONFIG — UPDATED WITH YOUR PROJECT DATA
============================================================ */
// For Firebase JS SDK v7.20.0 and later, measurementId is optional


const firebaseConfig = {
  apiKey: "AIzaSyBbSJCqHvmN4Qhu9ZEbed05Fj2b2SlSbsI",
  authDomain: "js-quest-eebd4.firebaseapp.com",
  projectId: "js-quest-eebd4",
  storageBucket: "js-quest-eebd4.firebasestorage.app",
  messagingSenderId: "6377856929",
  appId: "1:6377856929:web:b2f8494474b111a1ed75e0",
  measurementId: "G-74BCLLSC2R"
}



/* ============================================================
   INIT
============================================================ */
>>>>>>> 50885d639fc7beb3e55c1a60f11acd0f2a1260b9
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

<<<<<<< HEAD
window.currentUser = null;
window.fbReady     = false;

/* ── AUTH STATE LISTENER ── */
=======
/* ============================================================
   CURRENT USER — reactive reference shared with script.js
============================================================ */
window.currentUser = null; 
window.fbReady = false;    

>>>>>>> 50885d639fc7beb3e55c1a60f11acd0f2a1260b9
onAuthStateChanged(auth, async (user) => {
  window.fbReady = true;

  if (user) {
    window.currentUser = user;
<<<<<<< HEAD
    try { await loadUserFromFirestore(user.uid); } catch(e) {
      console.warn('[JSQuest] Firestore load skipped:', e.message);
    }
    showApp(user);
  } else {
    window.currentUser = null;
    showLanding();
  }
});

/* ── SIGN UP ── */
export async function signUp(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  try { await updateProfile(cred.user, { displayName: name }); } catch(_) {}
  // Firestore write — fire and forget
  writeUserDoc(cred.user.uid, name, cred.user.email);
  return cred.user;
}

async function writeUserDoc(uid, name, email, attempt = 1) {
  try {
    await setDoc(doc(db, 'users', uid), {
      uid, name: name||'Player', email: email||'',
      xp:0, level:1,
      completedTopics:[], completedChallenges:[],
      quizBestScore:0, quizTotalPlayed:0, achievements:[],
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch(err) {
    if (attempt < 5) setTimeout(() => writeUserDoc(uid, name, email, attempt+1), 400*attempt);
  }
}

/* ── LOG IN ── */
=======
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

>>>>>>> 50885d639fc7beb3e55c1a60f11acd0f2a1260b9
export async function logIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

<<<<<<< HEAD
/* ── LOG OUT ── */
=======
>>>>>>> 50885d639fc7beb3e55c1a60f11acd0f2a1260b9
export async function logOut() {
  await signOut(auth);
}

<<<<<<< HEAD
/* ── FORGOT PASSWORD ── */
export async function sendPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

/* ── LOAD FROM FIRESTORE ── */
export async function loadUserFromFirestore(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return;
  const d = snap.data();
  const s = window.state;
  if (!s) return;
  if (d.xp                  != null) s.xp                  = d.xp;
  if (d.level               != null) s.level               = d.level;
  if (Array.isArray(d.completedTopics))     s.completedTopics     = d.completedTopics;
  if (Array.isArray(d.completedChallenges)) s.completedChallenges = d.completedChallenges;
  if (d.quizBestScore       != null) s.quizBestScore       = d.quizBestScore;
  if (d.quizTotalPlayed     != null) s.quizTotalPlayed     = d.quizTotalPlayed;
  if (Array.isArray(d.achievements))        s.achievements        = d.achievements;
  if (typeof window.saveStateLocal === 'function') window.saveStateLocal();
  if (typeof window.updateDashboard === 'function') window.updateDashboard();
}

/* ── SAVE TO FIRESTORE ── */
=======
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

>>>>>>> 50885d639fc7beb3e55c1a60f11acd0f2a1260b9
export async function saveUserToFirestore() {
  if (!window.currentUser) return;
  const uid = window.currentUser.uid;
  const s   = window.state;
<<<<<<< HEAD
  if (!s) return;
  try {
    await setDoc(doc(db, 'users', uid), {
      uid,
      name:                window.currentUser.displayName || 'Player',
      email:               window.currentUser.email || '',
      xp:                  s.xp ?? 0,
      level:               s.level ?? 1,
      completedTopics:     s.completedTopics    ?? [],
      completedChallenges: s.completedChallenges?? [],
      quizBestScore:       s.quizBestScore      ?? 0,
      quizTotalPlayed:     s.quizTotalPlayed    ?? 0,
      achievements:        s.achievements       ?? [],
      updatedAt:           serverTimestamp(),
    }, { merge: true });
  } catch(_) {}
}

/* ── LEADERBOARD ── */
export async function fetchLeaderboard() {
  const q    = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({ rank: i+1, ...d.data() }));
}

/* ── UI: Show App (logged in) ── */
function showApp(user) {
  // Hide landing page, show app + navbar + footer
  setDisplay('landing-page', 'none');
  setDisplay('auth-modal',   'none');
  setDisplay('navbar',       '');
  setDisplay('app',          '');
  setDisplay('app-footer',   '');

  // Close auth modal if open
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';

  // Update nav UI with user info
  updateNavUI(user);

  // Init the app (or refresh dashboard if already inited)
=======

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

>>>>>>> 50885d639fc7beb3e55c1a60f11acd0f2a1260b9
  if (typeof window.init === 'function' && !window._appInited) {
    window._appInited = true;
    window.init();
  } else if (typeof window.updateDashboard === 'function') {
    window.updateDashboard();
  }
}

<<<<<<< HEAD
/* ── UI: Show Landing (logged out) ── */
function showLanding() {
  setDisplay('landing-page', '');
  setDisplay('navbar',       'none');
  setDisplay('app',          'none');
  setDisplay('app-footer',   'none');
  // Reset app init flag so it re-initializes on next login
  window._appInited = false;
}

function updateNavUI(user) {
  const display = user.displayName || user.email?.split('@')[0] || 'Player';
  const initial = display[0].toUpperCase();

  setText('nav-user-name',  display.split(' ')[0]);
  setText('nav-avatar',     initial);
  setText('uwc-avatar',     initial);
  setText('dropdown-avatar', initial);
  setText('dropdown-name',  display);
  setText('dropdown-email', user.email || '');
  // Welcome card
  const hour = new Date().getHours();
  const greet = hour<12?'Good morning':'Good afternoon';
  setText('uwc-greeting', greet+',');
  setText('uwc-name',     display);
}

function setDisplay(id, val) {
  const el = document.getElementById(id);
  if (el) el.style.display = val;
}
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ── Window Exports ── */
window.saveUserToFirestore = saveUserToFirestore;
window.fetchLeaderboard    = fetchLeaderboard;
window.fbSignUp  = signUp;
window.fbLogIn   = logIn;
window.fbLogOut  = logOut;
=======
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
>>>>>>> 50885d639fc7beb3e55c1a60f11acd0f2a1260b9
